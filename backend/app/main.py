# backend/app/main.py
"""
FastAPI Application Entry Point — SIH-26104
=============================================

Run with:
    uvicorn app.main:app --reload --port 8000

Endpoints registered:
  GET  /health
  POST /api/sessions
  GET  /api/sessions/{session_id}
  WS   /ws/audio
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.mongo import connect_db, disconnect_db
from app.routers import ws_audio, rest_api

# ─── Logging setup ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.APP_ENV == "development" else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ─── FastAPI app ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="SIH-26104 Voice Anti-Spoofing Detection API",
    description=(
        "Real-time voice anti-spoofing detection backend. "
        "Milestone 1 uses MOCK ML inference. "
        "WebSocket endpoint: ws://localhost:8000/ws/audio"
    ),
    version="1.0.0-milestone1",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(rest_api.router)
app.include_router(ws_audio.router)

# ─── Lifecycle events ─────────────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup():
    logger.info("=== SIH-26104 Backend starting (env: %s) ===", settings.APP_ENV)
    await connect_db()
    logger.info("Backend ready — http://localhost:%d", settings.APP_PORT)
    logger.info("API docs    — http://localhost:%d/docs", settings.APP_PORT)
    logger.info("WebSocket   — ws://localhost:%d/ws/audio", settings.APP_PORT)


@app.on_event("shutdown")
async def on_shutdown():
    await disconnect_db()
    logger.info("=== SIH-26104 Backend shutdown ===")
