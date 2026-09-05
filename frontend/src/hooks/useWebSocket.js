// frontend/src/hooks/useWebSocket.js
/**
 * useWebSocket — React hook managing the browser mic → WebSocket → dashboard pipeline.
 *
 * Requirements fulfilled:
 *   1. Microphone permission handling with distinct status transitions.
 *   2. MediaRecorder with WebM/Opus audio chunk streaming.
 *   3. Session-based WebSocket connection to ws://localhost:8000/ws/audio.
 *   4. Backend "warming_up" message handling without fake risk scores.
 *   5. Prediction payload ingestion with authoritative backend values.
 *   6. Clean teardown on Stop (stops recorder, kills media tracks, closes socket).
 *   7. Detailed error states (permission denied, WS disconnect, device errors).
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { WSService } from "../services/wsService";

const CHUNK_INTERVAL_MS = 400; // Emit 400ms audio chunks (~5 chunks = 2 sec)

export function useWebSocket() {
  // Microphone states: "idle" | "requesting_permission" | "recording" | "stopped" | "permission_denied"
  const [micStatus, setMicStatus] = useState("idle");

  // WebSocket states: "disconnected" | "connecting" | "connected" | "error"
  const [wsStatus, setWsStatus] = useState("disconnected");

  // Session ID
  const [sessionId, setSessionId] = useState(null);

  // Warmup state from backend: { received: number, needed: number } | null
  const [warmupProgress, setWarmupProgress] = useState(null);

  // Authoritative prediction payload from backend (null during warmup/idle)
  const [prediction, setPrediction] = useState(null);

  // User-facing error message (if any)
  const [errorMessage, setErrorMessage] = useState(null);

  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  /**
   * Stop session cleanly:
   *   1. Stop MediaRecorder
   *   2. Stop all microphone hardware tracks
   *   3. Close WebSocket connection cleanly
   *   4. Reset session references
   */
  const stopSession = useCallback(() => {
    // 1. Stop MediaRecorder
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      } catch (err) {
        console.warn("[VoiceGuard] Error stopping MediaRecorder:", err);
      }
      mediaRecorderRef.current = null;
    }

    // 2. Stop microphone tracks (releases browser mic indicator)
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
      } catch (err) {
        console.warn("[VoiceGuard] Error stopping media tracks:", err);
      }
      streamRef.current = null;
    }

    // 3. Disconnect WebSocket
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }

    // 4. Update status
    setMicStatus("stopped");
    setWsStatus("disconnected");
    setWarmupProgress(null);
    console.log("[VoiceGuard] Session stopped cleanly.");
  }, []);

  /**
   * Start live analysis session:
   *   1. Request microphone permission
   *   2. Establish WebSocket connection to backend
   *   3. Configure MediaRecorder with WebM/Opus format
   *   4. Stream chunks every 400ms
   */
  const startSession = useCallback(async () => {
    // Clean up any stale session before starting
    stopSession();

    setErrorMessage(null);
    setPrediction(null);
    setWarmupProgress(null);
    setMicStatus("requesting_permission");
    setWsStatus("connecting");

    const newSessionId = uuidv4();
    setSessionId(newSessionId);

    let stream = null;

    // 1. Request microphone permission
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices API is not supported in this browser environment.");
      }

      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      streamRef.current = stream;
    } catch (err) {
      console.error("[VoiceGuard] Microphone permission failed:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMicStatus("permission_denied");
        setErrorMessage("Microphone permission was denied. Please allow microphone access in your browser settings to continue.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setMicStatus("stopped");
        setErrorMessage("No audio input device found. Please connect a microphone.");
      } else {
        setMicStatus("stopped");
        setErrorMessage(`Microphone error: ${err.message || "Unable to access microphone."}`);
      }
      setWsStatus("disconnected");
      return;
    }

    // 2. Connect WebSocket to backend
    const ws = new WSService(newSessionId);
    wsRef.current = ws;

    ws.connect(
      // onMessage callback
      (data) => {
        // Handle "warming_up" message — window not yet full
        if (data.type === "warming_up") {
          setWarmupProgress({
            received: data.chunks_received,
            needed: data.chunks_needed,
          });
          return;
        }

        // Handle authoritative risk prediction payload
        if (data && typeof data.risk_score === "number") {
          setWarmupProgress(null);
          setPrediction(data);
        }
      },
      // onStatusChange callback
      (status, errorDetail) => {
        if (status === "connected") {
          setWsStatus("connected");
          setErrorMessage(null);
        } else if (status === "error") {
          setWsStatus("error");
          setErrorMessage(
            errorDetail || "Failed to connect to WebSocket server at ws://localhost:8000/ws/audio. Please ensure FastAPI is running."
          );
          stopSession();
        } else if (status === "disconnected") {
          setWsStatus("disconnected");
        }
      },
      // onError callback
      (err) => {
        console.error("[VoiceGuard] WS error:", err);
        setWsStatus("error");
        setErrorMessage("WebSocket connection error. Verify backend server is running on port 8000.");
      }
    );

    // 3. Wait briefly for WebSocket handshake
    let retries = 0;
    while (!ws.isConnected && retries < 25) {
      await new Promise((r) => setTimeout(r, 100));
      retries++;
    }

    if (!ws.isConnected) {
      setWsStatus("error");
      setErrorMessage("Could not establish WebSocket connection to ws://localhost:8000/ws/audio. Please verify the backend is running.");
      stopSession();
      return;
    }

    // 4. Set up MediaRecorder
    try {
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0 && ws.isConnected) {
          await ws.sendChunk(event.data);
        }
      };

      recorder.onerror = (recErr) => {
        console.error("[VoiceGuard] MediaRecorder error:", recErr);
        setErrorMessage("Audio recording error occurred.");
        stopSession();
      };

      // 5. Start emitting chunks
      recorder.start(CHUNK_INTERVAL_MS);
      setMicStatus("recording");
      console.log(
        `[VoiceGuard] Session ${newSessionId} live: format=${recorder.mimeType || "default"} interval=${CHUNK_INTERVAL_MS}ms`
      );
    } catch (recInitErr) {
      console.error("[VoiceGuard] MediaRecorder init error:", recInitErr);
      setErrorMessage(`MediaRecorder initialization failed: ${recInitErr.message}`);
      stopSession();
    }
  }, [stopSession]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  const isRecording = micStatus === "recording";
  const isWarmingUp = isRecording && warmupProgress !== null;

  return {
    micStatus,
    wsStatus,
    sessionId,
    isRecording,
    isWarmingUp,
    prediction,
    warmupProgress,
    errorMessage,
    startSession,
    stopSession,
  };
}
