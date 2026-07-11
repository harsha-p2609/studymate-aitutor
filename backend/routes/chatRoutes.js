// ============================================================
// routes/chatRoutes.js
// Route mappings for Chat endpoints — /api/chat/*
// ============================================================

const express = require("express");
const router = express.Router();

const {
  getSessions,
  createSession,
  getSessionById,
  sendMessage,
  uploadFile,
  deleteSession,
  deleteAllSessions,
} = require("../controllers/chatController");

const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// All routes require authentication
router.use(protect);

router.get("/sessions", getSessions);
router.post("/sessions", createSession);
router.delete("/sessions", deleteAllSessions);
router.get("/sessions/:id", getSessionById);
router.post("/sessions/:id/message", sendMessage);
router.delete("/sessions/:id", deleteSession);
router.post("/upload", upload.single("file"), uploadFile);

module.exports = router;
