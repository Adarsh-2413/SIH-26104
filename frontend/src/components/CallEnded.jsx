// frontend/src/components/CallEnded.jsx
/**
 * CallEnded — Call Summary & Return-to-Call Transition
 */

export default function CallEnded({
  callerName = "Unknown Caller",
  callerNumber = "+91 98XXX XXXXX",
  duration = "00:00",
  finalScore = null,
  finalLevel = null,
  peakScore = null,
  onRestartCall,
}) {
  const levelColor =
    finalLevel === "CRITICAL"
      ? "#ff1744"
      : finalLevel === "SUSPICIOUS"
      ? "#ff9100"
      : finalLevel === "SAFE"
      ? "#00e676"
      : "rgba(255, 255, 255, 0.4)";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "460px",
        margin: "0 auto",
        background: "linear-gradient(180deg, #0e1424 0%, #080c16 100%)",
        border: "1px solid rgba(255, 255, 255, 0.09)",
        borderRadius: "28px",
        boxShadow: "0 25px 60px rgba(0, 0, 0, 0.65)",
        padding: "36px 28px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <div
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "rgba(255, 23, 68, 0.12)",
          border: "1.5px solid rgba(255, 23, 68, 0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.8rem",
          color: "#ff1744",
        }}
      >
        📞
      </div>

      <div style={{ textAlign: "center" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: "1.35rem", fontWeight: 800, color: "#fff" }}>
          Call Concluded
        </h2>
        <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255, 255, 255, 0.45)" }}>
          {callerName} · {callerNumber}
        </p>
      </div>

      {/* Call Metrics Card */}
      <div
        style={{
          width: "100%",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.07)",
          borderRadius: "16px",
          padding: "16px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        <div style={{ padding: "8px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
          <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
            Duration
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginTop: "2px" }}>
            {duration}
          </div>
        </div>

        <div style={{ padding: "8px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
          <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
            Final Risk Tier
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: levelColor, marginTop: "2px" }}>
            {finalLevel || "N/A"}
          </div>
        </div>

        <div style={{ padding: "8px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
          <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
            Last Risk Score
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: levelColor, marginTop: "2px" }}>
            {finalScore !== null ? `${finalScore}/100` : "--"}
          </div>
        </div>

        <div style={{ padding: "8px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
          <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
            Peak Risk Score
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: peakScore >= 70 ? "#ff1744" : peakScore >= 40 ? "#ff9100" : "#00e676", marginTop: "2px" }}>
            {peakScore !== null ? `${peakScore}/100` : "--"}
          </div>
        </div>
      </div>

      {/* Security note */}
      <div
        style={{
          fontSize: "0.72rem",
          color: "rgba(0, 230, 118, 0.7)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span>✓</span>
        <span>Microphone tracks released & audio buffer flushed</span>
      </div>

      {/* Restart Simulation Button */}
      <button
        onClick={onRestartCall}
        style={{
          width: "100%",
          padding: "14px 20px",
          background: "linear-gradient(135deg, #00e676 0%, #00c853 100%)",
          border: "none",
          borderRadius: "14px",
          color: "#080c16",
          fontWeight: 800,
          fontSize: "0.95rem",
          letterSpacing: "0.02em",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          boxShadow: "0 8px 24px rgba(0, 230, 118, 0.3)",
          marginTop: "8px",
        }}
      >
        <span>📞</span>
        <span>Simulate Incoming Call</span>
      </button>
    </div>
  );
}
