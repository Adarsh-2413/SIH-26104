// frontend/src/components/AlertBanner.jsx
/**
 * AlertBanner — Dynamic Risk Explanation & Threat Card
 * Matches the reference design:
 *   - Warning icon
 *   - Bold threat title
 *   - Clear, concise risk guidance
 *   - Dynamic color & text based on authoritative risk level
 */

export default function AlertBanner({ level = null, score = null, isWarmingUp = false }) {
  // Determine state config
  const config = (() => {
    if (isWarmingUp) {
      return {
        icon: "⏳",
        iconColor: "#448aff",
        title: "Voice Stream Analyzing...",
        subtitle: "Accumulating sliding-window audio frames for biometric verification.",
        bg: "rgba(68, 138, 255, 0.08)",
        border: "rgba(68, 138, 255, 0.3)",
      };
    }

    if (level === "CRITICAL" || (score !== null && score >= 70)) {
      return {
        icon: "🚨",
        iconColor: "#ff1744",
        title: "Possible Voice Impersonation Detected",
        subtitle: "Elevated acoustic and biometric anomalies indicate potential synthetic speech. Independent verification required.",
        bg: "rgba(255, 23, 68, 0.12)",
        border: "rgba(255, 23, 68, 0.45)",
        pulse: true,
      };
    }

    if (level === "SUSPICIOUS" || (score !== null && score >= 40)) {
      return {
        icon: "⚠️",
        iconColor: "#ff9100",
        title: "Possible Voice Impersonation",
        subtitle: "Voice characteristics require additional verification before sharing sensitive details.",
        bg: "rgba(255, 145, 0, 0.1)",
        border: "rgba(255, 145, 0, 0.35)",
      };
    }

    if (level === "SAFE" || (score !== null && score < 40)) {
      return {
        icon: "🛡️",
        iconColor: "#00e676",
        title: "Voice Characteristics Verified",
        subtitle: "No significant voice spoofing or biometric mismatch indicators detected.",
        bg: "rgba(0, 230, 118, 0.08)",
        border: "rgba(0, 230, 118, 0.25)",
      };
    }

    // Default standby
    return {
      icon: "🛡️",
      iconColor: "rgba(255,255,255,0.4)",
      title: "Real-Time Protection Active",
      subtitle: "Monitoring voice stream for synthetic voice and replay attacks.",
      bg: "rgba(255, 255, 255, 0.03)",
      border: "rgba(255, 255, 255, 0.08)",
    };
  })();

  return (
    <div
      role="alert"
      className={config.pulse ? "pulse-critical" : ""}
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: "14px",
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        transition: "all 0.4s ease",
      }}
    >
      <div
        style={{
          fontSize: "1.6rem",
          lineHeight: 1,
          color: config.iconColor,
          flexShrink: 0,
        }}
      >
        {config.icon}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <h4
          style={{
            margin: 0,
            fontSize: "0.92rem",
            fontWeight: 800,
            color: config.iconColor,
            letterSpacing: "-0.01em",
          }}
        >
          {config.title}
        </h4>
        <p
          style={{
            margin: 0,
            fontSize: "0.76rem",
            color: "rgba(255, 255, 255, 0.65)",
            lineHeight: 1.35,
          }}
        >
          {config.subtitle}
        </p>
      </div>
    </div>
  );
}
