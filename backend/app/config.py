# backend/app/config.py
"""
Application configuration — loaded from .env file.
All secrets and tunable parameters go here. Never hardcode credentials.

Audio sliding window:
  AUDIO_WINDOW_SIZE  — chunks kept in the rolling window (each chunk ≈ 400ms)
  AUDIO_STEP_SIZE    — new chunks required between each inference run

  Example (defaults): window=10, step=2
    → 10 × 400ms = ~4 sec of audio per inference
    → new prediction every 2 × 400ms = every ~800ms
"""

from __future__ import annotations
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    # MongoDB Atlas — optional in Milestone 1
    MONGODB_URI: str = ""
    MONGODB_DB_NAME: str = "sih26104"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"

    # Audio sliding window
    AUDIO_WINDOW_SIZE: int = 10   # chunks in each analysis window
    AUDIO_STEP_SIZE: int = 2      # new chunks between each inference

    # Risk engine weights (must sum to 1.0)
    RISK_WEIGHT_SPOOF: float = 0.55
    RISK_WEIGHT_SPEAKER: float = 0.25
    RISK_WEIGHT_PROSODIC: float = 0.10
    RISK_WEIGHT_PHONETIC: float = 0.05
    RISK_WEIGHT_CONTEXT: float = 0.05

    # Risk classification thresholds (0–100)
    RISK_THRESHOLD_SAFE_MAX: int = 39
    RISK_THRESHOLD_SUSPICIOUS_MAX: int = 69

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


settings = Settings()
