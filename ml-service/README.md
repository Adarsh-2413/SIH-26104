# ml-service — Real ML Model Integration Guide

## Status
**Milestone 1: Not implemented. Mock ML is active in the backend.**

---

## Purpose

This directory is reserved for the ML team to place the real anti-spoofing model.

The backend will call `ml_interface.py` (in `backend/app/services/`) to run inference.
**The ML team does NOT need to modify any other backend file.**

---

## What the ML team needs to do

1. Train / export the model (ONNX, TorchScript, or plain PyTorch `.pt`)
2. Place model weights here in `ml-service/`
3. Open `backend/app/services/ml_interface.py`
4. Replace the body of `run_inference()` with real model inference
5. Update `_load_model()` to load weights from this directory

---

## Input / Output contract

See `interface_contract.md` for the exact schema.

---

## Important rules

- Do NOT modify `risk_engine.py`
- Do NOT modify `ws_audio.py`
- Do NOT modify any frontend file
- Only change `ml_interface.py`
