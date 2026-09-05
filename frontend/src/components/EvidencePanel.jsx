// frontend/src/components/EvidencePanel.jsx
/**
 * EvidencePanel — Multi-Modal Evidence Breakdown Rows
 * Matches the reference design:
 *   - Spoof Probability (Red face icon, red progress bar, red %)
 *   - Speaker Similarity (Purple user icon, purple progress bar, purple %)
 *   - Prosodic Anomaly (Orange waveform icon, orange progress bar, orange %)
 *   - Phonetic Evidence (Teal 'Aa' icon, teal progress bar, teal %)
 *   - Context Risk (Optional 5th channel if provided by backend)
 */

function EvidenceRow({ icon, iconBg, label, value, color, hasData = true }) {
  const percent = hasData && typeof value === "number" ? Math.round(value * 100) : null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "36px 140px 1fr 48px",
        alignItems: "center",
        gap: "12px",
        padding: "6px 0",
      }}
    >
      {/* Icon Badge */}
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.85rem",
          fontWeight: 800,
          color: "#fff",
          boxShadow: `0 0 10px ${iconBg}`,
        }}
      >
        {icon}
      </div>

      {/* Channel Label */}
      <span
        style={{
          fontSize: "0.85rem",
          fontWeight: 500,
          color: "rgba(255, 255, 255, 0.85)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>

      {/* Progress Bar */}
      <div
        style={{
          height: "6px",
          borderRadius: "999px",
          background: "rgba(255, 255, 255, 0.08)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {percent !== null && (
          <div
            style={{
              width: `${Math.max(2, Math.min(100, percent))}%`,
              height: "100%",
              background: color,
              borderRadius: "999px",
              boxShadow: `0 0 10px ${color}aa`,
              transition: "width 0.4s ease-out",
            }}
          />
        )}
      </div>

      {/* Percentage Value */}
      <span
        style={{
          fontSize: "0.95rem",
          fontWeight: 700,
          color: percent !== null ? color : "rgba(255, 255, 255, 0.3)",
          textAlign: "right",
          fontFamily: "'Inter', monospace",
        }}
      >
        {percent !== null ? `${percent}%` : "--"}
      </span>
    </div>
  );
}

export default function EvidencePanel({ prediction = null }) {
  const hasData = prediction !== null;

  const {
    spoof_probability = 0,
    speaker_similarity = 0,
    prosodic_anomaly = 0,
    phonetic_evidence = 0,
    context_risk = 0,
  } = prediction || {};

  const phoneticValue =
    typeof phonetic_evidence === "number"
      ? phonetic_evidence
      : typeof phonetic_evidence === "object" && phonetic_evidence !== null
      ? (phonetic_evidence.score ?? 0)
      : 0;

  return (
    <div
      style={{
        background: "rgba(18, 24, 38, 0.65)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      {/* 1. Spoof Probability (Red) */}
      <EvidenceRow
        icon="🎭"
        iconBg="#ff1744"
        label="Spoof Probability"
        value={spoof_probability}
        color="#ff4081"
        hasData={hasData}
      />

      {/* 2. Speaker Similarity (Purple/Blue) */}
      <EvidenceRow
        icon="👤"
        iconBg="#7c4dff"
        label="Speaker Similarity"
        value={speaker_similarity}
        color="#8c9eff"
        hasData={hasData}
      />

      {/* 3. Prosodic Anomaly (Orange) */}
      <EvidenceRow
        icon="〰️"
        iconBg="#ff9100"
        label="Prosodic Anomaly"
        value={prosodic_anomaly}
        color="#ffa726"
        hasData={hasData}
      />

      {/* 4. Phonetic Evidence (Teal) */}
      <EvidenceRow
        icon="Aa"
        iconBg="#00b0ff"
        label="Phonetic Evidence"
        value={phoneticValue}
        color="#00e5ff"
        hasData={hasData}
      />

      {/* 5. Context Risk (if present) */}
      {context_risk !== undefined && (
        <EvidenceRow
          icon="🛡️"
          iconBg="#00e676"
          label="Context Risk"
          value={context_risk}
          color="#69f0ae"
          hasData={hasData}
        />
      )}
    </div>
  );
}
