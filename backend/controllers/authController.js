// ============================================================
// controllers/authController.js
// Handles all authentication logic:
//   - Register, Login, Logout
//   - Forgot Password (OTP), Verify OTP, Reset Password
//   - OAuth callback handler (Google & GitHub)
//   - Get current user
// ============================================================

const User = require("../models/User");
const { signToken } = require("../utils/jwtHelper");
const generateOTP = require("../utils/generateOTP");
const { sendOTPEmail } = require("../utils/emailService");

// ── Helper: Create token and send response ──────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken({ id: user._id, email: user.email });

  // Remove sensitive fields from response
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    isVerified: user.isVerified,
  };

  res.status(statusCode).json({
    success: true,
    token,
    user: userResponse,
  });
};

// ──────────────────────────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
// ──────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please log in.",
      });
    }

    // Create user — password will be hashed by the pre-save hook in User model
    const user = await User.create({ name, email, password });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error during registration. Please try again.",
    });
  }
};

// ──────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Login with email and password
// @access  Public
// ──────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password.",
      });
    }

    // Auto-create demo user if using mock credentials
    if (email.toLowerCase() === "demo@studymate.ai" && password === "password123") {
      let user = await User.findOne({ email: "demo@studymate.ai" }).select("+password");
      if (!user) {
        user = await User.create({
          name: "Demo Student",
          email: "demo@studymate.ai",
          password: "password123",
          isVerified: true,
        });
      }
      return sendTokenResponse(user, 200, res);
    }

    // Find user and explicitly select password (it's excluded by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check if user registered via OAuth only (no password set)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message:
          "This account uses Google or GitHub login. Please use the OAuth buttons.",
      });
    }

    // Compare provided password with stored hash
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error during login. Please try again.",
    });
  }
};

// ──────────────────────────────────────────────────────────────
// @route   POST /api/auth/forgot-password
// @desc    Send OTP to user email for password reset
// @access  Public
// ──────────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // SECURITY: Always return success even if email not found
    // This prevents email enumeration attacks
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If this email is registered, you will receive an OTP shortly.",
      });
    }

    // Generate a 6-digit OTP
    const otp = generateOTP();
    const expiresMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES) || 10;

    // Save OTP and expiry to user document
    user.resetOTP = otp;
    user.resetOTPExpires = new Date(Date.now() + expiresMinutes * 60 * 1000);
    await user.save();

    // Send OTP via email
    await sendOTPEmail(user.email, otp, user.name);

    res.status(200).json({
      success: true,
      message: "If this email is registered, you will receive an OTP shortly.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
    });
  }
};

// ──────────────────────────────────────────────────────────────
// @route   POST /api/auth/verify-otp
// @desc    Verify OTP entered by user
// @access  Public
// ──────────────────────────────────────────────────────────────
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.resetOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP or OTP request not found.",
      });
    }

    // Check OTP validity (match + not expired)
    if (!user.isOTPValid(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new one.",
      });
    }

    // OTP is valid — issue a short-lived reset token
    const resetToken = signToken({ id: user._id, purpose: "reset" });

    res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      resetToken, // Frontend will send this with the new password
    });
  } catch (error) {
    console.error("Verify OTP Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// ──────────────────────────────────────────────────────────────
// @route   POST /api/auth/reset-password
// @desc    Set a new password after OTP verification
// @access  Public (requires resetToken from verifyOTP)
// ──────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // Verify the reset token
    const { verifyToken } = require("../utils/jwtHelper");
    let decoded;
    try {
      decoded = verifyToken(resetToken);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token. Please start over.",
      });
    }

    // Ensure the token is specifically a reset token
    if (decoded.purpose !== "reset") {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token.",
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Update password — pre-save hook will hash it
    user.password = newPassword;
    user.resetOTP = null;        // Clear OTP
    user.resetOTPExpires = null; // Clear OTP expiry
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// ──────────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get currently authenticated user's profile
// @access  Private (requires valid JWT)
// ──────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get Me Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// ──────────────────────────────────────────────────────────────
// @route   GET /api/auth/google/callback (called by Passport)
// @desc    Handle OAuth callback — issue JWT and redirect to frontend
// @access  Public
// ──────────────────────────────────────────────────────────────
const oauthCallback = (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=oauth_failed`
      );
    }

    // Generate JWT for the OAuth user
    const token = signToken({ id: user._id, email: user.email });

    // Redirect to frontend with token in query param
    // Frontend will extract token and store it (e.g., in localStorage)
    res.redirect(`${process.env.CLIENT_URL}/oauth/callback?token=${token}`);
  } catch (error) {
    console.error("OAuth Callback Error:", error.message);
    res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
  }
};

// ──────────────────────────────────────────────────────────────
// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal instruction)
// @access  Public
// ──────────────────────────────────────────────────────────────
const logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully. Please remove the token from client storage.",
  });
};

module.exports = {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getMe,
  oauthCallback,
  logout,
};
