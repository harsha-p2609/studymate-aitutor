// ============================================================
// pages/OAuthCallbackPage.jsx
// Handles the redirect from backend after Google/GitHub login.
// Backend redirects to: /oauth/callback?token=<JWT>
// This page extracts the token, stores it, and redirects to dashboard.
// ============================================================

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loadUser } = useAuthContext();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      toast.error("OAuth login failed. Please try again.");
      navigate("/login");
      return;
    }

    if (token) {
      // Store token and load user profile from backend
      localStorage.setItem("studymate_token", token);
      loadUser().then(() => {
        toast.success("Logged in successfully! 🎉");
        navigate("/home");
      });
    } else {
      navigate("/login");
    }
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        background: "var(--color-bg)",
      }}
    >
      <div className="spinner" style={{ width: 40, height: 40, border: "3px solid rgba(79,70,229,0.2)", borderTopColor: "var(--color-primary)" }} />
      <p style={{ color: "var(--color-text-secondary)", fontSize: "15px" }}>
        Completing login, please wait...
      </p>
    </div>
  );
};

export default OAuthCallbackPage;
