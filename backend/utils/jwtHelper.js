// ============================================================
// utils/jwtHelper.js
// Helper functions to sign and verify JWT tokens
// ============================================================

const jwt = require("jsonwebtoken");

/**
 * Signs a JWT token with the user payload.
 * @param {object} payload - Data to embed in the token (e.g., { id, email })
 * @returns {string} Signed JWT token
 */
const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * Verifies a JWT token and returns the decoded payload.
 * Throws an error if the token is invalid or expired.
 * @param {string} token - JWT token string
 * @returns {object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { signToken, verifyToken };
