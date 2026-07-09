// ============================================================
// routes/flashcardRoutes.js
// Route mappings for Flashcards endpoints — /api/flashcards/*
// ============================================================

const express = require("express");
const router = express.Router();

const {
  getDecks,
  getDeckById,
  generateDeck,
  toggleCardMastery,
  deleteDeck,
} = require("../controllers/flashcardController");

const { protect } = require("../middleware/authMiddleware");

// All routes require user authentication
router.use(protect);

router.get("/", getDecks);
router.post("/generate", generateDeck);
router.get("/:id", getDeckById);
router.put("/:id/cards/:cardId/mastery", toggleCardMastery);
router.delete("/:id", deleteDeck);

module.exports = router;
