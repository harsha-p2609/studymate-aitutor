// ============================================================
// routes/quizRoutes.js
// Route mappings for Quiz endpoints — /api/quizzes/*
// ============================================================

const express = require("express");
const router = express.Router();

const {
  getQuizzes,
  getQuizById,
  submitQuiz,
  getRecentAttempts,
  generateQuiz,
  clearAttempts,
} = require("../controllers/quizController");

const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

router.get("/", getQuizzes);
router.get("/attempts/recent", getRecentAttempts);
router.post("/generate", generateQuiz);
router.delete("/attempts/clear", clearAttempts);
router.get("/:id", getQuizById);
router.post("/:id/submit", submitQuiz);

module.exports = router;
