import sys
import types

fake_lzma = types.ModuleType("lzma")
fake_lzma.LZMAError = Exception
class FakeLZMAFile:
    def __init__(self, *args, **kwargs): pass
    def read(self, *args, **kwargs): return b""
    def write(self, *args, **kwargs): return 0
    def seek(self, *args, **kwargs): return 0
    def tell(self, *args, **kwargs): return 0
    def close(self): pass
    def __enter__(self): return self
    def __exit__(self, *args): pass
fake_lzma.LZMAFile = FakeLZMAFile
fake_lzma.open = lambda *args, **kwargs: FakeLZMAFile()
fake_lzma.is_check_supported = lambda check: False
fake_lzma.FORMAT_AUTO, fake_lzma.FORMAT_XZ, fake_lzma.FORMAT_ALONE, fake_lzma.FORMAT_RAW = 0, 1, 2, 3
fake_lzma.CHECK_NONE, fake_lzma.CHECK_CRC32, fake_lzma.CHECK_CRC64, fake_lzma.CHECK_SHA256 = 0, 1, 4, 10
sys.modules["lzma"] = fake_lzma
sys.modules["_lzma"] = fake_lzma
sys.modules["torchvision"] = None

# 1. IMPORTS & SETUP
import os
import io
import torch
import librosa
import soundfile as sf
import numpy as np
import uvicorn
from pydub import AudioSegment
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import Wav2Vec2ForSequenceClassification, Wav2Vec2FeatureExtractor
from speechbrain.inference.classifiers import EncoderClassifier

app = FastAPI(title="Voice Anti-Spoofing API", version="4.0-Calibrated")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Server running on device: {device.upper()}")

BASE_MODEL_DIR = r"E:\SIH2026\models"

# NEW CALIBRATED DECISION THRESHOLDS
LANGUAGE_THRESHOLDS = {
    "en": 0.88,  
    "hi": 0.67,  
    "bn": 0.64,  
    "te": 0.61   
}

print("Loading Language Detection Model (ECAPA-TDNN)...")
lang_id_model = EncoderClassifier.from_hparams(
    source="speechbrain/lang-id-voxlingua107-ecapa",
    savedir=os.path.join(BASE_MODEL_DIR, "lang_id_cache")
)

print("Loading Wav2Vec2 Spoof Detection Models...")
spoof_models = {}
SUPPORTED_LANGS = {
    "en": "trained_english", 
    "bn": "trained_combined_bengali", 
    "hi": "trained_combined_hindi", 
    "te": "trained_combined_telugu"
}

for lang_code, folder_name in SUPPORTED_LANGS.items():
    model_path = os.path.join(BASE_MODEL_DIR, folder_name)
    if os.path.exists(model_path):
        extractor = Wav2Vec2FeatureExtractor.from_pretrained(model_path)
        model = Wav2Vec2ForSequenceClassification.from_pretrained(model_path).to(device)
        model.eval()
        spoof_models[lang_code] = {"extractor": extractor, "model": model}
        print(f" - {lang_code.upper()} model loaded successfully.")

def load_audio_bytes_to_16k(file_bytes: bytes) -> np.ndarray:
    buffer = io.BytesIO(file_bytes)
    try:
        speech_array, _ = librosa.load(buffer, sr=16000)
        if speech_array.ndim > 1: speech_array = np.mean(speech_array, axis=1)
        return speech_array.astype(np.float32)
    except Exception:
        buffer.seek(0)
    try:
        segment = AudioSegment.from_file(buffer).set_frame_rate(16000).set_channels(1)
        samples = np.array(segment.get_array_of_samples(), dtype=np.float32)
        return (samples / float(1 << (8 * segment.sample_width - 1))).astype(np.float32)
    except Exception as e:
        raise ValueError(f"Unable to decode live audio stream: {e}")

