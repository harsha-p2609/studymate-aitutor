// ============================================================
// models/User.js
// Mongoose schema and model for User
// ============================================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    // ── Basic Info ──────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },

    // ── Password (null for OAuth users) ────────────────────
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never returned in queries by default
    },

    // ── OAuth Providers ─────────────────────────────────────
    googleId: {
      type: String,
      default: null,
    },

    githubId: {
      type: String,
      default: null,
    },

    // ── Profile ─────────────────────────────────────────────
    avatar: {
      type: String,
      default: null, // URL to profile picture
    },

    // ── Account Status ──────────────────────────────────────
    isVerified: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },

    // ── Password Reset OTP ──────────────────────────────────
    resetOTP: {
      type: String,
      default: null,
    },

    resetOTPExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// ── Pre-save Hook: Hash password before saving ──────────────
UserSchema.pre("save", async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password") || !this.password) {
    return;
  }

  // Hash the password with a salt factor of 12
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance Method: Compare entered password with hashed ───
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ── Instance Method: Check if OTP is still valid ────────────
UserSchema.methods.isOTPValid = function (enteredOTP) {
  const isMatch = this.resetOTP === enteredOTP;
  const isNotExpired = this.resetOTPExpires > Date.now();
  return isMatch && isNotExpired;
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
