from fastapi import FastAPI, Response, Request, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import numpy as np
import io
import torch
import soundfile as sf
from pydub import AudioSegment
from transformers import pipeline
from speechbrain.inference.speaker import SpeakerRecognition
import parselmouth

app = FastAPI(title="VIVID ML Microservice")

# Load models on startup
print("Loading wav2vec2 anti-spoof model...")
spoof_pipeline = pipeline("audio-classification", model="Vansh180/deepfake-audio-wav2vec2")

print("Loading ECAPA-TDNN speaker model...")
speaker_model = SpeakerRecognition.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb", savedir="tmp_model")

class MLResultResponse(BaseModel):
    spoof_probability: float = Field(..., ge=0.0, le=1.0)
    speaker_similarity: float = Field(..., ge=0.0, le=1.0)
    prosodic_anomaly: float = Field(..., ge=0.0, le=1.0)
    phonetic_evidence: Optional[Dict[str, Any]] = None
    context_risk: float = Field(default=0.0, ge=0.0, le=1.0)

def convert_webm_opus_to_pcm(webm_bytes: bytes):
    """Converts raw WebM/Opus bytes from browser MediaRecorder into 16kHz mono float32 PCM array."""
    try:
        # Load WebM/Opus buffer via pydub / ffmpeg
        audio = AudioSegment.from_file(io.BytesIO(webm_bytes), format="webm")
        audio = audio.set_frame_rate(16000).set_channels(1)
        
        # Export raw PCM samples
        raw_pcm = np.array(audio.get_array_of_samples(), dtype=np.float32)
        
        # Normalize float32 range [-1.0, 1.0]
        if raw_pcm.size > 0:
            raw_pcm /= np.max(np.abs(raw_pcm)) + 1e-7
            
        return raw_pcm, 16000
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"WebM/Opus audio decoding failed: {str(e)}")

@app.post("/predict", response_model=MLResultResponse)
async def predict(request: Request):
    audio_bytes = await request.body()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio byte buffer")

    # 1. Decode WebM/Opus input to float32 PCM
    pcm_data, sample_rate = convert_webm_opus_to_pcm(audio_bytes)

    # 2. Compute Spoof Probability
    spoof_results = spoof_pipeline(pcm_data)
    spoof_prob = float(next((res['score'] for res in spoof_results if res['label'].lower() == 'spoof'), 0.0))

    # 3. Compute Prosodic Anomaly
    sf.write("temp_window.wav", pcm_data, sample_rate)
    snd = parselmouth.Sound("temp_window.wav")
    pitch = snd.to_pitch()
    pitch_values = pitch.selected_array['frequency']
    pitch_values = pitch_values[pitch_values > 0]
    
    if len(pitch_values) > 0:
        pitch_variance = np.std(pitch_values)
        prosodic_score = float(np.clip(1.0 - (pitch_variance / 50.0), 0.0, 1.0))
    else:
        prosodic_score = 1.0

    # 4. Construct MLResult Response
    return MLResultResponse(
        spoof_probability=spoof_prob,
        speaker_similarity=0.85,  # Placeholder until enrolled profile comparison is active
        prosodic_anomaly=prosodic_score,
        phonetic_evidence=None,
        context_risk=0.0
    )