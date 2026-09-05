# backend/app/services/audio_processor.py
"""
Audio Processor — Sliding Window Buffer — SIH-26104
=====================================================

Implements a SLIDING WINDOW approach for real-time audio analysis.

Instead of:
  ❌ Accumulate N chunks → flush → analyze → repeat (non-overlapping)

We now use:
  ✅ Keep a rolling window of WINDOW_SIZE chunks
     Run inference every STEP_SIZE new chunks
     Window slides forward — old chunks are dropped, new ones added

This gives:
  - More continuous, near-real-time analysis
  - Overlapping windows → better temporal coverage
  - First prediction after WINDOW_SIZE chunks arrive
  - Subsequent predictions every STEP_SIZE chunks

Configuration (via .env):
  AUDIO_WINDOW_SIZE  = number of chunks in each analysis window (default: 10)
  AUDIO_STEP_SIZE    = new chunks between each inference run     (default: 2)

At 400ms/chunk:
  - Window = 10 chunks = ~4 seconds of audio per inference
  - Step   = 2 chunks  = new prediction every ~800ms
"""

from __future__ import annotations

import logging
from collections import deque
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


class SlidingWindowBuffer:
    """
    Per-session sliding window audio buffer.

    Maintains a rolling deque of audio chunks.
    Returns a concatenated audio window when enough new chunks have arrived.

    Usage:
        buf = SlidingWindowBuffer(session_id="abc")
        audio = buf.add_chunk(chunk_bytes)
        if audio is not None:
            result = await run_inference(audio)
    """

    def __init__(
        self,
        session_id: str,
        window_size: int = settings.AUDIO_WINDOW_SIZE,
        step_size: int = settings.AUDIO_STEP_SIZE,
    ) -> None:
        self.session_id = session_id
        self._window_size = window_size
        self._step_size = step_size

        # Rolling window: automatically drops oldest chunk when full
        self._window: deque[bytes] = deque(maxlen=window_size)

        # Count new chunks since last inference
        self._steps_since_last: int = 0
        self._total_chunks: int = 0

        logger.debug(
            "[SlidingWindow] session=%s window=%d chunks step=%d chunks",
            session_id, window_size, step_size,
        )

    def add_chunk(self, chunk: bytes) -> Optional[bytes]:
        """
        Add one audio chunk to the sliding window.

        Returns:
            Combined audio bytes (the current window) if inference should run.
            None if more chunks are needed before the next inference.

        Inference runs when:
          1. The window is fully populated (>= window_size chunks received)
          AND
          2. step_size new chunks have arrived since the last inference
        """
        self._window.append(chunk)
        self._total_chunks += 1
        self._steps_since_last += 1

        window_full = len(self._window) >= self._window_size
        step_reached = self._steps_since_last >= self._step_size

        if window_full and step_reached:
            audio_window = b"".join(self._window)
            self._steps_since_last = 0

            logger.debug(
                "[SlidingWindow] session=%s inference triggered | "
                "window=%d/%d chunks (%d bytes) | total_received=%d",
                self.session_id,
                len(self._window), self._window_size,
                len(audio_window),
                self._total_chunks,
            )
            return audio_window

        logger.debug(
            "[SlidingWindow] session=%s buffering | window=%d/%d | step=%d/%d",
            self.session_id,
            len(self._window), self._window_size,
            self._steps_since_last, self._step_size,
        )
        return None

    def clear(self) -> None:
        """Clear buffer on session end."""
        self._window.clear()
        self._steps_since_last = 0
        logger.debug("[SlidingWindow] session=%s cleared", self.session_id)

    @property
    def window_fill(self) -> int:
        """How many chunks are currently in the window."""
        return len(self._window)

    @property
    def total_chunks_received(self) -> int:
        return self._total_chunks

    @property
    def is_warming_up(self) -> bool:
        """True while the window hasn't filled for the first time yet."""
        return len(self._window) < self._window_size
