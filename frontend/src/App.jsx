// frontend/src/App.jsx
/**
 * SIH-26104 — Real-Time Voice Anti-Spoofing & Biometric Verification
 *
 * Frontend State Flow:
 *   STATE 1: INCOMING CALL (Accept / Decline)
 *      ↓ [ Accept ]
 *   STATE 2: ACTIVE LIVE CALL (Streams live mic -> WebSocket -> ML -> Live Risk UI)
 *      ├── [ VERIFY CALLER ] → STATE 3: VERIFICATION MODAL
 *      └── [ END CALL ]      → STATE 4: CALL CONCLUDED SUMMARY
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import IncomingCall from "./components/IncomingCall";
import ActiveCall from "./components/ActiveCall";
import VerificationModal from "./components/VerificationModal";
import CallEnded from "./components/CallEnded";

const MAX_GRAPH_POINTS = 40;

export default function App() {
  // Call lifecycle state: "incoming" | "active" | "ended" | "declined"
  const [callState, setCallState] = useState("incoming");

  // Call duration counter (seconds)
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Verification modal state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  // Graph history points
  const [graphData, setGraphData] = useState([]);

  // Track peak score for call summary
  const peakScoreRef = useRef(0);

  // Caller metadata
  const callerInfo = {
    name: "Unknown Caller",
    number: "+91 98XXX XXXXX",
    location: "India",
  };

  // Reuse existing, fully verified WebSocket + audio capture hook
  const {
    micStatus,
    wsStatus,
    sessionId,
    isWarmingUp,
    prediction,
    warmupProgress,
    errorMessage,
    startSession,
    stopSession,
  } = useWebSocket();

  // Call duration timer while active
  useEffect(() => {
    let timer = null;
    if (callState === "active") {
      timer = setInterval(() => {
        setDurationSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [callState]);

  // Format seconds to 00:00:SS or 00:MM:SS
  const formatDuration = useCallback((totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `00:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, []);

  // Handle Accept Call -> Start live mic + WebSocket stream
  const handleAcceptCall = useCallback(async () => {
    setCallState("active");
    setDurationSeconds(0);
    setGraphData([]);
    peakScoreRef.current = 0;

    // Start existing microphone and WebSocket session
    await startSession();
  }, [startSession]);

  // Handle Decline Call
  const handleDeclineCall = useCallback(() => {
    stopSession();
    setCallState("declined");
  }, [stopSession]);

  // Handle End Call -> Stop audio tracks & WebSocket cleanly
  const handleEndCall = useCallback(() => {
    stopSession();
    setCallState("ended");
    setIsVerifyModalOpen(false);
  }, [stopSession]);

  // Handle Restart / Simulate New Incoming Call
  const handleRestart = useCallback(() => {
    stopSession();
    setCallState("incoming");
    setDurationSeconds(0);
    setGraphData([]);
    peakScoreRef.current = 0;
    setIsVerifyModalOpen(false);
  }, [stopSession]);

  // Ingest incoming prediction points into live risk graph
  useEffect(() => {
    if (!prediction || typeof prediction.risk_score !== "number" || callState !== "active") return;

    const currentScore = prediction.risk_score;
    if (currentScore > peakScoreRef.current) {
      peakScoreRef.current = currentScore;
    }

    const timeLabel = formatDuration(durationSeconds);

    setGraphData((prev) => {
      const nextPoint = {
        callTime: timeLabel,
        score: currentScore,
        level: prediction.risk_level,
        timestamp: prediction.timestamp,
      };
      const updated = [...prev, nextPoint];
      return updated.length > MAX_GRAPH_POINTS ? updated.slice(-MAX_GRAPH_POINTS) : updated;
    });
  }, [prediction, callState, durationSeconds, formatDuration]);

  return (
    <div className="call-container-root">
      {/* ── Top Bar / System Telemetry Bar ── */}
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px 16px",
          fontSize: "0.72rem",
          color: "rgba(255, 255, 255, 0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "#00e676" }}>🛡️</span>
          <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>VoiceGuard</span>
          <span>· SIH 26104</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Quick simulation reset button if not in incoming call */}
          {callState !== "incoming" && (
            <button
              onClick={handleRestart}
              title="Reset and simulate new incoming call"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "6px",
                color: "rgba(255,255,255,0.7)",
                padding: "2px 8px",
                fontSize: "0.68rem",
                cursor: "pointer",
              }}
            >
              Simulate Call ↻
            </button>
          )}

          {/* WS indicator */}
          <span
            style={{
              padding: "2px 6px",
              borderRadius: "4px",
              background:
                wsStatus === "connected"
                  ? "rgba(0, 230, 118, 0.12)"
                  : "rgba(255, 255, 255, 0.05)",
              color: wsStatus === "connected" ? "#00e676" : "rgba(255,255,255,0.4)",
              fontWeight: 600,
            }}
          >
            WS: {wsStatus}
          </span>
        </div>
      </div>

      {/* ── Error Banner (if mic or connection fails) ── */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            width: "100%",
            maxWidth: "480px",
            background: "rgba(255, 23, 68, 0.12)",
            border: "1px solid rgba(255, 23, 68, 0.4)",
            borderRadius: "12px",
            padding: "10px 14px",
            color: "#ff6b6b",
            fontSize: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── STATE 1: INCOMING CALL ── */}
      {callState === "incoming" && (
        <IncomingCall
          callerName={callerInfo.name}
          callerNumber={callerInfo.number}
          callerLocation={callerInfo.location}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}

      {/* ── STATE 2: ACTIVE LIVE CALL ── */}
      {callState === "active" && (
        <ActiveCall
          callerName={callerInfo.name}
          callerNumber={callerInfo.number}
          callerLocation={callerInfo.location}
          callDuration={formatDuration(durationSeconds)}
          prediction={prediction}
          graphData={graphData}
          isWarmingUp={isWarmingUp}
          warmupProgress={warmupProgress}
          onVerifyCaller={() => setIsVerifyModalOpen(true)}
          onEndCall={handleEndCall}
        />
      )}

      {/* ── STATE 4: CALL ENDED OR DECLINED ── */}
      {(callState === "ended" || callState === "declined") && (
        <CallEnded
          callerName={callerInfo.name}
          callerNumber={callerInfo.number}
          duration={formatDuration(durationSeconds)}
          finalScore={prediction ? prediction.risk_score : null}
          finalLevel={prediction ? prediction.risk_level : null}
          peakScore={peakScoreRef.current || (prediction ? prediction.risk_score : 0)}
          onRestartCall={handleRestart}
        />
      )}

      {/* ── STATE 3: VERIFICATION MODAL OVERLAY ── */}
      <VerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        callerNumber={callerInfo.number}
      />
    </div>
  );
}
