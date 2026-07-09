// ============================================================
// services/api.js
// Axios instance with base URL and request/response interceptors
// ============================================================

import axios from "axios";

// Base URL points to Express backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create a pre-configured Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send cookies with every request
});

// ── Request Interceptor ──────────────────────────────────────
// Automatically attach JWT token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("studymate_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ─────────────────────────────────────
// Handle 401 Unauthorized globally (e.g., expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem("studymate_token");
      localStorage.removeItem("studymate_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth API Functions ───────────────────────────────────────

/** Register a new user */
export const registerUser = (data) => api.post("/auth/register", data);

/** Login with email and password */
export const loginUser = (data) => api.post("/auth/login", data);

/** Send OTP to email for password reset */
export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email });

/** Verify OTP — returns a resetToken on success */
export const verifyOTP = (email, otp) =>
  api.post("/auth/verify-otp", { email, otp });

/** Reset password using the resetToken from verifyOTP */
export const resetPassword = (resetToken, newPassword) =>
  api.post("/auth/reset-password", { resetToken, newPassword });

/** Get currently logged-in user profile */
export const getCurrentUser = () => api.get("/auth/me");

/** Logout (client-side) */
export const logoutUser = () => api.post("/auth/logout");

// OAuth URLs — user is redirected directly to backend
export const GOOGLE_AUTH_URL = `${API_BASE_URL}/auth/google`;
export const GITHUB_AUTH_URL = `${API_BASE_URL}/auth/github`;

export default api;
