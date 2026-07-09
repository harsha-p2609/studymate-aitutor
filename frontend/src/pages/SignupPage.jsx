// ============================================================
// pages/SignupPage.jsx
// New user registration page
// ============================================================

import { Link } from "react-router-dom";
import Logo from "../components/ui/Logo";
import SignupForm from "../components/auth/SignupForm";
import "../styles/auth.css";

const SignupPage = () => {
  return (
    <div className="page-bg auth-page" id="signup-page">
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
        {/* Card Header */}
        <div className="auth-card-header">
          <h1 className="auth-card-title">Create Account</h1>
          <p className="auth-card-subtitle">
            Join thousands of students on their AI-powered learning journey.
          </p>
        </div>

        {/* Signup Form */}
        <SignupForm />
      </div>

      {/* Login Link */}
      <p
        className="auth-footer fade-in-up"
        style={{ animationDelay: "160ms" }}
      >
        Already have an account?{" "}
        <Link to="/login" id="link-go-to-login">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default SignupPage;
