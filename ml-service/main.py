from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import base64
import numpy as np
import io
import soundfile as sf
import torch
from transformers import pipeline
from speechbrain.inference.speaker import SpeakerRecognition
import parselmouth

app = FastAPI(title="VIVID ML Sidecar")

# 1. Load the Models into Memory on Startup
print("Loading Anti-Spoofing Model...")
spoof_pipeline = pipeline("audio-classification", model="Vansh180/deepfake-audio-wav2vec2")

print("Loading Speaker Verification Model...")
speaker_model = SpeakerRecognition.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb", savedir="tmp_model")

# 2. Define the expected request format
class AudioPayload(BaseModel):
    audio_base64: str  # The raw audio data converted to text

def decode_audio(base64_str):
    """Helper function to convert base64 text back into a raw audio numpy array"""
    try:
        audio_bytes = base64.b64decode(base64_str)
        data, samplerate = sf.read(io.BytesIO(audio_bytes))
        # Ensure it's 16kHz mono
        if len(data.shape) > 1:
            data = data.mean(axis=1)
        return data, samplerate
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid audio format")

# 3. Create the API Endpoints
@app.post("/ml/spoof")
async def detect_spoof(payload: AudioPayload):
    audio_data, _ = decode_audio(payload.audio_base64)
    # The pipeline expects a float32 numpy array
    results = spoof_pipeline(audio_data.astype(np.float32))
    
    # Extract the probability that the audio is synthetic ("spoof")
    spoof_prob = next((res['score'] for res in results if res['label'] == 'spoof'), 0.0)
    return {"spoof_prob": float(spoof_prob)}

@app.post("/ml/prosody")
async def analyze_prosody(payload: AudioPayload):
    audio_data, sr = decode_audio(payload.audio_base64)
    
    # Save temporarily for parselmouth to read
    sf.write("temp.wav", audio_data, sr)
    snd = parselmouth.Sound("temp.wav")
    
    # Extract pitch (F0) to measure unnatural flatness common in AI voices
    pitch = snd.to_pitch()
    pitch_values = pitch.selected_array['frequency']
    pitch_values = pitch_values[pitch_values > 0] # Remove unvoiced segments
    
    # A simple mock anomaly score: highly variance = natural, low variance = synthetic/robotic
    if len(pitch_values) > 0:
        variance = np.std(pitch_values)
        anomaly_score = max(0.0, 1.0 - (variance / 50.0)) # Scaled between 0 and 1
    else:
        anomaly_score = 1.0
        
    return {"anomaly_score": float(anomaly_score)}

@app.get("/health")
async def health_check():
    return {"status": "ok", "models_loaded": ["anti_spoof", "speaker", "prosody"]}