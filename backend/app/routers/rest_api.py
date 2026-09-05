# backend/app/routers/rest_api.py
"""
REST API Endpoints — SIH-26104

Endpoints:
  GET  /health                    — Health check
  POST /api/sessions              — Create a new session record
  GET  /api/sessions/{id}         — Get session info
"""

from __future__ import annotations

import time
import uuid
import logging

from fastapi import APIRouter, HTTPException

from app.models.schemas import HealthResponse, SessionCreateResponse
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory session store (Milestone 1 — no DB persistence required)
_sessions: dict[str, dict] = {}


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        version="1.0.0-milestone1",
        environment=settings.APP_ENV,
    )


@router.post("/api/sessions", response_model=SessionCreateResponse)
async def create_session():
    """
    Create a new analysis session.
    Returns a session_id that the frontend passes to the WebSocket.
    """
    session_id = str(uuid.uuid4())
    created_at = time.time()

    _sessions[session_id] = {
        "session_id": session_id,
        "created_at": created_at,
        "status": "active",
    }

    logger.info("[REST] Session created: %s", session_id)

    return SessionCreateResponse(
        session_id=session_id,
        created_at=created_at,
        message="Session created. Connect WebSocket at ws://localhost:8000/ws/audio?session_id=" + session_id,
    )


@router.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    """Get session info by ID."""
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
