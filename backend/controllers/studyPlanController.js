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

/** Get study plans for the logged-in user (newest first) */
exports.getStudyPlan = async (req, res, next) => {
  try {
    const plans = await StudyPlan.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    const activePlan = plans[0] || null;
    const otherPlans = plans.slice(1);

    res.status(200).json({
      success: true,
      data: activePlan,
      otherPlans: otherPlans,
    });
  } catch (error) {
    next(error);
  }
};

/** Regenerate study plan dynamically based on a topic */
exports.regenerateStudyPlan = async (req, res, next) => {
  try {
    const { topic } = req.body;
    if (!topic || topic.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Topic is required to regenerate study plan",
      });
    }

    const updatedPlan = await exports.updateStudyPlanForTopic(req.user.id, topic);

    res.status(200).json({
      success: true,
      data: updatedPlan,
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

    const plan = await StudyPlan.findOne({ userId: req.user.id }).sort({ updatedAt: -1 });
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

    const plan = await StudyPlan.findOne({ userId: req.user.id }).sort({ updatedAt: -1 });
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

/** Generate or update a study plan roadmap dynamically based on topic */
exports.updateStudyPlanForTopic = async (userId, topic) => {
  if (!topic || topic.trim() === "") return;

  const geminiKey = process.env.GEMINI_API_KEY;
  const isGeminiConfigured =
    geminiKey &&
    geminiKey !== "your_gemini_api_key_here" &&
    !geminiKey.startsWith("AQ.");

  let planJson = "";

  // 1. Attempt LLM Generation using Gemini
  if (isGeminiConfigured) {
    try {
      const prompt = `Generate a comprehensive, end-to-end, step-by-step study plan roadmap for the topic: "${topic}", inspired by the detailed path structures of roadmap.sh.
The roadmap must cover all foundational, intermediate, advanced, and expert-level concepts necessary to master the subject from start to finish.

The plan must contain:
1. A roadmap title (e.g. "Complete Machine Learning Developer Roadmap").
2. A detailed timeline array of 8 to 15 chronological modules (steps) covering the entire learning path.
   For each module, provide 2 high-quality learning resources (documentation/articles) and 2 recommended video explanation links (YouTube/FreeCodeCamp/etc.).
3. Exactly 3 daily starter goals/tasks for the user.

Return ONLY a valid JSON object matching this format (no markdown blocks, no backticks, no wrap text):
{
  "roadmapTitle": "Title",
  "timeline": [
    {
      "title": "Module Title",
      "lessonsCount": 4,
      "examsCount": 1,
      "challengesCount": 2,
      "resources": [
        { "name": "Resource Name", "url": "Resource URL" },
        { "name": "Resource Name", "url": "Resource URL" }
      ],
      "videoLinks": [
        { "name": "Video Explanation Name", "url": "Video URL" },
        { "name": "Video Explanation Name", "url": "Video URL" }
      ]
    }
  ],
  "dailyGoals": [
    {
      "task": "Task Description",
      "difficulty": "Medium",
      "estMinutes": 45
    }
  ]
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      if (response.ok) {
        const resData = await response.json();
        planJson = resData.candidates[0]?.content?.parts[0]?.text || "";
      } else {
        console.error("Gemini StudyPlan API returned error code:", response.status);
      }
    } catch (err) {
      console.error("Gemini StudyPlan Gen Error:", err.message);
    }
  }

  // 2. Fallback to Local Mock Generation (If API not set or failed)
  if (!planJson) {
    console.log("⚠️ Using local mock StudyPlan generator for topic:", topic);
    const lowerTopic = topic.toLowerCase();
    let roadmapTitle = `${topic} Mastery`;
    let timeline = [];
    let dailyGoals = [];

    if (lowerTopic.includes("machine") || lowerTopic.includes("ml") || lowerTopic.includes("ai") || lowerTopic.includes("intelligence")) {
      roadmapTitle = "Complete Machine Learning Developer Roadmap";
      timeline = [
        { title: "Mathematics Foundations (Linear Algebra, Calculus, Stats)", lessonsCount: 6, examsCount: 1, challengesCount: 2 },
        { title: "Python Programming & Core Libraries (NumPy, Pandas, Matplotlib)", lessonsCount: 5, examsCount: 1, challengesCount: 3 },
        { title: "Data Preprocessing & Exploratory Data Analysis (EDA)", lessonsCount: 4, examsCount: 1, challengesCount: 2 },
        { title: "Classical Supervised Learning (Regression, Classification, SVMs)", lessonsCount: 6, examsCount: 1, challengesCount: 3 },
        { title: "Unsupervised Learning & Clustering (K-Means, PCA)", lessonsCount: 4, examsCount: 1, challengesCount: 2 },
        { title: "Deep Learning Fundamentals & Neural Networks", lessonsCount: 5, examsCount: 1, challengesCount: 3 },
        { title: "Deep Learning Frameworks (TensorFlow & PyTorch, CNNs, RNNs)", lessonsCount: 6, examsCount: 2, challengesCount: 3 },
        { title: "Natural Language Processing (NLP) & Computer Vision (CV)", lessonsCount: 5, examsCount: 1, challengesCount: 2 },
        { title: "Large Language Models (LLMs) & Generative AI Systems", lessonsCount: 5, examsCount: 1, challengesCount: 2 },
        { title: "Model Deployment, Monitoring & MLOps Infrastructure", lessonsCount: 4, examsCount: 1, challengesCount: 2 }
      ];
      dailyGoals = [
        { task: "Review Linear Regression math and gradients", difficulty: "Medium", estMinutes: 45 },
        { task: "Implement a k-Nearest Neighbors classifier in NumPy", difficulty: "High", estMinutes: 60 },
        { task: "Watch 'Bias-Variance Tradeoff' lecture video", difficulty: "Medium", estMinutes: 30 },
      ];
    } else if (lowerTopic.includes("database") || lowerTopic.includes("db") || lowerTopic.includes("sql") || lowerTopic.includes("nosql") || lowerTopic.includes("mongodb") || lowerTopic.includes("query")) {
      roadmapTitle = "Complete Database Engineer & Architect Roadmap";
      timeline = [
        { title: "Introduction to Relational Algebra & Database Systems", lessonsCount: 4, examsCount: 1, challengesCount: 2 },
        { title: "SQL Programming Basics (DML, DDL, JOINs, Aggregates)", lessonsCount: 5, examsCount: 1, challengesCount: 3 },
        { title: "Advanced SQL Queries & Window Functions", lessonsCount: 4, examsCount: 1, challengesCount: 3 },
        { title: "Database Design & Entity-Relationship Modeling (ERD)", lessonsCount: 4, examsCount: 1, challengesCount: 2 },
        { title: "Database Normalization Patterns (1NF, 2NF, 3NF, BCNF)", lessonsCount: 3, examsCount: 1, challengesCount: 2 },
        { title: "Database Indexes, Hash Tables & Query Tuning", lessonsCount: 5, examsCount: 1, challengesCount: 3 },
        { title: "Transactions, Concurrency Control & ACID Compliance", lessonsCount: 4, examsCount: 1, challengesCount: 2 },
        { title: "NoSQL Databases & MongoDB Document Schema Design", lessonsCount: 5, examsCount: 2, challengesCount: 3 },
        { title: "Distributed Architectures, Sharding & Replication", lessonsCount: 4, examsCount: 1, challengesCount: 2 },
        { title: "Data Warehousing, ETL pipelines & Analytics", lessonsCount: 4, examsCount: 1, challengesCount: 2 }
      ];
      dailyGoals = [
        { task: "Write complex JOIN query with subqueries", difficulty: "Medium", estMinutes: 40 },
        { task: "Design 3NF schema for an e-commerce platform", difficulty: "High", estMinutes: 60 },
        { task: "Learn about B-Trees and indexing overhead", difficulty: "Medium", estMinutes: 30 },
      ];
    } else {
      timeline = [
        { title: `${topic} Prerequisites & Setup`, lessonsCount: 4, examsCount: 1, challengesCount: 2 },
        { title: `Foundations of ${topic}`, lessonsCount: 5, examsCount: 1, challengesCount: 3 },
        { title: `Core Architecture & Lifecycle of ${topic}`, lessonsCount: 4, examsCount: 1, challengesCount: 2 },
        { title: `State & Data Management in ${topic}`, lessonsCount: 4, examsCount: 1, challengesCount: 2 },
        { title: `Advanced Patterns & Styling in ${topic}`, lessonsCount: 4, examsCount: 1, challengesCount: 2 },
        { title: `Testing, Debugging & QA for ${topic}`, lessonsCount: 4, examsCount: 1, challengesCount: 2 },
        { title: `Performance Optimization & Security in ${topic}`, lessonsCount: 4, examsCount: 1, challengesCount: 2 },
        { title: `Production Deployment & CI/CD for ${topic}`, lessonsCount: 4, examsCount: 1, challengesCount: 2 }
      ];
      dailyGoals = [
        { task: `Review core principles of ${topic}`, difficulty: "Medium", estMinutes: 45 },
        { task: `Build a sample application utilizing ${topic}`, difficulty: "High", estMinutes: 60 },
        { task: `Read documentation on ${topic} best practices`, difficulty: "Medium", estMinutes: 30 },
      ];
    }

    planJson = JSON.stringify({ roadmapTitle, timeline, dailyGoals });
  }

  // Clean any markdown wrappers if present
  let cleanJson = planJson.trim();
  if (cleanJson.startsWith("```")) {
    cleanJson = cleanJson.replace(/^```(json)?\n/, "");
    cleanJson = cleanJson.replace(/\n```$/, "");
  }

  const parsedPlan = JSON.parse(cleanJson);

  // Map to timeline structure with default status and resource generation
  const formattedTimeline = parsedPlan.timeline.map((item, idx) => {
    // Generate fallback resource links if missing
    const resources = item.resources && item.resources.length > 0
      ? item.resources
      : [
          {
            name: "Documentation & Guides",
            url: `https://www.google.com/search?q=${encodeURIComponent(item.title + " documentation guides reference")}`
          },
          {
            name: "Developer Tutorials",
            url: `https://devdocs.io/#q=${encodeURIComponent(item.title)}`
          }
        ];

    const videoLinks = item.videoLinks && item.videoLinks.length > 0
      ? item.videoLinks
      : [
          {
            name: "YouTube Video explanation",
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(item.title + " explanation tutorial")}`
          },
          {
            name: "FreeCodeCamp video course",
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent("freecodecamp " + item.title)}`
          }
        ];

    return {
      title: item.title,
      status: idx === 0 ? "current" : "upcoming",
      completedDate: "",
      progressPercent: 0,
      lessonsCount: item.lessonsCount || 4,
      examsCount: item.examsCount || 1,
      challengesCount: item.challengesCount || 2,
      resources,
      videoLinks,
    };
  });

  const formattedGoals = parsedPlan.dailyGoals.map(item => ({
    task: item.task,
    completed: false,
    difficulty: item.difficulty || "Medium",
    estMinutes: item.estMinutes || 30,
  }));

  // Fetch previous plan to carry over the user's streak
  const lastPlan = await StudyPlan.findOne({ userId }).sort({ updatedAt: -1 });
  const streak = lastPlan ? lastPlan.streak : 0;
  const lastStudyDate = lastPlan ? lastPlan.lastStudyDate : null;

  // Always create a new study plan for multiple roadmaps support
  const plan = await StudyPlan.create({
    userId,
    roadmapTitle: parsedPlan.roadmapTitle,
    overallProgress: 0,
    streak,
    lastStudyDate,
    timeline: formattedTimeline,
    dailyGoals: formattedGoals,
  });

  return plan;
};

/** Update status of a timeline module */
exports.updateModuleStatus = async (req, res, next) => {
  try {
    const { moduleId, status } = req.body;
    if (!moduleId || !status) {
      return res.status(400).json({
        success: false,
        message: "moduleId and status are required",
      });
    }

    const plan = await StudyPlan.findOne({ userId: req.user.id }).sort({ updatedAt: -1 });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Study plan not found",
      });
    }

    const moduleItem = plan.timeline.id(moduleId);
    if (!moduleItem) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    moduleItem.status = status;
    if (status === "completed") {
      moduleItem.progressPercent = 100;
      moduleItem.completedDate = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      // Automatically unlock the next upcoming module if there is one
      const currentIndex = plan.timeline.findIndex(m => m._id.toString() === moduleId);
      if (currentIndex !== -1 && currentIndex + 1 < plan.timeline.length) {
        const nextModule = plan.timeline[currentIndex + 1];
        if (nextModule.status === "upcoming") {
          nextModule.status = "current";
          nextModule.progressPercent = 0;
        }
      }
    } else if (status === "current") {
      moduleItem.progressPercent = 0;
      moduleItem.completedDate = "";
    } else {
      moduleItem.progressPercent = 0;
      moduleItem.completedDate = "";
    }

    // Recalculate overall progress
    plan.overallProgress = Math.round(
      plan.timeline.reduce((sum, item) => sum + item.progressPercent, 0) / plan.timeline.length
    );

    await plan.save();

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

/** Activate a specific study plan (updates its updatedAt timestamp) */
exports.activateStudyPlan = async (req, res, next) => {
  try {
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "planId is required to activate study plan",
      });
    }

    const plan = await StudyPlan.findOneAndUpdate(
      { _id: planId, userId: req.user.id },
      { $set: { updatedAt: new Date() } },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Study plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Study plan activated successfully",
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

/** Delete a specific study plan/roadmap */
exports.deleteStudyPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "planId is required to delete study plan",
      });
    }

    const plan = await StudyPlan.findOneAndDelete({
      _id: planId,
      userId: req.user.id,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Study plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Study plan deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
