# backend/app/routers/ws_audio.py
"""
WebSocket Audio Endpoint — SIH-26104
======================================

Endpoint: ws://localhost:8000/ws/audio

Sliding-window pipeline:
  Browser (binary WebM/Opus chunks, ~400ms each)
      ↓ WebSocket binary frames
  SlidingWindowBuffer.add_chunk(chunk)
      ↓ returns audio bytes every STEP_SIZE new chunks (once window is full)
  ml_interface.run_inference(audio_window) → MLResult
      ↓
  risk_engine.calculate_risk(ml_result)   → RiskResult
      ↓ JSON over WebSocket
  React dashboard (live update, no page refresh)

JSON response format:
  {
    "timestamp":         float,
    "spoof_probability": float,   # 0.0–1.0
    "speaker_similarity":float,   # 0.0–1.0
    "prosodic_anomaly":  float,   # 0.0–1.0
    "phonetic_evidence": null,    # reserved for future ML integration
    "context_risk":      float,   # 0.0–1.0
    "risk_score":        int,     # 0–100
    "risk_level":        str      # "SAFE" | "SUSPICIOUS" | "CRITICAL"
  }

Warmup phase:
  The first prediction is sent only after the window fills (WINDOW_SIZE chunks).
  A "warming_up" status message is sent on each chunk during the warmup phase
  so the frontend knows the pipeline is active but inference hasn't started yet.
"""

from __future__ import annotations

import json
import logging
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.audio_processor import SlidingWindowBuffer
from app.services.ml_interface import run_inference
from app.services.risk_engine import calculate_risk
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/audio")
async def websocket_audio(websocket: WebSocket):
    """
    Main WebSocket endpoint for real-time sliding-window audio analysis.

    Accepts binary audio chunks from the browser MediaRecorder.
    Uses a SlidingWindowBuffer to accumulate a rolling window of audio,
    then runs Mock ML inference and returns a risk prediction as JSON.
    """
    await websocket.accept()

    session_id = websocket.query_params.get("session_id") or str(uuid.uuid4())

    buffer = SlidingWindowBuffer(
        session_id=session_id,
        window_size=settings.AUDIO_WINDOW_SIZE,
        step_size=settings.AUDIO_STEP_SIZE,
    )

    logger.info(
        "[WS] Session started: %s | window=%d chunks | step=%d chunks",
        session_id, settings.AUDIO_WINDOW_SIZE, settings.AUDIO_STEP_SIZE,
    )

    # Handshake: tell the client the session ID and pipeline config
    await websocket.send_json({
        "type": "connected",
        "session_id": session_id,
        "window_chunks": settings.AUDIO_WINDOW_SIZE,
        "step_chunks": settings.AUDIO_STEP_SIZE,
        "message": (
            f"Connected. Sliding window: {settings.AUDIO_WINDOW_SIZE} chunks "
            f"/ step {settings.AUDIO_STEP_SIZE} chunks. "
            f"First prediction after ~{settings.AUDIO_WINDOW_SIZE * 0.4:.1f}s."
        ),
    })

    try:
        while True:
            data = await websocket.receive()

            # ── Client disconnected cleanly ─────────────────────────────────
            if data.get("type") == "websocket.disconnect":
                logger.info("[WS] Client disconnected: %s", session_id)
                break

            # ── Binary audio chunk received ─────────────────────────────────
            if "bytes" in data and data["bytes"]:
                chunk: bytes = data["bytes"]

                # Feed chunk into sliding window
                audio_window = buffer.add_chunk(chunk)

                if audio_window is None:
                    # Window still warming up — send status so frontend knows
                    # mic is active and audio is being received
                    if buffer.is_warming_up:
                        await websocket.send_json({
                            "type": "warming_up",
                            "chunks_received": buffer.window_fill,
                            "chunks_needed": settings.AUDIO_WINDOW_SIZE,
                        })
                    # Window is full but step not reached yet — no need to send anything
                    continue

                # ── Run sliding-window ML inference ─────────────────────────
                ml_result = await run_inference(audio_window)

                # ── Risk fusion ──────────────────────────────────────────────
                risk_result = calculate_risk(ml_result)

                # ── Send JSON prediction to browser ──────────────────────────
                await websocket.send_json(risk_result.model_dump())

                logger.info(
                    "[WS] session=%s | score=%d (%s) | "
                    "spoof=%.3f sim=%.3f prosodic=%.3f ctx=%.3f | "
                    "window=%d bytes",
                    session_id,
                    risk_result.risk_score, risk_result.risk_level,
                    ml_result.spoof_probability,
                    ml_result.speaker_similarity,
                    ml_result.prosodic_anomaly,
                    ml_result.context_risk,
                    len(audio_window),
                )

            # ── Text / control message received ─────────────────────────────
            elif "text" in data and data["text"]:
                try:
                    msg = json.loads(data["text"])
                    if msg.get("type") == "end_session":
                        logger.info("[WS] Session end requested: %s", session_id)
                        buffer.clear()
                        await websocket.send_json({
                            "type": "session_ended",
                            "session_id": session_id,
                            "total_chunks": buffer.total_chunks_received,
                        })
                        break
                except json.JSONDecodeError:
                    pass

    except (WebSocketDisconnect, RuntimeError):
        logger.info(
            "[WS] Session disconnected: %s (total chunks received: %d)",
            session_id, buffer.total_chunks_received,
        )
    finally:
        buffer.clear()
