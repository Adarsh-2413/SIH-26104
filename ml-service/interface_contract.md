# ML Interface Contract — SIH-26104

## Function signature

```python
async def run_inference(audio_bytes: bytes) -> MLResult
```

Located in: `backend/app/services/ml_interface.py`

---

## Input

| Parameter     | Type    | Description |
|---------------|---------|-------------|
| `audio_bytes` | `bytes` | Raw audio from browser MediaRecorder (WebM/Opus, ~400ms chunks × 5 = ~2 sec window) |

---

## Output — MLResult (Pydantic model)

| Field                | Type            | Range     | Description |
|----------------------|-----------------|-----------|-------------|
| `spoof_probability`  | `float`         | 0.0 – 1.0 | 1.0 = definitely spoofed |
| `speaker_similarity` | `float`         | 0.0 – 1.0 | 1.0 = perfect match to enrolled speaker |
| `prosodic_anomaly`   | `float`         | 0.0 – 1.0 | 1.0 = highly anomalous prosody |
| `phonetic_evidence`  | `dict \| None`  | —         | Optional phonetic breakdown |
| `context_risk`       | `float`         | 0.0 – 1.0 | Reserved for contextual signals |

---

## Risk fusion (handled by backend — ML team does not touch this)

```
risk_score = spoof_prob × 0.60
           + (1 - speaker_similarity) × 0.25
           + prosodic_anomaly × 0.10
           + context_risk × 0.05
risk_score → scaled to 0–100
```

Thresholds:
- 0–39   → SAFE
- 40–69  → SUSPICIOUS
- 70–100 → CRITICAL

> ⚠ These are prototype thresholds — recalibrate after real model integration.

---

## Audio format details

- Container: WebM
- Codec: Opus
- Source: Browser `MediaRecorder` API
- Chunk interval: 400ms (5 chunks buffered = ~2 second window)
- The ML model receives concatenated raw bytes of 5 chunks

If the real model requires PCM/WAV, add a conversion step inside `run_inference()`.
The rest of the pipeline does not need to change.
