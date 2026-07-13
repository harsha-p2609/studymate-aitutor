// ============================================================
// pages/DashboardPage.jsx
// Main study dashboard displaying metrics, roadmap timeline,
// focus areas, and recent quiz results
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const getModuleStyle = (title, index) => {
  const titleLower = title ? title.toLowerCase() : "";
  const styles = [
    { icon: "data_object", bg: "bg-blue-100", text: "text-blue-600", bar: "bg-secondary-container" },
    { icon: "terminal", bg: "bg-green-100", text: "text-green-600", bar: "bg-primary-container" },
    { icon: "database", bg: "bg-emerald-100", text: "text-emerald-600", bar: "bg-tertiary" },
    { icon: "cloud", bg: "bg-purple-100", text: "text-purple-600", bar: "bg-primary" },
    { icon: "menu_book", bg: "bg-orange-100", text: "text-orange-600", bar: "bg-warning" },
  ];
  
  if (titleLower.includes("foundation") || titleLower.includes("basic") || titleLower.includes("intro")) return styles[0];
  if (titleLower.includes("react") || titleLower.includes("javascript") || titleLower.includes("js") || titleLower.includes("frontend")) return styles[1];
  if (titleLower.includes("database") || titleLower.includes("dbms") || titleLower.includes("sql") || titleLower.includes("mongo")) return styles[2];
  if (titleLower.includes("cloud") || titleLower.includes("deploy") || titleLower.includes("docker") || titleLower.includes("aws")) return styles[3];
  
  return styles[index % styles.length];
};

const EXPLAIN_POOL = [
  { prefix: "Explain concept", suffix: "of wave-particle duality", full: "Explain the concept of wave-particle duality." },
  { prefix: "Explain concept", suffix: "of recursion in coding", full: "Explain recursion in coding simply." },
  { prefix: "Explain concept", suffix: "of photosynthesis", full: "Explain photosynthesis step-by-step." },
  { prefix: "Explain concept", suffix: "of RESTful APIs", full: "Explain how RESTful APIs work." },
  { prefix: "Explain concept", suffix: "of quantum entanglement", full: "Explain quantum entanglement in simple terms." },
  { prefix: "Explain concept", suffix: "of OOP principles", full: "Explain Object-Oriented Programming principles." },
  { prefix: "Explain concept", suffix: "of database indexing", full: "Explain how database indexing works." }
];

const QUIZ_POOL = [
  { prefix: "Generate a quiz", suffix: "on data structures", full: "Generate a practice quiz on data structures." },
  { prefix: "Generate a quiz", suffix: "on React Hooks", full: "Generate a quiz on React Hooks." },
  { prefix: "Generate a quiz", suffix: "on operating systems", full: "Generate a practice quiz on operating systems." },
  { prefix: "Generate a quiz", suffix: "on SQL databases", full: "Generate a quiz on SQL databases." },
  { prefix: "Generate a quiz", suffix: "on machine learning", full: "Generate a quiz on basic machine learning concepts." },
  { prefix: "Generate a quiz", suffix: "on CSS Flexbox", full: "Generate a quiz on CSS Flexbox and Grid." }
];

