// ============================================================
// components/auth/SignupForm.jsx
// New user registration form with name, email, password,
// confirm password, and password strength indicator
// ============================================================

import { useState } from "react";
import { useForm } from "react-hook-form";
import InputField from "../ui/InputField";
import Button from "../ui/Button";
import OAuthButtons from "./OAuthButtons";
import useAuth from "../../hooks/useAuth";

// ── Icons ────────────────────────────────────────────────────
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// ── Password Strength Calculator ─────────────────────────────
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

// ── SignupForm Component ─────────────────────────────────────
const SignupForm = () => {
  const { handleRegister, loading } = useAuth();
  const [passwordValue, setPasswordValue] = useState("");
  const strength = getPasswordStrength(passwordValue);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = (data) => {
    handleRegister({ name: data.name, email: data.email, password: data.password });
  };

  return (
    <form
      id="signup-form"
      onSubmit={handleSubmit(onSubmit)}
      className="auth-form"
      noValidate
    >
      {/* Full Name */}
      <InputField
        id="signup-name"
        label="Full Name"
        type="text"
        placeholder="John Doe"
        icon={<UserIcon />}
        error={errors.name?.message}
        register={register("name", {
          required: "Full name is required",
          minLength: { value: 2, message: "Name must be at least 2 characters" },
          maxLength: { value: 50, message: "Name cannot exceed 50 characters" },
        })}
      />

      {/* Email */}
      <InputField
        id="signup-email"
        label="Email address"
        type="email"
        placeholder="alex@example.com"
        icon={<EmailIcon />}
        error={errors.email?.message}
        register={register("email", {
          required: "Email address is required",
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "Please enter a valid email address",
          },
        })}
      />

      {/* Password */}
      <div className="field-group">
        <InputField
          id="signup-password"
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          icon={<LockIcon />}
          error={errors.password?.message}
          register={register("password", {
            required: "Password is required",
            minLength: { value: 6, message: "Password must be at least 6 characters" },
            onChange: (e) => setPasswordValue(e.target.value),
          })}
        />

        {/* Password Strength Bar */}
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
            <span
              className="strength-label"
              style={{ color: strength.color }}
            >
              {strength.label} password
            </span>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <InputField
        id="signup-confirm-password"
        label="Confirm Password"
        type="password"
        placeholder="Repeat your password"
        icon={<LockIcon />}
        error={errors.confirmPassword?.message}
        register={register("confirmPassword", {
          required: "Please confirm your password",
          validate: (value) =>
            value === watch("password") || "Passwords do not match",
        })}
      />

      {/* Create Account Button */}
      <Button id="btn-create-account" type="submit" isLoading={loading}>
        Create Account →
      </Button>

      {/* OR Divider */}
      <div className="auth-divider">
        <span className="auth-divider-text">Or sign up with</span>
      </div>

      {/* OAuth Buttons */}
      <OAuthButtons />
    </form>
  );
};

export default SignupForm;
