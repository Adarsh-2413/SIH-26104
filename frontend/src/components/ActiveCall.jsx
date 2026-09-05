// frontend/src/components/ActiveCall.jsx
/**
 * ActiveCall — Live Call Security Dashboard (State 2)
 * Matches the reference design:
 *   1. CALL HEADER: "<", "LIVE CALL" with live equalizer wave, timer "00:00:XX"
 *   2. CALLER DETAILS: Avatar, Unknown Caller, +91 98XXX XXXXX, India 🇮🇳
 *   3. AI ANALYSIS ACTIVE: Shield icon, "Monitoring voice in real-time", animated waveform
 *   4. LARGE RISK GAUGE: 0–100 semi-circular arc gauge with SAFE / SUSPICIOUS / CRITICAL
 *   5. EVIDENCE PANEL: Spoof, Speaker, Prosodic, Phonetic (and Context) channels
 *   6. LIVE RISK GRAPH: Dynamic area chart with gradient fill and score badge
 *   7. RISK EXPLANATION ALERT: Dynamic threat warning based on authoritative risk tier
 *   8. ACTIONS: [ 🛡 VERIFY CALLER ] and [ 📞 END CALL ]
 *   9. FOOTER: "🔒 Your call is secure and encrypted"
 */

import RiskGauge from "./RiskGauge";
import EvidencePanel from "./EvidencePanel";
import RiskGraph from "./RiskGraph";
import AlertBanner from "./AlertBanner";

