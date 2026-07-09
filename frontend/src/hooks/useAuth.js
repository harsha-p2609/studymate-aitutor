// ============================================================
// hooks/useAuth.js
// Custom hook — wraps AuthContext for convenience
// Also provides form submission helpers with loading/error state
// ============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";
import {
  loginUser,
  registerUser,
  forgotPassword as apiForgotPassword,
  verifyOTP as apiVerifyOTP,
  resetPassword as apiResetPassword,
} from "../services/api";

const useAuth = () => {
  const { login, logout, user, isAuthenticated, isLoading } = useAuthContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Clear error helper ────────────────────────────────────
  const clearError = () => setError(null);

  // ── Login handler ─────────────────────────────────────────
  const handleLogin = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loginUser(formData);
      const { token, user: userData } = response.data;
      login(token, userData);
      toast.success(`Welcome back, ${userData.name.split(" ")[0]}! 🎉`);
      navigate("/home");
    } catch (err) {
      const message =
        err.response?.data?.message || "Login failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Register handler ──────────────────────────────────────
  const handleRegister = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await registerUser(formData);
      const { token, user: userData } = response.data;
      login(token, userData);
      toast.success(`Welcome to StudyMate AI, ${userData.name.split(" ")[0]}! 🚀`);
      navigate("/home");
    } catch (err) {
      const message =
        err.response?.data?.message || "Registration failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password — send OTP ────────────────────────────
  const handleForgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      await apiForgotPassword(email);
      toast.success("OTP sent! Check your email inbox.");
      return true; // Signal success to the component
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to send OTP. Please try again.";
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ────────────────────────────────────────────
  const handleVerifyOTP = async (email, otp) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiVerifyOTP(email, otp);
      toast.success("OTP verified! Now set your new password.");
      return response.data.resetToken; // Pass to ResetPassword component
    } catch (err) {
      const message =
        err.response?.data?.message || "Invalid or expired OTP.";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ── Reset password ────────────────────────────────────────
  const handleResetPassword = async (resetToken, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      await apiResetPassword(resetToken, newPassword);
      toast.success("Password reset successfully! Please log in.");
      navigate("/login");
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to reset password.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────
  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully.");
    navigate("/login");
  };

  return {
    // Auth state
    user,
    isAuthenticated,
    isLoading,
    // Action loading/error
    loading,
    error,
    clearError,
    // Handlers
    handleLogin,
    handleRegister,
    handleForgotPassword,
    handleVerifyOTP,
    handleResetPassword,
    handleLogout,
  };
};

export default useAuth;
