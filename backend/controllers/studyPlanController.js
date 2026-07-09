// ============================================================
// controllers/studyPlanController.js
// Controller handlers for Study Plan endpoints
// ============================================================

const StudyPlan = require("../models/StudyPlan");

/** Helper: Recalculate progress for active module and course */
const recalculateProgress = (plan) => {
  const activeModule = plan.timeline.find(item => item.status === "current");
  if (activeModule) {
    const totalGoals = plan.dailyGoals.length;
    const completedGoals = plan.dailyGoals.filter(g => g.completed).length;
    if (totalGoals > 0) {
      activeModule.progressPercent = Math.min(Math.round((completedGoals / totalGoals) * 100), 100);
    } else {
      activeModule.progressPercent = 0;
    }

    // If active module reaches 100%, mark completed and unlock the next module
    if (activeModule.progressPercent >= 100) {
      activeModule.status = "completed";
      activeModule.completedDate = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      const nextModule = plan.timeline.find(item => item.status === "upcoming");
      if (nextModule) {
        nextModule.status = "current";
        nextModule.progressPercent = 0;
      }
    }
  }

  // Course progress is average progress of all modules
  plan.overallProgress = Math.round(
    plan.timeline.reduce((sum, item) => sum + item.progressPercent, 0) / plan.timeline.length
  );
};

/** Get study plan for the logged-in user */
exports.getStudyPlan = async (req, res, next) => {
  try {
    let plan = await StudyPlan.findOne({ userId: req.user.id });

    // Initialize default plan if it doesn't exist
    if (!plan) {
      plan = await StudyPlan.create({
        userId: req.user.id,
        roadmapTitle: "Full-Stack Development Mastery",
        overallProgress: 0,
        streak: 0,
        lastStudyDate: null,
        timeline: [
          {
            title: "Foundations of Modern Web",
            status: "current",
            completedDate: "",
            progressPercent: 0,
            lessonsCount: 4,
            examsCount: 1,
            challengesCount: 2,
          },
          {
            title: "Advanced React State Management",
            status: "upcoming",
            completedDate: "",
            progressPercent: 0,
            lessonsCount: 3,
            examsCount: 1,
            challengesCount: 2,
          },
          {
            title: "Backend Scalability & Node.js",
            status: "upcoming",
            completedDate: "",
            progressPercent: 0,
            lessonsCount: 6,
            examsCount: 2,
            challengesCount: 3,
          },
          {
            title: "Cloud Deployment & CI/CD",
            status: "upcoming",
            completedDate: "",
            progressPercent: 0,
            lessonsCount: 5,
            examsCount: 1,
            challengesCount: 2,
          },
        ],
        dailyGoals: [
          { task: "Review Redux Toolkit slices", completed: false, difficulty: "Medium", estMinutes: 45 },
          { task: "Solve 2 Performance Challenges", completed: false, difficulty: "High", estMinutes: 60 },
          { task: "Watch \"Hydration in SSR\" module", completed: false, difficulty: "Medium", estMinutes: 30 },
        ],
      });
    }

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

/** Add a new goal to daily goals checklist */
exports.addGoal = async (req, res, next) => {
  try {
    const { task, difficulty, estMinutes } = req.body;

    if (!task) {
      return res.status(400).json({
        success: false,
        message: "Goal task description is required",
      });
    }

    const plan = await StudyPlan.findOne({ userId: req.user.id });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Study plan not found",
      });
    }

    plan.dailyGoals.push({ task, difficulty, estMinutes, completed: false });
    recalculateProgress(plan);
    await plan.save();

    res.status(201).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

/** Update completion status of a daily goal */
exports.updateGoalStatus = async (req, res, next) => {
  try {
    const { goalId, completed } = req.body;

    if (goalId === undefined || completed === undefined) {
      return res.status(400).json({
        success: false,
        message: "goalId and completed status are required",
      });
    }

    const plan = await StudyPlan.findOne({ userId: req.user.id });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Study plan not found",
      });
    }

    const goal = plan.dailyGoals.id(goalId);
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found",
      });
    }

    goal.completed = completed;

    // Streak Logic: If completing a goal, check if user studied today
    if (completed) {
      const today = new Date();
      const lastDate = plan.lastStudyDate;
      const studiedToday = lastDate && (
        lastDate.getDate() === today.getDate() &&
        lastDate.getMonth() === today.getMonth() &&
        lastDate.getFullYear() === today.getFullYear()
      );

      if (!studiedToday) {
        plan.streak += 1;
        plan.lastStudyDate = today;
      }
    }

    recalculateProgress(plan);
    await plan.save();

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};
