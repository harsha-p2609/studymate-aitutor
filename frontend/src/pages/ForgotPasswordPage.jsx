// ============================================================
// pages/ForgotPasswordPage.jsx
// Multi-step forgot password flow managed as a state machine:
//   Step 1: ForgotPassword  (enter email → send OTP)
//   Step 2: OtpVerification (enter 6-digit OTP)
//   Step 3: ResetPassword   (enter new password)
// ============================================================

import { useState } from "react";
import Logo from "../components/ui/Logo";
import ForgotPassword from "../components/auth/ForgotPassword";
import OtpVerification from "../components/auth/OtpVerification";
import ResetPassword from "../components/auth/ResetPassword";
import "../styles/auth.css";

// Step identifiers
const STEPS = {
  FORGOT: "forgot",
  OTP: "otp",
  RESET: "reset",
};

// ── Step Progress Indicator ───────────────────────────────────
const StepIndicator = ({ currentStep }) => {
  const steps = [
    { key: STEPS.FORGOT, label: "Email" },
    { key: STEPS.OTP, label: "OTP" },
    { key: STEPS.RESET, label: "Reset" },
  ];

  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        marginBottom: "28px",
      }}
    >
      {steps.map((step, index) => (
        <div key={step.key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Step circle */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background:
                index <= currentIndex
                  ? "var(--color-primary)"
                  : "var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.3s ease",
            }}
          >
            {index < currentIndex ? (
              // Completed: checkmark
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span style={{ color: index <= currentIndex ? "white" : "var(--color-text-muted)", fontSize: 12, fontWeight: 700 }}>
                {index + 1}
              </span>
            )}
          </div>

          {/* Connector line between steps */}
          {index < steps.length - 1 && (
            <div
              style={{
                width: 40,
                height: 2,
                background:
                  index < currentIndex
                    ? "var(--color-primary)"
                    : "var(--color-border)",
                transition: "background 0.3s ease",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// ── ForgotPasswordPage Component ─────────────────────────────
const ForgotPasswordPage = () => {
  const [step, setStep] = useState(STEPS.FORGOT);
  const [email, setEmail] = useState("");         // Carry email across steps
  const [resetToken, setResetToken] = useState(""); // Carry resetToken to step 3

  return (
    <div className="page-bg auth-page" id="forgot-password-page">
      {/* Brand Logo */}
      <div className="fade-in-up" style={{ animationDelay: "0ms" }}>
        <Logo />
      </div>

      {/* Auth Card */}
      <div
        className="auth-card fade-in-up"
        style={{ animationDelay: "80ms" }}
        role="main"
      >
        {/* Step Progress */}
        <StepIndicator currentStep={step} />

        {/* ── Step 1: Email Input ─────────────────────────── */}
        {step === STEPS.FORGOT && (
          <ForgotPassword
            onSuccess={(submittedEmail) => {
              setEmail(submittedEmail);
              setStep(STEPS.OTP); // Move to OTP step
            }}
          />
        )}

        {/* ── Step 2: OTP Verification ─────────────────────── */}
        {step === STEPS.OTP && (
          <OtpVerification
            email={email}
            onSuccess={(token) => {
              setResetToken(token);
              setStep(STEPS.RESET); // Move to reset step
            }}
          />
        )}

        {/* ── Step 3: New Password ──────────────────────────── */}
        {step === STEPS.RESET && (
          <ResetPassword resetToken={resetToken} />
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
