// frontend/src/components/StatusBadge.jsx
/**
 * StatusBadge — Authoritative Risk Level Display
 *
 * Requirements:
 *   - Display authoritative risk_level from backend: SAFE, SUSPICIOUS, CRITICAL
 *   - Never interpret warming_up or idle as SAFE
 *   - Distinct visual state for warmup and idle
 */

const LEVEL_CONFIG = {
  SAFE: {
    label: "SAFE",
    color: "#00e676",
    bg: "rgba(0, 230, 118, 0.12)",
    border: "rgba(0, 230, 118, 0.4)",
    glow: "0 0 20px rgba(0, 230, 118, 0.35)",
    icon: "✓",
  },
  SUSPICIOUS: {
    label: "SUSPICIOUS",
    color: "#ffb300",
    bg: "rgba(255, 179, 0, 0.12)",
    border: "rgba(255, 179, 0, 0.4)",
    glow: "0 0 20px rgba(255, 179, 0, 0.35)",
    icon: "⚠",
  },
  CRITICAL: {
    label: "CRITICAL",
    color: "#ff1744",
    bg: "rgba(255, 23, 68, 0.12)",
    border: "rgba(255, 23, 68, 0.4)",
    glow: "0 0 20px rgba(255, 23, 68, 0.45)",
    icon: "✕",
  },
};

export default function StatusBadge({ level = null, isWarmingUp = false }) {
  if (isWarmingUp) {
    return (
      <div
        className="status-badge"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1.25rem",
          borderRadius: "999px",
          border: "1.5px solid rgba(68, 138, 255, 0.4)",
          background: "rgba(68, 138, 255, 0.12)",
          boxShadow: "0 0 15px rgba(68, 138, 255, 0.3)",
          color: "#448aff",
          fontWeight: 700,
          fontSize: "0.9rem",
          letterSpacing: "0.12em",
          userSelect: "none",
        }}
      >
        <span style={{ animation: "blink 1s ease-in-out infinite" }}>⏳</span>
        ANALYZING AUDIO...
      </div>
    );
  }

  if (!level) {
    return (
      <div
        className="status-badge"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1.25rem",
          borderRadius: "999px",
          border: "1.5px solid rgba(255, 255, 255, 0.1)",
          background: "rgba(255, 255, 255, 0.04)",
          color: "rgba(255, 255, 255, 0.4)",
          fontWeight: 700,
          fontSize: "0.9rem",
          letterSpacing: "0.12em",
          userSelect: "none",
        }}
      >
        <span>●</span>
        STANDBY
      </div>
    );
  }

  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.SAFE;

  return (
    <div
      className={`status-badge ${level === "CRITICAL" ? "pulse-critical" : ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 1.25rem",
        borderRadius: "999px",
        border: `1.5px solid ${cfg.border}`,
        background: cfg.bg,
        boxShadow: cfg.glow,
        color: cfg.color,
        fontWeight: 700,
        fontSize: "0.95rem",
        letterSpacing: "0.12em",
        transition: "all 0.4s ease",
        userSelect: "none",
      }}
    >
      <span style={{ fontSize: "1.1rem" }}>{cfg.icon}</span>
      {cfg.label}
    </div>
  );
}
