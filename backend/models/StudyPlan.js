// ============================================================
// models/StudyPlan.js
// Mongoose schema and model for StudyPlan
// ============================================================

const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
});

const TimelineItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["completed", "current", "upcoming"],
    required: true,
  },
  completedDate: {
    type: String, // String for display formatting e.g. "Oct 12"
    default: "",
  },
  progressPercent: {
    type: Number,
    default: 0,
  },
  lessonsCount: {
    type: Number,
    default: 0,
  },
  examsCount: {
    type: Number,
    default: 0,
  },
  challengesCount: {
    type: Number,
    default: 0,
  },
  resources: [ResourceSchema],
  videoLinks: [ResourceSchema],
});

const DailyGoalSchema = new mongoose.Schema({
  task: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  difficulty: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium",
  },
  estMinutes: {
    type: Number,
    default: 30,
  },
});

const StudyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One study plan per user
    },
    roadmapTitle: {
      type: String,
      default: "Full-Stack Development Mastery",
    },
    overallProgress: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 0,
    },
    lastStudyDate: {
      type: Date,
      default: null,
    },
    timeline: [TimelineItemSchema],
    dailyGoals: [DailyGoalSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StudyPlan", StudyPlanSchema);
