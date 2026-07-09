// ============================================================
// pages/LoginPage.jsx
// Main login page — matches the provided design exactly:
// Logo, "Welcome Back" card, LoginForm, Sign Up link
// ============================================================

import { Link } from "react-router-dom";
import Logo from "../components/ui/Logo";
import LoginForm from "../components/auth/LoginForm";
import "../styles/auth.css";

const LoginPage = () => {
  return (
    <div className="page-bg auth-page" id="login-page">
      {/* Animated background handled by CSS */}

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
          <h1 className="auth-card-title">Welcome</h1>
          <p className="auth-card-subtitle">
            Log in to continue your learning journey.
          </p>
        </div>

        {/* Login Form */}
        <LoginForm />
      </div>

      {/* Sign Up Link */}
      <p
        className="auth-footer fade-in-up"
        style={{ animationDelay: "160ms" }}
      >
        Don't have an account?{" "}
        <Link to="/signup" id="link-go-to-signup">
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
