// ============================================================
// pages/StudyPlanPage.jsx
// Study Plan view featuring roadmap timeline, checklist goals,
// interactive Pomodoro focus timer, and motivational quotes
// ============================================================

import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const quotesList = [
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
];

const StudyPlanPage = () => {
  const [studyPlan, setStudyPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newGoalText, setNewGoalText] = useState("");
  const [newGoalDifficulty, setNewGoalDifficulty] = useState("Medium");
  const [newGoalMinutes, setNewGoalMinutes] = useState(30);

  // Pomodoro Timer States
  const [timeRemaining, setTimeRemaining] = useState(1500); // 25:00
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerIntervalId, setTimerIntervalId] = useState(null);

  // Quote State
  const [quoteIndex, setQuoteIndex] = useState(0);

  const fetchStudyPlan = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await api.get("/study-plan");
      if (res.data.success) {
        setStudyPlan(res.data.data);
      }
    } catch (err) {
      console.error("Error loading study plan:", err);
      toast.error("Failed to load study plan");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyPlan();
    return () => {
      if (timerIntervalId) clearInterval(timerIntervalId);
    };
  }, []);

  // Pomodoro Timer Effects & Actions
  const toggleTimer = () => {
    if (timerRunning) {
      clearInterval(timerIntervalId);
      setTimerRunning(false);
    } else {
      setTimerRunning(true);
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimerRunning(false);
            toast.success("Focus session completed! Take a break. ☕");
            return 1500;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerIntervalId(interval);
    }
  };

  const resetTimer = () => {
    if (timerIntervalId) clearInterval(timerIntervalId);
    setTimerRunning(false);
    setTimeRemaining(1500);
  };

  const formatTimer = () => {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Checklist Actions
  const handleToggleGoal = async (goalId, currentCompleted) => {
    try {
      const res = await api.put("/study-plan/goals", {
        goalId,
        completed: !currentCompleted,
      });
      if (res.data.success) {
        setStudyPlan(res.data.data);
        toast.success(currentCompleted ? "Goal set to active" : "Goal completed! 🎉");
      }
    } catch (err) {
      console.error("Error toggling goal status:", err);
      toast.error("Failed to update goal");
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;

    try {
      const res = await api.post("/study-plan/goals", {
        task: newGoalText,
        difficulty: newGoalDifficulty,
        estMinutes: newGoalMinutes,
      });

      if (res.data.success) {
        setStudyPlan(res.data.data);
        setNewGoalText("");
        toast.success("New goal added successfully");
      }
    } catch (err) {
      console.error("Error adding new goal:", err);
      toast.error("Failed to add goal");
    }
  };

  const handleUpdateModuleStatus = async (moduleId, newStatus) => {
    try {
      const res = await api.put("/study-plan/timeline/status", {
        moduleId,
        status: newStatus,
      });
      if (res.data.success) {
        setStudyPlan(res.data.data);
        toast.success(`Module marked as ${newStatus}!`);
      }
    } catch (err) {
      console.error("Error updating module status:", err);
      toast.error("Failed to update module status");
    }
  };

  const changeQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % quotesList.length);
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center p-xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate stats
  const overallProgress = studyPlan?.overallProgress || 0;
  const strokeDashoffset = 251.2 - (251.2 * overallProgress) / 100;
  const currentQuote = quotesList[quoteIndex];

  return (
    <div className="p-gutter pb-xl flex-grow grid grid-cols-1 lg:grid-cols-12 gap-lg">
      {/* ── Left Column: Roadmap & Timeline ───────────────────────────── */}
      <div className="lg:col-span-8 flex flex-col gap-lg">
        {/* Roadmap Hero Card */}
        <section className="bg-white border border-outline-variant rounded-xl p-lg relative overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md z-10 relative">
            <div className="flex-grow">
              <div className="flex items-center gap-xs mb-xs">
                <span className="px-sm py-base bg-secondary-container text-on-secondary-container rounded-full text-label-sm font-label-sm font-bold uppercase tracking-wider">
                  Advanced Curriculum
                </span>
              </div>
              <h3 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-xs">
                {studyPlan?.roadmapTitle}
              </h3>
              <p className="text-on-surface-variant font-body-md max-w-md">
                Mastering React, Node.js, and Cloud Infrastructure through systematic AI-guided learning modules.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-md bg-surface-container-low rounded-xl border border-outline-variant/30 shrink-0">
              <div className="relative w-24 h-24">
                {/* Circular Progress Ring */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" fill="transparent" r="40" stroke="#eff4ff" strokeWidth="8"></circle>
                  <circle
                    className="transition-all duration-1000 ease-out"
                    cx="48"
                    cy="48"
                    fill="transparent"
                    r="40"
                    stroke="#3525cd"
                    strokeDasharray="251.2"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    strokeWidth="8"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-title-md text-title-md font-bold text-primary">{overallProgress}%</span>
                </div>
              </div>
              <span className="font-label-sm text-label-sm mt-xs text-on-surface-variant font-semibold">Course Progress</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
          </div>
        </section>

        {/* Learning Roadmap Detailed Timeline */}
        <section className="bg-white border border-outline-variant rounded-xl p-lg shadow-sm">
          <div className="flex justify-between items-center mb-lg">
            <h4 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary">route</span>
              Learning Roadmap
            </h4>
            <span className="text-primary font-label-md hover:underline font-semibold cursor-pointer">
              View Full Syllabus
            </span>
          </div>

          <div className="relative pl-xs">
            {/* Timeline dotted/dashed separator */}
            <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-repeating-dashed border-l border-dashed border-outline"></div>

            <div className="space-y-xl">
              {studyPlan?.timeline?.map((module, idx) => {
                const isCompleted = module.status === "completed";
                const isCurrent = module.status === "current";

                return (
                  <div key={module.title || idx} className="relative pl-lg">
                    {/* Timeline Node Icon */}
                    {isCompleted ? (
                      <div className="absolute left-0 top-1 w-6 h-6 bg-tertiary rounded-full border-4 border-white flex items-center justify-center z-10 shadow-sm">
                        <span className="material-symbols-outlined text-[14px] text-white font-bold">check</span>
                      </div>
                    ) : isCurrent ? (
                      <div className="absolute left-0 top-1 w-6 h-6 bg-primary rounded-full border-4 border-white flex items-center justify-center z-10 shadow-md">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    ) : (
                      <div className="absolute left-0 top-1 w-6 h-6 bg-outline-variant rounded-full border-4 border-white z-10 shadow-sm"></div>
                    )}

                    <div
                      className={`flex flex-col gap-md p-md rounded-xl border transition-all ${
                        isCurrent
                          ? "bg-white border-2 border-primary shadow-md"
                          : "bg-surface-container-low border-outline-variant/30 " +
                            (isCompleted ? "opacity-90" : "opacity-60")
                      }`}
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-sm">
                        <div>
                          {isCurrent && (
                            <span className="font-label-sm text-primary uppercase tracking-widest mb-xs block font-bold">
                              Current Focus
                            </span>
                          )}
                          <h5
                            className={`font-title-md text-on-surface font-bold ${
                              isCompleted ? "line-through opacity-60 decoration-tertiary" : ""
                            }`}
                          >
                            {module.title}
                          </h5>
                          <p className="text-on-surface-variant font-body-md mt-xs">
                            {isCompleted
                              ? `Completed on ${module.completedDate}`
                              : isCurrent
                              ? `Active study module`
                              : `Upcoming Focus`}
                          </p>
                        </div>

                        {isCurrent && (
                          <button
                            onClick={() => handleUpdateModuleStatus(module._id, "completed")}
                            className="bg-primary text-on-primary px-md py-sm rounded-lg font-label-md hover:bg-primary/95 transition-colors shadow-sm font-semibold active:scale-95 shrink-0"
                          >
                            Mark as Completed
                          </button>
                        )}

                        {isCompleted && (
                          <button
                            onClick={() => handleUpdateModuleStatus(module._id, "current")}
                            className="border border-outline-variant text-on-surface-variant px-md py-sm rounded-lg font-label-md hover:bg-surface-container-low transition-colors shadow-sm font-semibold active:scale-95 shrink-0"
                          >
                            Mark as Incomplete
                          </button>
                        )}

                        {!isCurrent && !isCompleted && (
                          <button
                            onClick={() => handleUpdateModuleStatus(module._id, "current")}
                            className="border border-primary text-primary px-md py-sm rounded-lg font-label-md hover:bg-primary-container/10 transition-colors shadow-sm font-semibold active:scale-95 shrink-0"
                          >
                            Start Studying
                          </button>
                        )}
                      </div>

                      {/* Resources and Video Links */}
                      {((module.resources && module.resources.length > 0) || (module.videoLinks && module.videoLinks.length > 0)) && (
                        <div className="pt-sm border-t border-outline-variant/40 mt-sm flex flex-col md:flex-row md:justify-between gap-md">
                          {/* Resources Section */}
                          {module.resources && module.resources.length > 0 && (
                            <div className="flex-grow">
                              <p className="font-label-sm text-outline uppercase tracking-wider font-bold mb-xs flex items-center gap-xs">
                                <span className="material-symbols-outlined text-[16px] text-primary">menu_book</span>
                                Learning Resources
                              </p>
                              <div className="flex flex-wrap gap-xs">
                                {module.resources.map((res, rIdx) => (
                                  <a
                                    key={rIdx}
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-sm py-1 bg-surface-container-low border border-outline-variant hover:border-primary text-primary rounded-lg text-[12px] font-semibold flex items-center gap-xs transition-all hover:-translate-y-0.5"
                                  >
                                    {res.name}
                                    <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Videos Section */}
                          {module.videoLinks && module.videoLinks.length > 0 && (
                            <div className="flex-grow">
                              <p className="font-label-sm text-outline uppercase tracking-wider font-bold mb-xs flex items-center gap-xs">
                                <span className="material-symbols-outlined text-[16px] text-error">play_circle</span>
                                Video Explanations
                              </p>
                              <div className="flex flex-wrap gap-xs">
                                {module.videoLinks.map((vid, vIdx) => (
                                  <a
                                    key={vIdx}
                                    href={vid.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-sm py-1 bg-error-container/10 border border-error/20 hover:border-error text-error rounded-lg text-[12px] font-semibold flex items-center gap-xs transition-all hover:-translate-y-0.5"
                                  >
                                    {vid.name}
                                    <span className="material-symbols-outlined text-[12px]">play_arrow</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* ── Right Column: Goals, Timer, Motivation ────────────────────── */}
      <aside className="lg:col-span-4 flex flex-col gap-lg">
        {/* Today's Goals checklist */}
        <section className="bg-white border border-outline-variant rounded-xl p-md shadow-sm">
          <div className="flex items-center justify-between mb-md">
            <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest font-bold">
              Today's Goals
            </h4>
            <span className="material-symbols-outlined text-primary text-[24px]">target</span>
          </div>

          <div className="space-y-sm max-h-64 overflow-y-auto pr-xs">
            {studyPlan?.dailyGoals?.map((goal) => (
              <div key={goal._id} className="flex gap-sm items-start hover:bg-surface-container-lowest p-xs rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={goal.completed}
                  onChange={() => handleToggleGoal(goal._id, goal.completed)}
                  className="w-5 h-5 mt-1 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                />
                <div className="flex-grow">
                  <p
                    className={`text-body-md font-medium text-on-surface ${
                      goal.completed ? "line-through text-on-surface-variant/60" : ""
                    }`}
                  >
                    {goal.task}
                  </p>
                  <div className="flex gap-2 mt-xs">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      goal.difficulty === "High"
                        ? "bg-error-container text-on-error-container"
                        : goal.difficulty === "Medium"
                        ? "bg-secondary-container/10 text-secondary"
                        : "bg-tertiary-container/10 text-tertiary"
                    }`}>
                      {goal.difficulty}
                    </span>
                    <span className="text-[10px] text-on-surface-variant/80 font-bold">{goal.estMinutes} mins</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Goal Input */}
          <form onSubmit={handleAddGoal} className="mt-md pt-md border-t border-outline-variant/60 space-y-sm">
            <input
              type="text"
              placeholder="Add another today's goal..."
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
            <div className="flex gap-sm justify-between items-center">
              <div className="flex items-center gap-xs">
                <span className="text-label-sm text-on-surface-variant font-medium">Difficulty:</span>
                <select
                  value={newGoalDifficulty}
                  onChange={(e) => setNewGoalDifficulty(e.target.value)}
                  className="bg-transparent border-none text-label-sm font-bold text-primary focus:ring-0 p-0 cursor-pointer"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-primary-container text-on-primary-container px-sm py-1.5 rounded-lg text-label-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                Add Goal
              </button>
            </div>
          </form>
        </section>

        {/* Study Focus Timer Widget */}
        <section className="bg-primary text-on-primary rounded-xl p-lg shadow-lg flex flex-col items-center timer-glow">
          <div className="mb-md text-center">
            <h4 className="font-label-sm uppercase tracking-widest opacity-80 mb-base font-bold">Focus Timer</h4>
            <div className="font-headline-xl text-headline-xl tabular-nums tracking-tighter font-bold">
              {formatTimer()}
            </div>
          </div>

          <div className="flex gap-md mb-lg">
            <button
              onClick={toggleTimer}
              className="w-12 h-12 rounded-full bg-white text-primary flex items-center justify-center hover:scale-105 transition-transform active:scale-95 shadow-lg"
            >
              <span className="material-symbols-outlined text-[24px]">
                {timerRunning ? "pause" : "play_arrow"}
              </span>
            </button>
            <button
              onClick={resetTimer}
              className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:opacity-90 transition-opacity border border-white/20 active:scale-95"
            >
              <span className="material-symbols-outlined text-[24px]">restart_alt</span>
            </button>
          </div>

          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-tertiary-fixed h-full transition-all duration-1000"
              style={{ width: `${(timeRemaining / 1500) * 100}%` }}
            ></div>
          </div>
          <p className="text-label-sm mt-sm opacity-70 font-medium">Focus Session: Performance Lab</p>
        </section>

        {/* Motivational Quote Card */}
        <section className="bg-white border border-outline-variant rounded-xl p-md relative overflow-hidden shadow-sm">
          <span className="material-symbols-outlined absolute -right-4 -top-4 text-[80px] opacity-5 rotate-12">
            format_quote
          </span>
          <div className="relative z-10">
            <p className="font-body-md text-on-surface italic mb-sm">
              "{currentQuote.text}"
            </p>
            <p className="font-label-md text-primary font-bold">— {currentQuote.author}</p>
          </div>
          <div className="mt-md flex justify-end border-t border-outline-variant/30 pt-md">
            <button
              onClick={changeQuote}
              className="flex items-center gap-xs text-label-sm text-on-surface-variant hover:text-primary transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Get New Daily Quote
            </button>
          </div>
        </section>

        {/* Small Quick Stats */}
        <div className="grid grid-cols-2 gap-md">
          <div className="bg-white border border-outline-variant rounded-xl p-sm text-center shadow-sm">
            <span className="text-label-sm text-on-surface-variant block mb-base font-semibold">Streak</span>
            <span className="font-title-md text-on-surface font-bold">🔥 {studyPlan?.streak || 0} Days</span>
          </div>
          <div className="bg-white border border-outline-variant rounded-xl p-sm text-center shadow-sm">
            <span className="text-label-sm text-on-surface-variant block mb-base font-semibold">Focus Score</span>
            <span className="font-title-md text-on-surface font-bold">🎯 92%</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default StudyPlanPage;
