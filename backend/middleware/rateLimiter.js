// ============================================================
// middleware/rateLimiter.js
// Prevents brute-force attacks on login and OTP endpoints
// ============================================================

const rateLimit = require("express-rate-limit");

/**
 * Rate limiter for login endpoint.
 * Allows max 10 attempts per 15 minutes per IP.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
});

/**
 * Rate limiter for OTP requests.
 * Allows max 3 OTP requests per 10 minutes per IP.
 * This prevents OTP spam/abuse.
 */
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: {
    success: false,
    message: "Too many OTP requests. Please wait 10 minutes before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for user registration.
 * Allows max 5 registrations per hour per IP.
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: "Too many accounts created from this IP. Please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, otpLimiter, registerLimiter };
