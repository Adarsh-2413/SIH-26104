// frontend/src/components/AudioCapture.jsx
/**
 * AudioCapture — Live Call / Microphone & WebSocket Control Panel
 *
 * Requirements:
 *   - Clear microphone states: Idle, Requesting permission, Recording, Stopped, Permission denied
 *   - Clear WebSocket states: Disconnected, Connecting, Connected, Error
 *   - Start/Stop microphone controls
 *   - Clean Warmup display ("Analyzing audio...") showing received chunks
 *   - Clear error notifications for permission denial and connection loss
 */

export default function AudioCapture({
  micStatus = "idle",
  wsStatus = "disconnected",
  sessionId = null,
  warmupProgress = null,
  errorMessage = null,
  onStart,
  onStop,
}) {
  const isRecording = micStatus === "recording";
  const isRequesting = micStatus === "requesting_permission";
  const isDenied = micStatus === "permission_denied";
  const isWarmingUp = isRecording && warmupProgress !== null;

  // Microphone state presentation
  const micConfig = {
    idle: {
      label: "MIC: IDLE",
      subtext: "Click to start live monitoring",
      color: "rgba(255,255,255,0.45)",
      bg: "rgba(255,255,255,0.04)",
      border: "rgba(255,255,255,0.08)",
      icon: "🎙️",
    },
    requesting_permission: {
      label: "MIC: REQUESTING PERMISSION",
      subtext: "Please approve browser mic prompt...",
      color: "#ffb300",
      bg: "rgba(255, 179, 0, 0.08)",
      border: "rgba(255, 179, 0, 0.3)",
      icon: "⏳",
    },
    recording: {
      label: isWarmingUp ? "ANALYZING AUDIO..." : "● LIVE MONITORING",
      subtext: isWarmingUp ? "Buffering initial audio window" : "Streaming WebM/Opus (400ms chunks)",
      color: isWarmingUp ? "#448aff" : "#00e676",
      bg: isWarmingUp ? "rgba(68, 138, 255, 0.08)" : "rgba(0, 230, 118, 0.08)",
      border: isWarmingUp ? "rgba(68, 138, 255, 0.3)" : "rgba(0, 230, 118, 0.3)",
      icon: isWarmingUp ? "⏳" : "🛑",
    },
    stopped: {
      label: "MIC: STOPPED",
      subtext: "Session concluded cleanly",
      color: "rgba(255,255,255,0.45)",
      bg: "rgba(255,255,255,0.04)",
      border: "rgba(255,255,255,0.08)",
      icon: "🎙️",
    },
    permission_denied: {
      label: "MIC: PERMISSION DENIED",
      subtext: "Microphone blocked in browser",
      color: "#ff1744",
      bg: "rgba(255, 23, 68, 0.08)",
      border: "rgba(255, 23, 68, 0.3)",
      icon: "⚠️",
    },
  }[micStatus] || micConfig?.idle;

  // WebSocket state presentation
  const wsConfig = {
    disconnected: { label: "Disconnected", color: "rgba(255,255,255,0.35)", dot: "#666" },
    connecting:   { label: "Connecting",   color: "#ffb300", dot: "#ffb300" },
    connected:    { label: "Connected",    color: "#00e676", dot: "#00e676" },
    error:        { label: "Connection Error", color: "#ff1744", dot: "#ff1744" },
  }[wsStatus] || { label: "Disconnected", color: "rgba(255,255,255,0.35)", dot: "#666" };

  const warmupPct = warmupProgress
    ? Math.min(100, Math.round((warmupProgress.received / warmupProgress.needed) * 100))
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", width: "100%" }}>
      {/* ── Start / Stop Big Button ── */}
      <button
        id="mic-toggle-btn"
        onClick={isRecording ? onStop : onStart}
        disabled={isRequesting}
        aria-label={isRecording ? "Stop monitoring session" : "Start live microphone monitoring"}
        style={{
          width: "86px",
          height: "86px",
          borderRadius: "50%",
          border: isRecording
            ? "2.5px solid #ff1744"
            : isRequesting
            ? "2.5px solid #ffb300"
            : isDenied
            ? "2.5px solid rgba(255,23,68,0.5)"
            : "2.5px solid rgba(0, 230, 118, 0.6)",
          background: isRecording
            ? "radial-gradient(circle, rgba(255,23,68,0.2) 0%, rgba(255,23,68,0.05) 100%)"
            : isRequesting
            ? "rgba(255, 179, 0, 0.1)"
            : "radial-gradient(circle, rgba(0, 230, 118, 0.15) 0%, rgba(0, 230, 118, 0.04) 100%)",
          cursor: isRequesting ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2.1rem",
          position: "relative",
          outline: "none",
          transition: "all 0.3s ease",
          boxShadow: isRecording
            ? "0 0 35px rgba(255,23,68,0.4)"
            : "0 0 25px rgba(0, 230, 118, 0.2)",
        }}
      >
        {/* Pulsing ring when recording */}
        {isRecording && (
          <span
            style={{
              position: "absolute",
              inset: "-8px",
              borderRadius: "50%",
              border: "2px solid rgba(255,23,68,0.35)",
              animation: "ripple 1.5s ease-out infinite",
            }}
          />
        )}
        {isRecording ? "🛑" : isRequesting ? "⏳" : "🎙️"}
      </button>

      {/* ── Microphone State Banner ── */}
      <div
        style={{
          width: "100%",
          padding: "10px 14px",
          background: micConfig.bg,
          border: `1px solid ${micConfig.border}`,
          borderRadius: "10px",
          textAlign: "center",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: "0.82rem", color: micConfig.color, letterSpacing: "0.08em" }}>
          {micConfig.label}
        </div>
        <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
          {micConfig.subtext}
        </div>
      </div>

      {/* ── Warmup Progress Display ("Analyzing audio...") ── */}
      {isWarmingUp && warmupProgress && (
        <div
          style={{
            width: "100%",
            background: "rgba(68, 138, 255, 0.08)",
            border: "1px solid rgba(68, 138, 255, 0.25)",
            borderRadius: "10px",
            padding: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.72rem",
              color: "#448aff",
              fontWeight: 700,
              marginBottom: "6px",
            }}
          >
            <span>Analyzing audio...</span>
            <span>{warmupProgress.received} / {warmupProgress.needed} chunks</span>
          </div>
          <div
            style={{
              height: "6px",
              borderRadius: "3px",
              background: "rgba(68, 138, 255, 0.15)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${warmupPct}%`,
                height: "100%",
                background: "linear-gradient(90deg, #448aff, #00e676)",
                borderRadius: "3px",
                boxShadow: "0 0 10px rgba(68, 138, 255, 0.7)",
                transition: "width 0.25s ease",
              }}
            />
          </div>
          <div
            style={{
              fontSize: "0.68rem",
              color: "rgba(255,255,255,0.45)",
              marginTop: "5px",
              textAlign: "center",
            }}
          >
            Awaiting rolling window to calculate initial risk
          </div>
        </div>
      )}

      {/* ── Error Notification ── */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            width: "100%",
            background: "rgba(255, 23, 68, 0.12)",
            border: "1px solid rgba(255, 23, 68, 0.4)",
            borderRadius: "10px",
            padding: "10px 12px",
            color: "#ff6b6b",
            fontSize: "0.75rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "1rem", lineHeight: 1 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong>Error: </strong>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* ── Status Pills (WebSocket + Stream Info) ── */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          fontSize: "0.72rem",
        }}
      >
        {/* WebSocket status pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.4)" }}>WebSocket Connection:</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: wsConfig.dot,
                boxShadow: wsStatus === "connected" ? `0 0 8px ${wsConfig.dot}` : "none",
                animation: wsStatus === "connecting" ? "blink 1s ease infinite" : "none",
              }}
            />
            <span style={{ color: wsConfig.color, fontWeight: 700 }}>
              {wsConfig.label}
            </span>
          </div>
        </div>

        {/* Stream format info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          <span>Stream Format:</span>
          <span style={{ color: "rgba(255,255,255,0.8)", fontFamily: "monospace" }}>
            WebM/Opus · 400ms
          </span>
        </div>

        {/* Session ID info */}
        {sessionId && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            <span>Session ID:</span>
            <span
              title={sessionId}
              style={{
                color: "#448aff",
                fontFamily: "monospace",
                cursor: "pointer",
              }}
              onClick={() => navigator.clipboard?.writeText(sessionId)}
            >
              {sessionId.slice(0, 8)}…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
