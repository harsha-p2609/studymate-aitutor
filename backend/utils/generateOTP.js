// ============================================================
// utils/generateOTP.js
// Generates a cryptographically secure 6-digit OTP
// ============================================================

const crypto = require("crypto");

/**
 * Generates a secure random 6-digit OTP.
 * Uses crypto module instead of Math.random() for security.
 * @returns {string} 6-digit OTP string (zero-padded)
 */
const generateOTP = () => {
  // Generate a random number between 100000 and 999999
  const otp = crypto.randomInt(100000, 999999);
  return otp.toString();
};

module.exports = generateOTP;
