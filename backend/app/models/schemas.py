# backend/app/models/schemas.py
"""
Pydantic schemas for SIH-26104 Voice Anti-Spoofing Detection.

These schemas define the data contracts between:
  - ML Interface  →  Risk Engine
  - Risk Engine   →  WebSocket response
  - REST API      →  Client
"""

from __future__ import annotations

import time
from typing import Optional
from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────
# ML Interface output schema
# This is the ONLY thing the ML team needs to produce.
# ─────────────────────────────────────────────────────────────

class MLResult(BaseModel):
    """
    Output of ml_interface.run_inference().

    All float values are in the range [0.0, 1.0].

    NOTE: In Milestone 1, this is produced by a MOCK implementation.
    The real ML model must output a dict/object matching these exact fields.
    """
    spoof_probability: float = Field(
        ..., ge=0.0, le=1.0,
        description="Probability that the audio is spoofed / AI-generated. 1.0 = definitely spoofed."
    )
    speaker_similarity: float = Field(
        ..., ge=0.0, le=1.0,
        description="Similarity score vs. enrolled speaker. 1.0 = perfect match (genuine)."
    )
    prosodic_anomaly: float = Field(
        ..., ge=0.0, le=1.0,
        description="Degree of prosodic irregularity detected. 1.0 = highly anomalous."
    )
    phonetic_evidence: Optional[float | dict] = Field(
        default=0.0,
        description="Phonetic evidence score (0.0–1.0) or detailed breakdown dict."
    )
    context_risk: float = Field(
        default=0.0, ge=0.0, le=1.0,
        description="Contextual risk factor (e.g. unusual call pattern). Reserved for future use."
    )


# ─────────────────────────────────────────────────────────────
# Risk Engine output schema
# ─────────────────────────────────────────────────────────────

class RiskLevel(str):
    SAFE = "SAFE"
    SUSPICIOUS = "SUSPICIOUS"
    CRITICAL = "CRITICAL"


class FusionOutput(BaseModel):
    """
    Core output of the Risk Fusion Engine.

    Output format:
        {
            "risk_score": 86,
            "risk_level": "CRITICAL"
        }
    """
    risk_score: int = Field(..., ge=0, le=100, description="Fused risk score (0 to 100).")
    risk_level: str = Field(..., description="Classification: SAFE, SUSPICIOUS, or CRITICAL.")


class RiskResult(FusionOutput):
    """
    Full payload sent over WebSocket to the frontend dashboard.
    Combines core fusion output with all individual evidence telemetry metrics.

    Risk thresholds (PROTOTYPE — not scientifically validated):
      0  – 39  → SAFE
      40 – 69  → SUSPICIOUS
      70 – 100 → CRITICAL
    """
    timestamp: int = Field(
        default_factory=lambda: int(time.time()),
        description="Unix timestamp (integer seconds)."
    )
    spoof_probability: float
    speaker_similarity: float
    prosodic_anomaly: float
    phonetic_evidence: Optional[float | dict] = 0.0
    context_risk: float


# ─────────────────────────────────────────────────────────────
# REST API schemas
# ─────────────────────────────────────────────────────────────

class SessionCreateResponse(BaseModel):
    session_id: str
    created_at: float
    message: str


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