export default function ActiveCall({
  callerName = "Unknown Caller",
  callerNumber = "+91 98XXX XXXXX",
  callerLocation = "India",
  callDuration = "00:00:00",
  prediction = null,
  graphData = [],
  isWarmingUp = false,
  warmupProgress = null,
  onVerifyCaller,
  onEndCall,
}) {
  const riskScore = prediction ? prediction.risk_score : null;
  const riskLevel = prediction ? prediction.risk_level : null;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "480px",
        margin: "0 auto",
        background: "linear-gradient(180deg, #0d1222 0%, #080c16 100%)",
        border: "1px solid rgba(255, 255, 255, 0.09)",
        borderRadius: "32px",
        boxShadow: "0 30px 80px rgba(0, 0, 0, 0.8), 0 0 50px rgba(68, 138, 255, 0.06)",
        padding: "24px 22px 30px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        position: "relative",
      }}
    >
      {/* ── 1. Top Call Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "4px",
        }}
      >
        {/* Back / Minimize icon */}
        <button
          onClick={onEndCall}
          title="End or minimize call"
          style={{
            background: "none",
            border: "none",
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "1.3rem",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
          }}
        >
          ‹
        </button>

        {/* Live Call Indicator with Animated Equalizer Wave */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Animated Mini Equalizer Bars */}
          <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "14px" }}>
            <span className="equalizer-bar eq-1" />
            <span className="equalizer-bar eq-2" />
            <span className="equalizer-bar eq-3" />
            <span className="equalizer-bar eq-4" />
          </div>

          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: "#00e676",
              textTransform: "uppercase",
            }}
          >
            Live Call
          </span>
        </div>

        {/* Call Timer + Green Live Dot */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 600,
              fontFamily: "'Inter', monospace",
              color: "rgba(255, 255, 255, 0.8)",
            }}
          >
            {callDuration}
          </span>
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#00e676",
              boxShadow: "0 0 8px #00e676",
              animation: "blink 1.2s ease infinite",
            }}
          />
        </div>
      </div>

      {/* ── 2. Caller Avatar & Name ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
        {/* Caller Avatar */}
        <div
          style={{
            width: "78px",
            height: "78px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1c263c 0%, #121828 100%)",
            border: "2px solid rgba(255, 255, 255, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.2rem",
            color: "rgba(255, 255, 255, 0.85)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
          }}
        >
          👤
        </div>

        <h3 style={{ margin: "2px 0 0", fontSize: "1.35rem", fontWeight: 800, color: "#fff" }}>
          {callerName}
        </h3>

        <div
          style={{
            fontSize: "0.92rem",
            color: "rgba(255, 255, 255, 0.6)",
            fontFamily: "'Inter', monospace",
          }}
        >
          {callerNumber}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "0.75rem",
            color: "rgba(255, 255, 255, 0.45)",
          }}
        >
          <span>🇮🇳</span>
          <span>{callerLocation}</span>
        </div>
      </div>

      {/* ── 3. AI Analysis Active Card ── */}
      <div
        style={{
          background: "rgba(0, 230, 118, 0.05)",
          border: "1px solid rgba(0, 230, 118, 0.22)",
          borderRadius: "14px",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "rgba(0, 230, 118, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              color: "#00e676",
            }}
          >
            🛡️
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "0.8rem", color: "#00e676", letterSpacing: "0.04em" }}>
              {isWarmingUp ? "ANALYZING AUDIO..." : "AI ANALYSIS ACTIVE"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.55)" }}>
              {isWarmingUp && warmupProgress
                ? `Buffering rolling window (${warmupProgress.received}/${warmupProgress.needed} chunks)`
                : "Monitoring voice in real-time"}
            </div>
          </div>
        </div>

        {/* Waveform graphic bars */}
        <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "18px" }}>
          {[14, 22, 10, 28, 16, 24, 12, 20, 8, 18, 26, 12, 16].map((h, idx) => (
            <span
              key={idx}
              className="waveform-bar"
              style={{
                width: "2px",
                height: `${h}px`,
                background: "#00e676",
                borderRadius: "1px",
                opacity: 0.8,
                animation: `waveBounce ${0.8 + (idx % 4) * 0.2}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── 4. Large Semi-Circular Risk Gauge ── */}
      <RiskGauge
        score={riskScore}
        level={riskLevel}
        isWarmingUp={isWarmingUp}
      />

      {/* ── 5. Evidence Panel (4 core channels + context) ── */}
      <EvidencePanel prediction={prediction} />

      {/* ── 6. Live Risk Graph ── */}
      <RiskGraph data={graphData} currentScore={riskScore} />

      {/* ── 7. Dynamic Threat Alert Banner ── */}
      <AlertBanner
        level={riskLevel}
        score={riskScore}
        isWarmingUp={isWarmingUp}
      />

      {/* ── 8. Action Buttons: [ VERIFY CALLER ] & [ END CALL ] ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "4px" }}>
        {/* Verify Caller (Blue Outlined Glass) */}
        <button
          onClick={onVerifyCaller}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "14px 12px",
            background: "rgba(68, 138, 255, 0.08)",
            border: "1.5px solid rgba(68, 138, 255, 0.5)",
            borderRadius: "14px",
            color: "#64b5f6",
            fontWeight: 800,
            fontSize: "0.86rem",
            letterSpacing: "0.06em",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 16px rgba(68, 138, 255, 0.15)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(68, 138, 255, 0.16)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(68, 138, 255, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(68, 138, 255, 0.08)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(68, 138, 255, 0.15)";
          }}
        >
          <span style={{ fontSize: "1.1rem" }}>🛡️</span>
          <span>VERIFY CALLER</span>
        </button>

        {/* End Call (Vibrant Red Pill) */}
        <button
          onClick={onEndCall}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "14px 12px",
            background: "linear-gradient(135deg, #ff1744 0%, #d50000 100%)",
            border: "none",
            borderRadius: "14px",
            color: "#fff",
            fontWeight: 800,
            fontSize: "0.86rem",
            letterSpacing: "0.06em",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 6px 20px rgba(255, 23, 68, 0.4)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.02)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 23, 68, 0.55)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1.0)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(255, 23, 68, 0.4)";
          }}
        >
          <span style={{ fontSize: "1.1rem" }}>📞</span>
          <span>END CALL</span>
        </button>
      </div>

      {/* ── 9. Encrypted Footnote ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          fontSize: "0.72rem",
          color: "rgba(255, 255, 255, 0.4)",
        }}
      >
        <span>🔒</span>
        <span>Your call is secure and encrypted</span>
      </div>
    </div>
  );
}
