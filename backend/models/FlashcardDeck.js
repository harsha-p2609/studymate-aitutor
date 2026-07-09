// ============================================================
// models/FlashcardDeck.js
// Mongoose schema and model for Flashcard Decks
// ============================================================

const mongoose = require("mongoose");

const FlashcardSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, "Question is required"],
    trim: true,
  },
  answer: {
    type: String,
    required: [true, "Answer explanation is required"],
    trim: true,
  },
  mastered: {
    type: Boolean,
    default: false,
  },
});

const FlashcardDeckSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for global default seeded decks
    },
    title: {
      type: String,
      required: [true, "Deck title is required"],
      trim: true,
      maxlength: [80, "Deck title cannot exceed 80 characters"],
    },
    description: {
      type: String,
      required: [true, "Deck description is required"],
      trim: true,
      maxlength: [200, "Deck description cannot exceed 200 characters"],
    },
    icon: {
      type: String,
      default: "style", // Material icon identifier (e.g., style, psychology, schema)
    },
    cardCount: {
      type: Number,
      default: 0,
    },
    lastStudied: {
      type: Date,
      default: Date.now,
    },
    cards: [FlashcardSchema],
  },
  {
    timestamps: true, // Automatically manage createdAt/updatedAt
  }
);

// Pre-save hook: automatically sync cardCount with cards array size
FlashcardDeckSchema.pre("save", function () {
  if (this.cards) {
    this.cardCount = this.cards.length;
  }
});

const FlashcardDeck = mongoose.model("FlashcardDeck", FlashcardDeckSchema);

module.exports = FlashcardDeck;
