// ============================================================
// components/auth/LoginForm.jsx
// Email + password login form with validation
// Matches the design: email field, password with toggle,
// Forgot Password link, Sign In button
// ============================================================

import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import InputField from "../ui/InputField";
import Button from "../ui/Button";
import OAuthButtons from "./OAuthButtons";
import useAuth from "../../hooks/useAuth";

// ── Icons ────────────────────────────────────────────────────
const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// ── LoginForm Component ──────────────────────────────────────
const LoginForm = () => {
  const { handleLogin, loading } = useAuth();

  // react-hook-form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: "", password: "" },
  });

  // Form submission
  const onSubmit = (data) => {
    handleLogin(data);
  };

  return (
    <form
      id="login-form"
      onSubmit={handleSubmit(onSubmit)}
      className="auth-form"
      noValidate
    >
      {/* Email Field */}
      <InputField
        id="login-email"
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

      {/* Password Field */}
      <InputField
        id="login-password"
        label="Password"
        type="password"
        placeholder="Enter your password"
        icon={<LockIcon />}
        error={errors.password?.message}
        labelAction={
          <Link
            to="/forgot-password"
            className="field-label-link"
            id="link-forgot-password"
          >
            Forgot Password?
          </Link>
        }
        register={register("password", {
          required: "Password is required",
          minLength: {
            value: 6,
            message: "Password must be at least 6 characters",
          },
        })}
      />

      {/* Sign In Button */}
      <Button
        id="btn-sign-in"
        type="submit"
        isLoading={loading}
      >
        Sign In
        <ArrowRightIcon />
      </Button>

      {/* OR Divider */}
      <div className="auth-divider">
        <span className="auth-divider-text">Or continue with</span>
      </div>

      {/* OAuth Buttons */}
      <OAuthButtons />
    </form>
  );
};

export default LoginForm;
