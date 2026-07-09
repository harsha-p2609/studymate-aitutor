// ============================================================
// models/Quiz.js
// Mongoose schema and model for Quiz
// ============================================================

const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["single-choice", "multiple-choice"],
    default: "single-choice",
  },
  imagePath: {
    type: String,
    default: "", // URL or path to help diagram
  },
  options: {
    type: [String],
    required: true,
  },
  correctAnswerIndex: {
    type: Number,
    required: true,
  },
  explanation: {
    type: String,
    default: "", // Review details for this question
  },
});

const QuizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    chapter: {
      type: String,
      default: "",
    },
    questions: [QuestionSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Quiz", QuizSchema);
