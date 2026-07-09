// ============================================================
// middleware/authMiddleware.js
// Protects routes — verifies JWT token from Authorization header
// ============================================================

const { verifyToken } = require("../utils/jwtHelper");
const User = require("../models/User");

/**
 * Middleware to protect private routes.
 * Expects: Authorization: Bearer <token>
 * If valid, attaches the user object to req.user
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided. Please log in.",
      });
    }

    // Verify the token
    const decoded = verifyToken(token);

    // Find the user from the decoded token payload
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists.",
      });
    }

    // Attach user to request object for downstream use
    req.user = user;
    next();
  } catch (error) {
    // Handle expired or malformed tokens
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token. Please log in again.",
    });
  }
};

/**
 * Middleware to restrict access to admin users only.
 * Must be used AFTER the protect middleware.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }
};

module.exports = { protect, adminOnly };
