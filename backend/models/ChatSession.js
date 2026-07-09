// ============================================================
// models/ChatSession.js
// Mongoose schema and model for ChatSession
// ============================================================

const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ["user", "ai"],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  attachment: {
    name: String,
    url: String,
    fileType: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ChatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topic: {
      type: String,
      default: "AI Tutor Study Session",
    },
    messages: [ChatMessageSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ChatSession", ChatSessionSchema);