const FLASHCARD_POOL = [
  { prefix: "Create flashcards", suffix: "for JavaScript variables", full: "Create flashcards for JavaScript variables." },
  { prefix: "Create flashcards", suffix: "for anatomy terms", full: "Create flashcards for human anatomy terminology." },
  { prefix: "Create flashcards", suffix: "for machine learning", full: "Create study flashcards for machine learning algorithms." },
  { prefix: "Create flashcards", suffix: "for networking protocols", full: "Create flashcards for computer networking protocols." },
  { prefix: "Create flashcards", suffix: "for SQL commands", full: "Create flashcards for basic SQL commands." },
  { prefix: "Create flashcards", suffix: "for git commands", full: "Create flashcards for common Git commands." }
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const [studyPlan, setStudyPlan] = useState(null);
  const [otherPlans, setOtherPlans] = useState([]);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");
  
  const [chatSuggestions, setChatSuggestions] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const getNewSuggestions = () => {
      const randomExplain = EXPLAIN_POOL[Math.floor(Math.random() * EXPLAIN_POOL.length)];
      const randomQuiz = QUIZ_POOL[Math.floor(Math.random() * QUIZ_POOL.length)];
      const randomFlashcard = FLASHCARD_POOL[Math.floor(Math.random() * FLASHCARD_POOL.length)];
      return [randomExplain, randomQuiz, randomFlashcard].sort(() => Math.random() - 0.5);
    };

    setChatSuggestions(getNewSuggestions());

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setChatSuggestions(getNewSuggestions());
        setIsTransitioning(false);
      }, 400);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Modal states for Dynamic Roadmap Generation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const steps = [
    "Contacting StudyMate AI...",
    "Analyzing core concepts...",
    "Drafting educational roadmap...",
    "Creating key timeline modules...",
    "Seeding study plan database...",
  ];

  // Rotate loading steps every 1.5 seconds for active feedback
  useEffect(() => {
    let interval;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % steps.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch study plan and recent attempts in parallel
      const [planRes, attemptsRes] = await Promise.all([
        api.get("/study-plan"),
        api.get("/quizzes/attempts/recent"),
      ]);

      if (planRes.data.success) {
        setStudyPlan(planRes.data.data);
        setOtherPlans(planRes.data.otherPlans || []);
      }
      if (attemptsRes.data.success) {
        setRecentAttempts(attemptsRes.data.data);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      toast.error("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleGenerateRoadmap = async (e) => {
    e.preventDefault();
    if (!topic || topic.trim() === "") {
      toast.error("Please enter a subject topic.");
      return;
    }

    try {
      setIsGenerating(true);
      setLoadingStep(0);
      const res = await api.post("/study-plan/regenerate", { topic });
      if (res.data.success) {
        toast.success("New study roadmap generated successfully! 🚀");
        setIsModalOpen(false);
        setTopic("");
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Error generating roadmap:", err);
      toast.error("Failed to generate study roadmap. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleActivatePlan = async (planId) => {
    try {
      setLoading(true);
      const res = await api.put("/study-plan/activate", { planId });
      if (res.data.success) {
        toast.success("Roadmap activated! 🚀");
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Error activating roadmap:", err);
      toast.error("Failed to switch roadmap.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (e, planId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this study plan/roadmap?")) {
      return;
    }

    try {
      setLoading(true);
      const res = await api.delete(`/study-plan/${planId}`);
      if (res.data.success) {
        toast.success("Roadmap deleted successfully!");
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Error deleting roadmap:", err);
      toast.error("Failed to delete roadmap.");
    } finally {
      setLoading(false);
    }
  };

  const handleAiTutorRedirect = (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    // Pass the initial prompt to the AI Tutor page via state
    navigate("/ai-tutor", { state: { initialPrompt: aiPrompt } });
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center p-xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate some numbers dynamically
  const progressPercent = studyPlan?.overallProgress || 0;
  const streak = studyPlan?.streak || 0;
  const passedQuizzesCount = recentAttempts.filter(a => a.status === "Passed").length;
  const topicsMastered = studyPlan?.timeline?.filter(t => t.status === "completed").length || 0;

  // Calculate Focus Area Scores from Quiz Attempts Dynamically
  const subjectScores = {};
  const subjectCounts = {};
  recentAttempts.forEach((attempt) => {
    const subject = attempt.quizId?.subject || "General";
    const score = attempt.score || 0;
    if (!subjectScores[subject]) {
      subjectScores[subject] = 0;
      subjectCounts[subject] = 0;
    }
    subjectScores[subject] += score;
    subjectCounts[subject] += 1;
  });

  const focusAreasList = [
    { name: "Computer Science", fallback: 0, defaultColor: "bg-primary", defaultText: "text-primary" },
    { name: "JavaScript", fallback: 0, defaultColor: "bg-secondary-container", defaultText: "text-secondary" },
    { name: "CSS", fallback: 0, defaultColor: "bg-error", defaultText: "text-error" },
    { name: "Node.js", fallback: 0, defaultColor: "bg-tertiary", defaultText: "text-tertiary" },
  ].map((area) => {
    const hasAttempt = subjectCounts[area.name] > 0;
    const avgScore = hasAttempt ? Math.round(subjectScores[area.name] / subjectCounts[area.name]) : area.fallback;
    return {
      name: area.name,
      score: avgScore,
      color: !hasAttempt ? "bg-outline-variant" : avgScore >= 70 ? "bg-tertiary" : avgScore >= 50 ? "bg-secondary-container" : "bg-error",
      textClass: !hasAttempt ? "text-outline" : avgScore >= 70 ? "text-tertiary" : avgScore >= 50 ? "text-secondary" : "text-error",
    };
  });

  return (
    <div className="px-gutter py-md pb-32 flex-grow">
      {/* ── Section 1: Analytics Cards ────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
        {/* Streak */}
        <div className="bg-white/80 backdrop-blur-sm border border-outline-variant p-sm px-md rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-error">
          <div className="flex items-center justify-between mb-xs">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Study Streak</span>
            <span className="material-symbols-outlined text-error text-[24px]">local_fire_department</span>
          </div>
          <div className="flex items-baseline gap-xs">
            <span className="font-headline-lg text-headline-lg font-bold">{streak}</span>
            <span className="font-body-md text-body-md text-on-surface-variant">Days</span>
          </div>
        </div>

        {/* Mastered */}
        <div className="bg-white/80 backdrop-blur-sm border border-outline-variant p-sm px-md rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-primary">
          <div className="flex items-center justify-between mb-xs">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Topics Mastered</span>
            <span className="material-symbols-outlined text-primary text-[24px]">school</span>
          </div>
          <div className="flex items-baseline gap-xs">
            <span className="font-headline-lg text-headline-lg font-bold">{topicsMastered}</span>
            <span className="font-body-md text-body-md text-on-surface-variant">Modules</span>
          </div>
        </div>

        {/* Quizzes */}
        <div className="bg-white/80 backdrop-blur-sm border border-outline-variant p-sm px-md rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-secondary">
          <div className="flex items-center justify-between mb-xs">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Quizzes Passed</span>
            <span className="material-symbols-outlined text-secondary text-[24px]">assignment</span>
          </div>
          <div className="flex items-baseline gap-xs">
            <span className="font-headline-lg text-headline-lg font-bold">{passedQuizzesCount}</span>
            <span className="font-body-md text-body-md text-on-surface-variant">Tests</span>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white/80 backdrop-blur-sm border border-outline-variant p-sm px-md rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-tertiary">
          <div className="flex items-center justify-between mb-xs">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Overall Progress</span>
            <span className="material-symbols-outlined text-tertiary text-[24px]">auto_graph</span>
          </div>
          <div className="flex items-baseline gap-xs">
            <span className="font-headline-lg text-headline-lg font-bold">{progressPercent}%</span>
            <span className="font-body-md text-body-md text-on-surface-variant">Complete</span>
          </div>
        </div>
      </section>

      {/* ── Section 2: Main Content Grid (Study Plan & AI Tutor) ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg mb-lg">
        {/* Study Plan Roadmap Bento */}
        <div className="lg:col-span-8 flex flex-col gap-md">
          <div className="bg-white/80 backdrop-blur-sm border border-outline-variant p-md rounded-xl shadow-sm h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-lg">
                <h3 className="font-title-md text-title-md font-bold text-on-surface">Personalized Study Plan</h3>
                <Link to="/study-plan" className="text-primary font-label-md text-label-md hover:underline font-semibold">
                  View Full Roadmap
                </Link>
              </div>

              {studyPlan && studyPlan.timeline && studyPlan.timeline.length > 0 ? (
                <div className="space-y-sm">
                  {studyPlan.timeline.map((module, index) => {
                    const isCompleted = module.status === "completed";
                    const isCurrent = module.status === "current";

                    return (
                      <div
                        key={module.title || index}
                        className="relative pl-8 before:content-[''] before:absolute before:left-[11px] before:top-[24px] before:bottom-[-16px] before:width-[2px] before:bg-outline-variant last:before:hidden"
                      >
                        {/* Checkpoint Icon */}
                        {isCompleted ? (
                          <span className="absolute left-0 top-0 w-6 h-6 rounded-full bg-tertiary text-white flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                          </span>
                        ) : isCurrent ? (
                          <span className="absolute left-0 top-0 w-6 h-6 rounded-full bg-primary-container text-white flex items-center justify-center shadow-md animate-pulse">
                            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                          </span>
                        ) : (
                          <span className="absolute left-0 top-0 w-6 h-6 rounded-full bg-surface-container-high border-2 border-outline-variant flex items-center justify-center text-outline"></span>
                        )}

                        <div
                          className={`flex justify-between items-center p-xs rounded-lg transition-all ${
                            isCurrent
                              ? "bg-primary-container/5 border border-primary/20 p-sm"
                              : "border border-transparent"
                          }`}
                        >
                          <div>
                            <p
                              className={`font-label-md text-label-md font-bold ${
                                isCurrent ? "text-primary" : "text-on-surface"
                              } ${isCompleted ? "opacity-60 line-through" : ""}`}
                            >
                              {module.title}
                            </p>
                            <p className="text-on-surface-variant text-label-sm">
                              {isCompleted
                                ? `Completed on ${module.completedDate}`
                                : isCurrent
                                ? `Current Focus • ${module.progressPercent}% progress`
                                : "Upcoming Focus"}
                            </p>
                          </div>

                          {isCompleted && (
                            <span className="px-2 py-1 bg-tertiary-container text-white text-[10px] rounded uppercase font-bold tracking-wider">
                              Mastered
                            </span>
                          )}

                          {isCurrent && (
                            <button
                              onClick={() => navigate("/study-plan")}
                              className="bg-primary text-white text-[12px] px-sm py-1 rounded-full font-bold hover:bg-primary/90 transition-all shadow-sm active:scale-95"
                            >
                              Continue
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-lg text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant py-xl">
                  <span className="material-symbols-outlined text-[48px] text-outline mb-sm">route</span>
                  <h4 className="font-title-sm text-title-sm font-bold text-on-surface mb-xs">No Study Roadmap Found</h4>
                  <p className="text-on-surface-variant font-body-md mb-md max-w-sm">
                    Generate a personalized study roadmap to organize your learning path, track progress, and get daily study goals.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-md py-2.5 bg-primary text-white font-label-md rounded-xl font-bold hover:bg-primary/95 transition-all shadow-sm active:scale-95 flex items-center gap-xs"
                  >
                    Create a Roadmap
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Tutor Card (Mascot Chat Style) */}
        <div className="lg:col-span-4 relative mt-12 lg:mt-0 pt-10 lg:pt-0">
          {/* Floating 3D Mascot */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 z-20 pointer-events-none drop-shadow-lg">
            <img
              src="/study_robot_mascot.png"
              alt="AI Study Mascot"
              className="w-full h-full object-contain animate-float"
            />
          </div>

          <div
            className="border border-outline-variant p-md rounded-[28px] shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[320px] max-h-[340px]"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #FFF5F7 50%, #F5ECFF 100%)",
            }}
          >
            {/* Top Control Icons */}
            <div className="flex justify-between items-center z-10">
              <button
                onClick={() => navigate("/ai-tutor")}
                className="w-8 h-8 rounded-full bg-surface-container/60 hover:bg-surface-container text-on-surface flex items-center justify-center transition-all active:scale-90"
                title="Open AI Tutor"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_full</span>
              </button>
              <button
                onClick={() => setAiPrompt("")}
                className="w-8 h-8 rounded-full bg-surface-container/60 hover:bg-surface-container text-on-surface flex items-center justify-center transition-all active:scale-90"
                title="Clear input"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Recommendation Bubbles */}
            <div className="flex flex-col gap-xs my-auto pt-6 pb-2 z-10 w-full">
              {chatSuggestions.map((suggestion, idx) => {
                const isLeft = idx === 1; // Left align the second bubble, right align others
                return (
                  <div
                    key={idx}
                    onClick={() => setAiPrompt(suggestion.full)}
                    className={`suggestion-bubble bg-white px-[12px] py-[6px] rounded-2xl ${
                      isLeft ? "rounded-tl-none self-start" : "rounded-tr-none self-end"
                    } ${
                      isTransitioning ? "transitioning" : ""
                    } shadow-sm hover:shadow-md hover:border-primary/30 border border-outline-variant/30 max-w-[85%] cursor-pointer active:scale-95`}
                  >
                    <p className="text-label-sm text-on-surface-variant leading-snug">
                      <span className="text-primary font-bold">{suggestion.prefix}</span> {suggestion.suffix}...
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Bottom search form */}
            <form onSubmit={handleAiTutorRedirect} className="relative z-10 mt-auto">
              <input
                className="w-full bg-white border-2 border-primary/40 rounded-2xl py-3 pl-4 pr-12 text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner font-label-md text-label-md"
                placeholder="How can I help you..."
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Section 3: Weak Areas & Recent Quiz Results ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg mb-lg">
        {/* Focus Areas (Weak areas) */}
        <div className="lg:col-span-5">
          <div className="bg-white/80 backdrop-blur-sm border border-outline-variant p-md rounded-xl shadow-sm h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-lg">
                <h3 className="font-title-md text-title-md font-bold text-on-surface">Focus Areas</h3>
                <span className="material-symbols-outlined text-error">warning</span>
              </div>

              <div className="space-y-md">
                {focusAreasList.map((area) => (
                  <div key={area.name}>
                    <div className="flex justify-between mb-1">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">{area.name}</span>
                      <span className={`font-label-md text-label-md font-bold ${area.textClass}`}>{area.score}%</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                      <div className={`${area.color} h-full rounded-full`} style={{ width: `${area.score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate("/ai-tutor", { state: { initialPrompt: "Analyze my weak areas (DBMS and JavaScript) and help me improve." } })}
              className="w-full mt-lg py-3 rounded-xl border border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
            >
              <span className="material-symbols-outlined">bolt</span>
              Improve with AI
            </button>
          </div>
        </div>

        {/* Recent Quiz Results */}
        <div className="lg:col-span-7">
          <div className="bg-white/80 backdrop-blur-sm border border-outline-variant rounded-xl shadow-sm h-full overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-md flex items-center justify-between border-b border-outline-variant">
                <h3 className="font-title-md text-title-md font-bold text-on-surface">Recent Quiz Results</h3>
                <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">filter_list</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="px-md py-3 font-label-md text-label-md text-on-surface-variant font-semibold">Subject / Quiz</th>
                      <th className="px-md py-3 font-label-md text-label-md text-on-surface-variant font-semibold">Date</th>
                      <th className="px-md py-3 font-label-md text-label-md text-on-surface-variant font-semibold">Score</th>
                      <th className="px-md py-3 font-label-md text-label-md text-on-surface-variant font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {recentAttempts.length > 0 ? (
                      recentAttempts.map((attempt) => (
                        <tr key={attempt._id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-md py-4 font-label-md text-on-surface font-semibold">
                            {attempt.quizId?.title || "Quiz"}
                          </td>
                          <td className="px-md py-4 text-label-sm text-on-surface-variant">
                            {new Date(attempt.attemptDate).toLocaleDateString()}
                          </td>
                          <td className={`px-md py-4 font-bold ${attempt.status === "Passed" ? "text-primary" : "text-error"}`}>
                            {attempt.score}%
                          </td>
                          <td className="px-md py-4">
                            <span
                              className={`px-2 py-1 text-[10px] rounded-full uppercase font-bold tracking-wide ${
                                attempt.status === "Passed"
                                  ? "bg-tertiary-container text-white"
                                  : "bg-error-container text-on-error-container"
                              }`}
                            >
                              {attempt.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-md py-8 text-center text-on-surface-variant font-body-md">
                          No quiz attempts found. Take a quiz to see your results here!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-md text-center border-t border-outline-variant">
              <Link to="/quizzes" className="text-primary font-bold hover:underline">
                Take a New Quiz
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 4: Continue Learning Slider ────────────────────────── */}
      <section className="bg-white/40 p-md rounded-2xl border border-outline-variant/50">
        <div className="flex items-center justify-between mb-md">
          <h3 className="font-title-md text-title-md font-bold text-on-surface">Continue Learning</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-md pb-2">
          {otherPlans && otherPlans.length > 0 ? (
            otherPlans.map((item, index) => {
              const style = getModuleStyle(item.roadmapTitle, index);
              return (
                <div
                  key={item._id || index}
                  onClick={() => handleActivatePlan(item._id)}
                  className="bg-white border border-outline-variant p-md rounded-xl hover:-translate-y-1 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between group relative"
                >
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeletePlan(e, item._id)}
                    className="absolute top-3 right-3 text-outline hover:text-error p-1 rounded-lg hover:bg-error/5 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                    title="Delete Roadmap"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>

                  <div>
                    <div className={`w-12 h-12 rounded-lg ${style.bg} flex items-center justify-center ${style.text} mb-sm`}>
                      <span className="material-symbols-outlined text-[28px]">{style.icon}</span>
                    </div>
                    <h4 className="font-label-md text-label-md font-bold text-on-surface mb-xs line-clamp-1">{item.roadmapTitle}</h4>
                    <p className="text-label-sm text-on-surface-variant mb-md">{item.overallProgress}% Progress</p>
                  </div>
                  <div className="flex flex-col gap-sm">
                    <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                      <div className={`${style.bar} h-full rounded-full`} style={{ width: `${item.overallProgress}%` }}></div>
                    </div>
                    <div className="text-primary font-bold text-[12px] opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-xs">
                      <span>Resume roadmap</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-lg text-center bg-white/50 border border-dashed border-outline-variant rounded-xl">
              <span className="material-symbols-outlined text-[36px] text-outline mb-sm">route</span>
              <p className="text-on-surface-variant font-label-md">No older roadmaps found. Create another subject roadmap to see it here!</p>
            </div>
          )}
        </div>
      </section>

      {/* Floating Action Button (FAB) for starting new session */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed right-6 bottom-20 md:bottom-10 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
      >
        <span className="material-symbols-outlined text-[32px]">add</span>
        <span className="absolute right-16 bg-on-surface text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
          New Study Session
        </span>
      </button>

      {/* Generate New Roadmap Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-on-background/40 backdrop-blur-sm transition-all">
          <div className="bg-white border border-outline-variant rounded-2xl w-full max-w-md p-lg shadow-xl relative animate-in fade-in zoom-in duration-150">
            {/* Close Button */}
            <button
              onClick={() => !isGenerating && setIsModalOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-lg hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer"
              disabled={isGenerating}
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {!isGenerating ? (
              <form onSubmit={handleGenerateRoadmap}>
                <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mx-auto mb-md">
                  <span className="material-symbols-outlined text-[28px]">route</span>
                </div>
                <h3 className="font-title-md text-title-md font-bold text-on-surface mb-xs text-center">
                  Generate New Study Roadmap
                </h3>
                <p className="text-on-surface-variant font-body-md mb-md text-center">
                  Enter a subject or skill you want to master. StudyMate AI will generate a customized roadmap and goals for you in real-time.
                </p>

                <div className="mb-lg text-left">
                  <label htmlFor="roadmap-topic-input" className="block text-label-sm font-label-sm text-on-surface mb-2 font-bold uppercase tracking-wider">
                    Subject / Topic
                  </label>
                  <input
                    id="roadmap-topic-input"
                    type="text"
                    required
                    className="w-full px-md py-3 border border-outline-variant rounded-xl bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-body-md text-on-surface"
                    placeholder="e.g. Machine Learning, DBMS, Operating Systems"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div className="flex gap-sm">
                  <button
                    type="submit"
                    className="w-full py-sm bg-primary text-on-primary font-label-md text-label-md rounded-xl hover:opacity-90 font-bold active:scale-95 transition-all flex items-center justify-center gap-xs cursor-pointer"
                  >
                    Generate Roadmap
                    <span className="material-symbols-outlined text-[18px]">psychology</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-sm border border-outline-variant text-on-surface-variant font-label-md text-label-md rounded-xl hover:bg-surface-container-low font-bold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-xl flex flex-col items-center text-center">
                <div className="w-16 h-16 relative mb-lg">
                  {/* Glowing AI Spinner */}
                  <div className="absolute inset-0 rounded-full border-4 border-primary-container/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
                  <span className="material-symbols-outlined text-[32px] text-primary absolute left-1/2 top-1/2 -translate-y-1/2 -translate-y-1/2 animate-pulse">
                    psychology
                  </span>
                </div>
                <h4 className="font-title-md text-title-md font-bold text-on-surface mb-xs">
                  Generating Study Plan
                </h4>
                <p className="text-primary font-label-md font-semibold animate-pulse">
                  {steps[loadingStep]}
                </p>
                <p className="text-on-surface-variant font-body-md mt-sm max-w-[280px]">
                  Analyzing topic parameters to build learning modules and daily targets...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
