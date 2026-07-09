// ============================================================
// components/auth/ResetPassword.jsx
// Step 3 of forgot password flow:
// User sets a new password using the resetToken from OTP verification
// ============================================================

import { useState } from "react";
import { useForm } from "react-hook-form";
import InputField from "../ui/InputField";
import Button from "../ui/Button";
import useAuth from "../../hooks/useAuth";

// ── Icons ────────────────────────────────────────────────────
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CheckIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Password strength helper
const getPasswordStrength = (password) => {
  if (!password) return { level: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { level: 25, label: "Weak", color: "#ef4444" };
  if (score === 2) return { level: 50, label: "Fair", color: "#f59e0b" };
  if (score === 3) return { level: 75, label: "Good", color: "#3b82f6" };
  return { level: 100, label: "Strong", color: "#10b981" };
};

// ── ResetPassword Component ──────────────────────────────────
/**
 * Props:
 * @param {string} resetToken - Short-lived JWT from the verifyOTP step
 */
const ResetPassword = ({ resetToken }) => {
  const { handleResetPassword, loading } = useAuth();
  const [passwordValue, setPasswordValue] = useState("");
  const strength = getPasswordStrength(passwordValue);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { newPassword: "", confirmPassword: "" } });

  const onSubmit = ({ newPassword }) => {
    handleResetPassword(resetToken, newPassword);
    // useAuth hook navigates to /login on success
  };

  return (
    <div>
      {/* Header */}
      <div className="auth-card-header" style={{ textAlign: "center" }}>
        {/* Success Icon */}
        <div className="success-icon" style={{ marginBottom: 16 }}>
          <CheckIcon />
        </div>
        <h1 className="auth-card-title" style={{ textAlign: "center" }}>
          Set New Password
        </h1>
        <p className="auth-card-subtitle" style={{ textAlign: "center" }}>
          OTP verified! Choose a strong new password for your account.
        </p>
      </div>

      {/* Form */}
      <form
        id="reset-password-form"
        onSubmit={handleSubmit(onSubmit)}
        className="auth-form"
        noValidate
      >
        {/* New Password */}
        <div className="field-group">
          <InputField
            id="new-password"
            label="New Password"
            type="password"
            placeholder="Enter a strong password"
            icon={<LockIcon />}
            error={errors.newPassword?.message}
            register={register("newPassword", {
              required: "New password is required",
              minLength: { value: 6, message: "Password must be at least 6 characters" },
              onChange: (e) => setPasswordValue(e.target.value),
            })}
          />

          {/* Strength bar */}
          {passwordValue && (
            <div className="password-strength">
              <div className="strength-bar">
                <div
                  className="strength-fill"
                  style={{
                    width: `${strength.level}%`,
                    background: strength.color,
                    transition: "width 0.3s ease, background 0.3s ease",
                  }}
                />
              </div>
              <span className="strength-label" style={{ color: strength.color }}>
                {strength.label} password
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <InputField
          id="confirm-new-password"
          label="Confirm New Password"
          type="password"
          placeholder="Repeat your new password"
          icon={<LockIcon />}
          error={errors.confirmPassword?.message}
          register={register("confirmPassword", {
            required: "Please confirm your new password",
            validate: (value) =>
              value === watch("newPassword") || "Passwords do not match",
          })}
        />

        {/* Submit */}
        <Button id="btn-reset-password" type="submit" isLoading={loading}>
          Reset Password →
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;
