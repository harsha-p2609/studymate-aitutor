// ============================================================
// routes/studyPlanRoutes.js
// Route mappings for Study Plan endpoints — /api/study-plan/*
// ============================================================

const express = require("express");
const router = express.Router();

const {
  getStudyPlan,
  addGoal,
  updateGoalStatus,
  regenerateStudyPlan,
  updateModuleStatus,
} = require("../controllers/studyPlanController");

const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

router.get("/", getStudyPlan);
router.post("/regenerate", regenerateStudyPlan);
router.put("/timeline/status", updateModuleStatus);
router.post("/goals", addGoal);
router.put("/goals", updateGoalStatus);

module.exports = router;
