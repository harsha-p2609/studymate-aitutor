// ============================================================
// models/QuizAttempt.js
// Mongoose schema and model for QuizAttempt
// ============================================================

const mongoose = require("mongoose");

const QuizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    answers: {
      type: [Number], // Selected option index for each question
      required: true,
    },
    score: {
      type: Number, // Percentage score (e.g. 88)
      required: true,
    },
    status: {
      type: String,
      enum: ["Passed", "Retake"],
      required: true,
    },
    attemptDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("QuizAttempt", QuizAttemptSchema);
