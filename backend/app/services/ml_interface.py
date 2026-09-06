# backend/app/services/ml_interface.py
"""
ML Interface for Voice Anti-Spoofing Detection — SIH-26104
===========================================================

MILESTONE 1: MOCK IMPLEMENTATION
---------------------------------
This file currently uses a controlled MOCK that generates
deterministic-ish fake predictions for development and UI testing.

DO NOT treat these values as real anti-spoofing results.

HOW THE REAL ML MODEL PLUGS IN
--------------------------------
The ML team must implement one function with this exact signature:

    async def run_inference(audio_bytes: bytes) -> MLResult

The function receives raw audio bytes (WebM/Opus from browser MediaRecorder)
and must return an MLResult Pydantic object (defined in app/models/schemas.py).

Steps for ML integration:
  1. Replace the body of `run_inference()` in this file.
  2. Load your model in the module-level `_load_model()` call.
  3. Do NOT change the function signature or return type.
  4. Do NOT modify risk_engine.py or ws_audio.py.

Input:  bytes  — raw WebM/Opus audio buffer
Output: MLResult(
            spoof_probability   : float [0.0–1.0]
            speaker_similarity  : float [0.0–1.0]
            phonetic_evidence   : dict | None
            prosodic_anomaly    : float [0.0–1.0]
            context_risk        : float [0.0–1.0]
        )
"""

from __future__ import annotations

import math
import os
import random
import time
import logging
import httpx

from app.models.schemas import MLResult

logger = logging.getLogger(__name__)
ML_SERVICE_URL = os.getenv("ML_SERVICE_URL") or "http://localhost:5000/predict"  # Default to local ML service if not set

# ─── Internal mock state ──────────────────────────────────────────────────────
# We use a slow sinusoidal drift + random noise to simulate
# realistic-looking scores that change over time (not pure random).

_call_counter: int = 0
_session_phase: float = 0.0  # Radians — advances each call


def _mock_inference(audio_bytes: bytes) -> MLResult:
    """
    MOCK inference function.

    Generates controlled, slowly drifting values to simulate
    a real session that transitions from SAFE → SUSPICIOUS → CRITICAL.

    Values are NOT real anti-spoofing predictions.
    """
    global _call_counter, _session_phase

    _call_counter += 1
    _session_phase += 0.15  # Advance the phase each call (~every 2 sec)

    # Base sinusoidal drift: simulates a call that slowly becomes riskier
    drift = (math.sin(_session_phase) + 1.0) / 2.0  # 0.0 – 1.0

    # Add controlled noise
    noise = lambda scale=0.05: random.gauss(0, scale)

    spoof_probability = max(0.0, min(1.0, drift * 0.7 + noise(0.08)))
    speaker_similarity = max(0.0, min(1.0, 1.0 - drift * 0.6 + noise(0.06)))
    prosodic_anomaly = max(0.0, min(1.0, drift * 0.5 + noise(0.07)))
    phonetic_evidence = max(0.0, min(1.0, drift * 0.45 + noise(0.06)))
    context_risk = max(0.0, min(1.0, drift * 0.3 + noise(0.04)))

    logger.debug(
        "[Mock ML] call=%d spoof=%.3f sim=%.3f prosodic=%.3f phonetic=%.3f ctx=%.3f",
        _call_counter, spoof_probability, speaker_similarity,
        prosodic_anomaly, phonetic_evidence, context_risk
    )

    return MLResult(
        spoof_probability=round(spoof_probability, 4),
        speaker_similarity=round(speaker_similarity, 4),
        prosodic_anomaly=round(prosodic_anomaly, 4),
        phonetic_evidence=round(phonetic_evidence, 4),
        context_risk=round(context_risk, 4),
    )


# ─── Public interface ─────────────────────────────────────────────────────────

async def run_inference(audio_bytes: bytes) -> MLResult:
    """
    Run voice anti-spoofing inference on a raw audio buffer.

    Args:
        audio_bytes: Raw audio bytes from browser MediaRecorder (WebM/Opus).

    Returns:
        MLResult with all prediction fields populated.
    """
    async with httpx.AsyncClient(timeout=2.0) as client:
        response = await client.post(
            ML_SERVICE_URL,
            content=audio_bytes,
            headers={"Content-Type": "application/octet-stream"}
        )
        
        if response.status_code != 200:
            # Fallback output in case of ML service failure
            return MLResult(
                spoof_probability=0.0,
                speaker_similarity=1.0,
                prosodic_anomaly=0.0,
                phonetic_evidence=None,
                context_risk=0.0
            )

        payload = response.json()
        return MLResult(**payload)
