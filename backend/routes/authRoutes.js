// ============================================================
// routes/authRoutes.js
// All authentication API routes — /api/auth/*
// ============================================================

const express = require("express");
const router = express.Router();

const {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getMe,
  oauthCallback,
  logout,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const {
  loginLimiter,
  otpLimiter,
  registerLimiter,
} = require("../middleware/rateLimiter");

// ── Email / Password Auth ───────────────────────────────────
router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);

// ── Forgot Password / OTP / Reset ──────────────────────────
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// ── Protected Route ─────────────────────────────────────────
router.get("/me", protect, getMe);

// ── Google OAuth 2.0 ─────────────────────────────────────────
// These routes are only mounted if Google credentials exist
const GOOGLE_CONFIGURED =
  !!process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== "paste_your_client_id_here" &&
  !!process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_SECRET !== "paste_your_client_secret_here";

const GITHUB_CONFIGURED =
  !!process.env.GITHUB_CLIENT_ID &&
  process.env.GITHUB_CLIENT_ID !== "your_github_client_id" &&
  !!process.env.GITHUB_CLIENT_SECRET &&
  process.env.GITHUB_CLIENT_SECRET !== "your_github_client_secret";

// Fallback handler when OAuth is not configured
const oauthNotConfigured = (provider) => (req, res) => {
  res.status(501).json({
    success: false,
    message: `${provider} OAuth is not configured. Add credentials to your .env file.`,
  });
};

if (GOOGLE_CONFIGURED) {
  // Google OAuth only registered when credentials exist
  const passport = require("passport");
  router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
  );
  router.get(
    "/google/callback",
    passport.authenticate("google", {
      failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`,
      session: false,
    }),
    oauthCallback
  );
} else {
  // Return friendly error when Google not configured
  router.get("/google", oauthNotConfigured("Google"));
  router.get("/google/callback", oauthNotConfigured("Google"));
}

// ── GitHub OAuth ─────────────────────────────────────────────
if (GITHUB_CONFIGURED) {
  const passport = require("passport");
  router.get(
    "/github",
    passport.authenticate("github", { scope: ["user:email"], session: false })
  );
  router.get(
    "/github/callback",
    passport.authenticate("github", {
      failureRedirect: `${process.env.CLIENT_URL}/login?error=github_failed`,
      session: false,
    }),
    oauthCallback
  );
} else {
  router.get("/github", oauthNotConfigured("GitHub"));
  router.get("/github/callback", oauthNotConfigured("GitHub"));
}

module.exports = router;
