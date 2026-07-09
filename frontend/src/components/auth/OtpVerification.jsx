// ============================================================
// components/auth/OtpVerification.jsx
// Step 2 of forgot password flow:
// User enters the 6-digit OTP received in their email
// ============================================================

import { useRef, useState, useEffect } from "react";
import Button from "../ui/Button";
import useAuth from "../../hooks/useAuth";

// ── OtpVerification Component ────────────────────────────────
/**
 * Props:
 * @param {string}   email       - Email OTP was sent to
 * @param {function} onSuccess   - Called with resetToken when OTP is valid
 * @param {function} onResend    - Called when user clicks "Resend OTP"
 */
const OtpVerification = ({ email, onSuccess, onResend }) => {
  const { handleVerifyOTP, handleForgotPassword, loading } = useAuth();

  // 6 individual input refs for auto-focus behavior
  const inputRefs = useRef([]);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(60); // 60 second cooldown
  const [canResend, setCanResend] = useState(false);

  // ── Countdown timer for resend button ─────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ── Handle digit input ─────────────────────────────────────
  const handleDigitChange = (index, value) => {
    // Allow only single numeric digit
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-focus next input on digit entry
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ── Handle backspace navigation ────────────────────────────
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ── Handle paste (e.g., from email copy) ──────────────────
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newDigits = [...digits];
    pasted.split("").forEach((char, i) => {
      if (i < 6) newDigits[i] = char;
    });
    setDigits(newDigits);
    // Focus last filled input
    const lastIndex = Math.min(pasted.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  // ── Submit OTP ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length < 6) return;

    const resetToken = await handleVerifyOTP(email, otp);
    if (resetToken) {
      onSuccess(resetToken); // Proceed to reset password step
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────
  const handleResend = async () => {
    setDigits(["", "", "", "", "", ""]);
    setCanResend(false);
    setResendCooldown(60);
    inputRefs.current[0]?.focus();
    await handleForgotPassword(email);
  };

  const isComplete = digits.every((d) => d !== "");
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");

  return (
    <div>
      {/* Card Header */}
      <div className="auth-card-header">
        <h1 className="auth-card-title">Enter OTP</h1>
        <p className="auth-card-subtitle">
          We sent a 6-digit code to{" "}
          <strong style={{ color: "var(--color-primary)" }}>{maskedEmail}</strong>.
          Enter it below to continue.
        </p>
      </div>

      {/* OTP Form */}
      <form
        id="otp-verification-form"
        onSubmit={handleSubmit}
        className="auth-form"
        noValidate
      >
        {/* 6-Digit OTP Grid */}
        <div className="otp-grid" role="group" aria-label="OTP input">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              id={`otp-digit-${index + 1}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="otp-digit"
              aria-label={`OTP digit ${index + 1}`}
              autoFocus={index === 0}
            />
          ))}
        </div>

        {/* Verify Button */}
        <Button
          id="btn-verify-otp"
          type="submit"
          isLoading={loading}
          disabled={!isComplete}
        >
          Verify OTP →
        </Button>

        {/* Resend OTP */}
        <div className="resend-row">
          <span>Didn't receive the code?</span>
          <button
            id="btn-resend-otp"
            type="button"
            className="resend-btn"
            disabled={!canResend}
            onClick={handleResend}
          >
            {canResend ? "Resend OTP" : `Resend in ${resendCooldown}s`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OtpVerification;
