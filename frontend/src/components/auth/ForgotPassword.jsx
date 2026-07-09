// ============================================================
// components/auth/ForgotPassword.jsx
// Step 1 of forgot password flow:
// User enters their email → backend sends OTP
// ============================================================

import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import InputField from "../ui/InputField";
import Button from "../ui/Button";
import useAuth from "../../hooks/useAuth";

// ── Icons ────────────────────────────────────────────────────
const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

// ── ForgotPassword Component ─────────────────────────────────
/**
 * Props:
 * @param {function} onSuccess - Called with the email when OTP is sent
 */
const ForgotPassword = ({ onSuccess }) => {
  const { handleForgotPassword, loading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: "" } });

  const onSubmit = async ({ email }) => {
    const success = await handleForgotPassword(email);
    if (success) {
      onSuccess(email); // Move to OTP verification step
    }
  };

  return (
    <div>
      {/* Back to Login */}
      <Link to="/login" className="back-link" id="link-back-to-login">
        <ArrowLeftIcon />
        Back to Login
      </Link>

      {/* Card Header */}
      <div className="auth-card-header">
        <h1 className="auth-card-title">Forgot Password?</h1>
        <p className="auth-card-subtitle">
          Enter the email address linked to your account. We'll send you a
          6-digit OTP to reset your password.
        </p>
      </div>

      {/* Form */}
      <form
        id="forgot-password-form"
        onSubmit={handleSubmit(onSubmit)}
        className="auth-form"
        noValidate
      >
        <InputField
          id="forgot-email"
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

        <Button id="btn-send-otp" type="submit" isLoading={loading}>
          Send OTP →
        </Button>
      </form>
    </div>
  );
};

export default ForgotPassword;
