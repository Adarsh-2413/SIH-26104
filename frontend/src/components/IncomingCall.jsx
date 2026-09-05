// frontend/src/components/IncomingCall.jsx
/**
 * IncomingCall — Realistic Modern Secure Phone-Call Interface (State 1)
 *
 * Requirements:
 *   - Caller avatar
 *   - Caller name / number (+91 98XXX XXXXX · India 🇮🇳)
 *   - Incoming call indicator with radar pulse
 *   - AI protection indicator ("Ready to analyze this call")
 *   - Accept button (starts call & microphone streaming)
 *   - Decline button (returns to neutral state)
 */

export default function IncomingCall({
  callerName = "Unknown Caller",
  callerNumber = "+91 98XXX XXXXX",
  callerLocation = "India",
  onAccept,
  onDecline,
}) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "460px",
        margin: "0 auto",
        background: "linear-gradient(180deg, #0e1424 0%, #080c16 100%)",
        border: "1px solid rgba(255, 255, 255, 0.09)",
        borderRadius: "28px",
        boxShadow: "0 25px 60px rgba(0, 0, 0, 0.65), 0 0 40px rgba(68, 138, 255, 0.08)",
        padding: "36px 28px 40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: "absolute",
          top: "-40px",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0, 230, 118, 0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top Header Label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "32px",
          padding: "6px 14px",
          background: "rgba(255, 255, 255, 0.04)",
          borderRadius: "999px",
          border: "1px solid rgba(255, 255, 255, 0.07)",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#00e676",
            boxShadow: "0 0 10px #00e676",
            animation: "blink 1s ease infinite",
          }}
        />
        <span
          style={{
            fontSize: "0.74rem",
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: "rgba(255, 255, 255, 0.7)",
            textTransform: "uppercase",
          }}
        >
          Incoming Call
        </span>
      </div>

      {/* Caller Avatar with Animated Ripple Rings */}
      <div
        style={{
          position: "relative",
          width: "120px",
          height: "120px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "22px",
        }}
      >
        {/* Pulsing ring 1 */}
        <span
          style={{
            position: "absolute",
            inset: "-14px",
            borderRadius: "50%",
            border: "2px solid rgba(0, 230, 118, 0.25)",
            animation: "ripple 2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite",
          }}
        />
        {/* Pulsing ring 2 */}
        <span
          style={{
            position: "absolute",
            inset: "-28px",
            borderRadius: "50%",
            border: "1px solid rgba(0, 230, 118, 0.15)",
            animation: "ripple 2s cubic-bezier(0.1, 0.8, 0.3, 1) 0.6s infinite",
          }}
        />

        {/* Center avatar circle */}
        <div
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1c263c 0%, #121828 100%)",
            border: "2.5px solid rgba(255, 255, 255, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
            zIndex: 2,
          }}
        >
          <span style={{ fontSize: "2.8rem", color: "rgba(255, 255, 255, 0.85)" }}>👤</span>
        </div>
      </div>

      {/* Caller Details */}
      <h2
        style={{
          margin: "0 0 6px",
          fontSize: "1.55rem",
          fontWeight: 800,
          color: "#fff",
          letterSpacing: "-0.01em",
          textAlign: "center",
        }}
      >
        {callerName}
      </h2>

      <div
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          color: "rgba(255, 255, 255, 0.6)",
          fontFamily: "'Inter', monospace",
          letterSpacing: "0.02em",
          marginBottom: "8px",
        }}
      >
        {callerNumber}
      </div>

      {/* Country Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "0.78rem",
          color: "rgba(255, 255, 255, 0.5)",
          marginBottom: "28px",
        }}
      >
        <span>🇮🇳</span>
        <span>{callerLocation}</span>
      </div>

      {/* AI Voice Protection Card */}
      <div
        style={{
          width: "100%",
          background: "rgba(0, 230, 118, 0.06)",
          border: "1px solid rgba(0, 230, 118, 0.25)",
          borderRadius: "14px",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "38px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(0, 230, 118, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.2rem",
            color: "#00e676",
            flexShrink: 0,
          }}
        >
          🛡️
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "#00e676", letterSpacing: "0.04em" }}>
            AI VOICE PROTECTION ACTIVE
          </div>
          <div style={{ fontSize: "0.74rem", color: "rgba(255, 255, 255, 0.65)", marginTop: "2px" }}>
            Ready to analyze this call in real-time
          </div>
        </div>
      </div>

      {/* Action Buttons: [ Decline ] & [ Accept ] */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "0 16px",
        }}
      >
        {/* Decline Button (Red) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <button
            onClick={onDecline}
            aria-label="Decline call"
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ff1744 0%, #d50000 100%)",
              border: "none",
              color: "#fff",
              fontSize: "1.7rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(255, 23, 68, 0.35)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
          >
            ✕
          </button>
          <span style={{ fontSize: "0.74rem", color: "rgba(255, 255, 255, 0.5)", fontWeight: 600 }}>
            Decline
          </span>
        </div>

        {/* Accept Button (Green) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <button
            onClick={onAccept}
            aria-label="Accept call and start AI analysis"
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #00e676 0%, #00c853 100%)",
              border: "none",
              color: "#fff",
              fontSize: "1.7rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 30px rgba(0, 230, 118, 0.45)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              animation: "alertPulse 1.8s ease-in-out infinite",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
          >
            📞
          </button>
          <span style={{ fontSize: "0.74rem", color: "#00e676", fontWeight: 700 }}>
            Accept
          </span>
        </div>
      </div>
    </div>
  );
}
