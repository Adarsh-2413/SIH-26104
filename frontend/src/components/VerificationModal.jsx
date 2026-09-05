// frontend/src/components/VerificationModal.jsx
/**
 * VerificationModal — Out-of-Band Independent Caller Verification
 * Requirements:
 *   - Title: "VERIFY CALLER"
 *   - Message: "AI analysis indicates elevated risk. Independently verify the caller before sharing sensitive information."
 *   - Conceptual verification options:
 *       1. Send OTP
 *       2. Trusted Callback
 *       3. Confirm with Trusted Contact
 *   - Interactive feedback on button press
 *   - Clean close/dismiss action
 */

import { useState } from "react";

export default function VerificationModal({ isOpen, onClose, callerNumber = "+91 98XXX XXXXX" }) {
  const [activeAction, setActiveAction] = useState(null);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const handleAction = (actionKey, message) => {
    setActiveAction(actionKey);
    setFeedback(message);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(4, 7, 15, 0.82)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(145deg, #101626 0%, #0c101c 100%)",
          border: "1px solid rgba(68, 138, 255, 0.3)",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "460px",
          padding: "26px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(68, 138, 255, 0.15)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(68, 138, 255, 0.15)",
                border: "1px solid rgba(68, 138, 255, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
                color: "#448aff",
              }}
            >
              🛡️
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>
                VERIFY CALLER
              </h3>
              <span style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.4)" }}>
                Target: {callerNumber}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close verification modal"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Advisory Message */}
        <div
          style={{
            background: "rgba(255, 145, 0, 0.08)",
            border: "1px solid rgba(255, 145, 0, 0.25)",
            borderRadius: "12px",
            padding: "12px 14px",
            fontSize: "0.82rem",
            color: "rgba(255, 255, 255, 0.85)",
            lineHeight: 1.45,
          }}
        >
          <strong style={{ color: "#ff9100", display: "block", marginBottom: "4px" }}>
            ⚠️ Elevated Voice Risk Detected
          </strong>
          AI analysis indicates potential voice spoofing. Independently verify the caller before sharing passwords, OTPs, or financial credentials.
        </div>

        {/* Feedback notification if an action was clicked */}
        {feedback && (
          <div
            style={{
              background: "rgba(0, 230, 118, 0.1)",
              border: "1px solid rgba(0, 230, 118, 0.4)",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "0.78rem",
              color: "#00e676",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              animation: "fadeIn 0.3s ease",
            }}
          >
            <span>✓</span>
            <span>{feedback}</span>
          </div>
        )}

        {/* Verification Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Action 1: Send OTP */}
          <button
            onClick={() =>
              handleAction(
                "otp",
                "Out-of-band verification challenge dispatched to customer's registered phone ending in *42."
              )
            }
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              background: activeAction === "otp" ? "rgba(68, 138, 255, 0.2)" : "rgba(255,255,255,0.04)",
              border: activeAction === "otp" ? "1.5px solid #448aff" : "1px solid rgba(255,255,255,0.09)",
              borderRadius: "12px",
              color: "#fff",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.3rem" }}>📲</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>Send Out-of-Band OTP</div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>
                  Sends single-use code to caller's registered mobile number
                </div>
              </div>
            </div>
            <span style={{ fontSize: "0.8rem", color: "#448aff" }}>→</span>
          </button>

          {/* Action 2: Trusted Callback */}
          <button
            onClick={() =>
              handleAction(
                "callback",
                "Trusted callback route generated. Direct line to authorized department queued."
              )
            }
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              background: activeAction === "callback" ? "rgba(68, 138, 255, 0.2)" : "rgba(255,255,255,0.04)",
              border: activeAction === "callback" ? "1.5px solid #448aff" : "1px solid rgba(255,255,255,0.09)",
              borderRadius: "12px",
              color: "#fff",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.3rem" }}>📞</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>Initiate Trusted Callback</div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>
                  Hang up and dial verified branch or enterprise directory
                </div>
              </div>
            </div>
            <span style={{ fontSize: "0.8rem", color: "#448aff" }}>→</span>
          </button>

          {/* Action 3: Confirm with Trusted Contact */}
          <button
            onClick={() =>
              handleAction(
                "contact",
                "Secondary authentication prompt dispatched to account manager."
              )
            }
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              background: activeAction === "contact" ? "rgba(68, 138, 255, 0.2)" : "rgba(255,255,255,0.04)",
              border: activeAction === "contact" ? "1.5px solid #448aff" : "1px solid rgba(255,255,255,0.09)",
              borderRadius: "12px",
              color: "#fff",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.3rem" }}>👥</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>Confirm with Trusted Contact</div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>
                  Cross-verify caller identity via designated co-signer
                </div>
              </div>
            </div>
            <span style={{ fontSize: "0.8rem", color: "#448aff" }}>→</span>
          </button>
        </div>

        {/* Modal Footer Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "10px",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Return to Call
          </button>
        </div>
      </div>
    </div>
  );
}
