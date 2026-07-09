// ============================================================
// pages/DashboardPage.jsx
// Main study dashboard displaying metrics, roadmap timeline,
// focus areas, and recent quiz results
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [studyPlan, setStudyPlan] = useState(null);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");

  useEffect(() => {
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

    fetchDashboardData();
  }, []);

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

  // Calculate Roadmap Progress percentages for Learning cards
  const getModuleProgress = (titleKeyword, fallback) => {
    const mod = studyPlan?.timeline?.find(t => t.title.toLowerCase().includes(titleKeyword.toLowerCase()));
    return mod ? mod.progressPercent : fallback;
  };

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
            <span className="font-headline-lg text-headline-lg font-bold">{topicsMastered || 2}</span>
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
            <span className="font-headline-lg text-headline-lg font-bold">{passedQuizzesCount || 2}</span>
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

              <div className="space-y-sm">
                {studyPlan?.timeline?.map((module, index) => {
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
            </div>
          </div>
        </div>

        {/* AI Tutor Card */}
        <div className="lg:col-span-4">
          <div className="bg-primary-container text-on-primary-container p-md rounded-xl shadow-lg h-full relative overflow-hidden flex flex-col justify-between">
            {/* Background decoration */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

            <div>
              <div className="flex items-center gap-sm mb-md">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                  <span className="material-symbols-outlined text-[32px]">smart_toy</span>
                </div>
                <div>
                  <h3 className="font-title-md text-title-md leading-none mb-1 font-bold text-white">AI Tutor</h3>
                  <span className="text-label-sm opacity-80 flex items-center gap-1">
                    <span className="w-2 h-2 bg-tertiary-fixed rounded-full animate-pulse"></span>
                    Online & Ready
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-center items-center text-center p-md">
                <div className="w-32 h-32 mb-md bg-white/10 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-[72px] text-white/80 animate-bounce">psychology</span>
                </div>
                <p className="font-body-md text-body-md mb-lg text-on-primary-container/95">
                  Stuck on a problem? Ask me to explain concepts, summarize notes, or quiz you!
                </p>
              </div>
            </div>

            <form onSubmit={handleAiTutorRedirect} className="relative mt-md">
              <input
                className="w-full bg-white/20 border-none rounded-xl py-3 pl-4 pr-12 text-white placeholder:text-white/60 focus:ring-2 focus:ring-white/40 outline-none transition-all"
                placeholder="Ask anything about your subject..."
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white text-primary flex items-center justify-center hover:bg-secondary-fixed transition-colors active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
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
                      // Render Default Mock Items if database has no attempts yet
                      <>
                        <tr className="hover:bg-surface-container-low transition-colors">
                          <td className="px-md py-4 font-label-md text-on-surface font-semibold">ES6 Features</td>
                          <td className="px-md py-4 text-label-sm text-on-surface-variant">Oct 18, 2023</td>
                          <td className="px-md py-4 font-bold text-primary">88%</td>
                          <td className="px-md py-4">
                            <span className="px-2 py-1 bg-tertiary-container text-white text-[10px] rounded-full uppercase font-bold">Passed</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-surface-container-low transition-colors">
                          <td className="px-md py-4 font-label-md text-on-surface font-semibold">Tailwind Config</td>
                          <td className="px-md py-4 text-label-sm text-on-surface-variant">Oct 17, 2023</td>
                          <td className="px-md py-4 font-bold text-primary">92%</td>
                          <td className="px-md py-4">
                            <span className="px-2 py-1 bg-tertiary-container text-white text-[10px] rounded-full uppercase font-bold">Passed</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-surface-container-low transition-colors">
                          <td className="px-md py-4 font-label-md text-on-surface font-semibold">Async JavaScript</td>
                          <td className="px-md py-4 text-label-sm text-on-surface-variant">Oct 15, 2023</td>
                          <td className="px-md py-4 font-bold text-error">42%</td>
                          <td className="px-md py-4">
                            <span className="px-2 py-1 bg-error-container text-on-error-container text-[10px] rounded-full uppercase font-bold">Retake</span>
                          </td>
                        </tr>
                      </>
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
          {[
            { subject: "Web Foundations", progress: getModuleProgress("Foundations", 0), icon: "data_object", bg: "bg-blue-100", text: "text-blue-600", bar: "bg-secondary-container" },
            { subject: "React", progress: getModuleProgress("React", 0), icon: "terminal", bg: "bg-green-100", text: "text-green-600", bar: "bg-primary-container" },
            { subject: "Node.js", progress: getModuleProgress("Node", 0), icon: "database", bg: "bg-emerald-100", text: "text-emerald-600", bar: "bg-tertiary" },
            { subject: "Cloud Deploy", progress: getModuleProgress("Cloud", 0), icon: "cloud", bg: "bg-purple-100", text: "text-purple-600", bar: "bg-primary" },
          ].map((item) => (
            <div
              key={item.subject}
              onClick={() => navigate("/study-plan")}
              className="bg-white border border-outline-variant p-md rounded-xl hover:-translate-y-1 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className={`w-12 h-12 rounded-lg ${item.bg} flex items-center justify-center ${item.text} mb-sm`}>
                  <span className="material-symbols-outlined text-[28px]">{item.icon}</span>
                </div>
                <h4 className="font-label-md text-label-md font-bold text-on-surface mb-xs">{item.subject}</h4>
                <p className="text-label-sm text-on-surface-variant mb-md">{item.progress}% Progress</p>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div className={`${item.bar} h-full rounded-full`} style={{ width: `${item.progress}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Action Button (FAB) for starting new session */}
      <button
        onClick={() => navigate("/ai-tutor", { state: { initialPrompt: "I want to start a new focused study session!" } })}
        className="fixed right-6 bottom-20 md:bottom-10 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
      >
        <span className="material-symbols-outlined text-[32px]">add</span>
        <span className="absolute right-16 bg-on-surface text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
          New Study Session
        </span>
      </button>
    </div>
  );
};

export default DashboardPage;