def calculate_prosodic_anomaly(audio_array, sampling_rate=16000):
    try:
        fl, hl = int(0.025 * sampling_rate), int(0.010 * sampling_rate)
        frames = np.array([audio_array[i:i+fl] for i in range(0, len(audio_array)-fl, hl)])
        if len(frames) == 0: return 0.5
        ste = np.sum(frames**2, axis=1) / (np.max(np.sum(frames**2, axis=1)) + 1e-6)
        return round(float(min(max(np.exp(-45 * np.var(ste)), 0.0), 1.0)), 4)
    except: return 0.5

def compute_hybrid_spoof_score(w2v_prob: float, prosody_val: float) -> float:
    return float(min(max(max(w2v_prob, 0.70 + (prosody_val * 0.25)) if prosody_val > 0.40 else (0.65 * w2v_prob) + (0.35 * prosody_val), 0.0), 1.0))

SUPPORTED_EXTENSIONS = ('.wav', '.mp3', '.flac', '.webm', '.ogg', '.opus', '.m4a')

@app.post("/predict")
async def predict_audio(file: UploadFile = File(...)):
    filename = file.filename.lower()
    if not (filename.endswith(SUPPORTED_EXTENSIONS) or "webm" in filename or "opus" in filename or filename == "blob"):
        raise HTTPException(status_code=400, detail="Unsupported format.")

    try:
        speech_array = load_audio_bytes_to_16k(await file.read())
        if len(speech_array) < 8000: raise HTTPException(status_code=400, detail="Audio too short.")

        prosody_score = calculate_prosodic_anomaly(speech_array)
        detected_lang_str = lang_id_model.classify_batch(torch.tensor(speech_array, dtype=torch.float32).unsqueeze(0))[3][0]
        lang_prefix = detected_lang_str.split(":")[0].strip().lower()

        if lang_prefix not in spoof_models:
            lang_prefix = "hi" if "hi" in spoof_models else ("en" if "en" in spoof_models else list(spoof_models.keys())[0])

        TARGET_LENGTH = 48000
        if len(speech_array) > TARGET_LENGTH:
            processed_audio = speech_array[(len(speech_array) - TARGET_LENGTH) // 2 : (len(speech_array) + TARGET_LENGTH) // 2]
        else:
            processed_audio = np.pad(speech_array, (0, TARGET_LENGTH - len(speech_array)), 'constant')

        route_setup = spoof_models[lang_prefix]
        inputs = route_setup["extractor"](processed_audio, sampling_rate=16000, return_tensors="pt")
        inputs = {key: val.to(device) for key, val in inputs.items()}

        with torch.no_grad():
            probabilities = torch.nn.functional.softmax(route_setup["model"](**inputs).logits, dim=-1).cpu().numpy()

        raw_spoof_score = float(probabilities[0][1])
        final_spoof_score = compute_hybrid_spoof_score(raw_spoof_score, prosody_score)

        # Apply Calibrated Threshold
        active_threshold = LANGUAGE_THRESHOLDS.get(lang_prefix, 0.50)
        is_spoof = final_spoof_score >= active_threshold

        risk_category = "CRITICAL" if final_spoof_score >= 0.75 or prosody_score > 0.80 else ("RISKY" if final_spoof_score >= active_threshold or prosody_score >= 0.45 else "SAFE")

        return {
            "status": "success",
            "detected_language": detected_lang_str,
            "routed_language_model": lang_prefix.upper(),
            "prediction": "Spoof" if is_spoof else "Bonafide",
            "decision_threshold_applied": active_threshold,
            "risk_assessment": {"category": risk_category, "action": "BLOCK_ACCESS" if risk_category == "CRITICAL" else ("TRIGGER_SECONDARY_MFA" if risk_category == "RISKY" else "ALLOW_ACCESS")},
            "scores": {
                "final_fused_spoof": round(final_spoof_score, 4),
                "final_fused_bonafide": round(1.0 - final_spoof_score, 4),
                "breakdown": {"raw_wav2vec2_spoof": round(raw_spoof_score, 4), "prosodic_anomaly": prosody_score}
            },
            "flags": {"requires_secondary_mfa": bool(risk_category in ["RISKY", "CRITICAL"])}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9000)