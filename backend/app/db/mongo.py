# backend/app/db/mongo.py
"""
MongoDB Atlas connection — SIH-26104

MILESTONE 1: Database persistence is optional.
If MONGODB_URI is empty or connection fails, the app continues without DB.
Session data and risk history will not be persisted until configured.
"""

from __future__ import annotations

import logging
from typing import Optional

import motor.motor_asyncio

from app.config import settings

logger = logging.getLogger(__name__)

_client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
_db: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None


async def connect_db() -> None:
    """Attempt to connect to MongoDB Atlas. Logs warning if URI is missing."""
    global _client, _db

    if not settings.MONGODB_URI:
        logger.warning(
            "[MongoDB] MONGODB_URI not set. DB persistence disabled. "
            "Set MONGODB_URI in your .env file to enable it."
        )
        return

    try:
        _client = motor.motor_asyncio.AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,
        )
        # Verify connection
        await _client.admin.command("ping")
        _db = _client[settings.MONGODB_DB_NAME]
        logger.info("[MongoDB] Connected to Atlas — db: %s", settings.MONGODB_DB_NAME)
    except Exception as exc:
        logger.warning(
            "[MongoDB] Connection failed (%s). App continues without DB.", exc
        )
        _client = None
        _db = None


async def disconnect_db() -> None:
    """Close the MongoDB connection on app shutdown."""
    global _client
    if _client:
        _client.close()
        logger.info("[MongoDB] Disconnected.")


def get_db() -> Optional[motor.motor_asyncio.AsyncIOMotorDatabase]:
    """Return the active DB instance, or None if not connected."""
    return _db
