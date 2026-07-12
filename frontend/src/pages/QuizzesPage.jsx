// ============================================================
// pages/QuizzesPage.jsx
// View displaying all available quizzes retrieved from backend
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const QuizzesPage = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states for Dynamic Quiz Generation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const [confirmClearQuizHistory, setConfirmClearQuizHistory] = useState(false);
  const [deletingQuizId, setDeletingQuizId] = useState(null);

  const steps = [
    "Contacting StudyMate AI...",
    "Generating customized quiz questions...",
    "Formulating multiple-choice options...",
    "Adding detailed explanations...",
    "Seeding quiz database...",
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [quizzesRes, attemptsRes] = await Promise.all([
          api.get("/quizzes"),
          api.get("/quizzes/attempts/recent")
        ]);

        if (quizzesRes.data.success) {
          setQuizzes(quizzesRes.data.data);
        }
        if (attemptsRes.data.success) {
          setAttempts(attemptsRes.data.data);
        }
      } catch (err) {
        console.error("Error loading assessment data:", err);
        toast.error("Failed to load assessments or history");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleClearHistory = async () => {
    try {
      const res = await api.delete("/quizzes/attempts/clear");
      if (res.data.success) {
        setAttempts([]);
        setConfirmClearQuizHistory(false);
        toast.success("Score history cleared successfully!");
      }
    } catch (err) {
      console.error("Error clearing quiz history:", err);
      toast.error("Failed to clear score history");
    }
  };

  const confirmDeleteQuiz = async (quizId) => {
    try {
      const res = await api.delete(`/quizzes/${quizId}`);
      if (res.data.success) {
        toast.success("Quiz deleted successfully");
        setQuizzes((prev) => prev.filter((q) => q._id !== quizId));
        setDeletingQuizId(null);
      }
    } catch (err) {
      console.error("Error deleting quiz:", err);
      toast.error("Failed to delete quiz");
    }
  };

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    if (!topic || topic.trim() === "") {
      toast.error("Please enter a quiz topic.");
      return;
    }

    try {
      setIsGenerating(true);
      setLoadingStep(0);
      const res = await api.post("/quizzes/generate", { topic });
      if (res.data.success) {
        toast.success("New quiz generated successfully! 🚀");
        const newQuiz = res.data.data;
        setQuizzes((prev) => [newQuiz, ...prev]);
        setIsModalOpen(false);
        setTopic("");
        // Navigate to start the quiz immediately
        navigate(`/quiz/${newQuiz._id}`);
      }
    } catch (err) {
      console.error("Error generating quiz:", err);
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center p-xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-gutter py-md pb-32 flex-grow max-w-container-max mx-auto w-full">
      <div className="mb-lg">
        <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold">Personalized Assessments</h1>
        <p className="text-on-surface-variant font-body-md mt-xs">Generate custom quizzes on any topic to test your knowledge.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
        {/* Generate New Quiz Card */}
        <div className="bg-white border-2 border-dashed border-outline-variant rounded-xl p-md shadow-sm hover:shadow-md transition-all flex flex-col justify-center items-center text-center py-lg min-h-[220px]">
          <span className="material-symbols-outlined text-[48px] text-outline mb-sm">library_add</span>
          <h3 className="font-title-md text-title-md font-bold text-on-surface mb-xs">Add a New Quiz</h3>
          <p className="text-on-surface-variant text-label-sm mb-md max-w-[200px]">Generate a custom AI quiz on any topic in seconds.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-md py-2.5 bg-primary text-white font-label-md rounded-xl font-bold hover:bg-primary/95 transition-all shadow-sm active:scale-95 flex items-center gap-xs"
          >
            Create Quiz
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
        </div>

        {quizzes.map((quiz) => (
          <div
            key={quiz._id}
            className="bg-white border border-outline-variant rounded-xl p-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-sm">
                <span className="px-sm py-base bg-secondary-container/10 text-secondary rounded-full text-label-sm font-label-sm uppercase font-bold tracking-wider">
                  {quiz.subject}
                </span>
                {deletingQuizId === quiz._id ? (
                  <div className="flex items-center gap-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDeleteQuiz(quiz._id);
                      }}
                      className="text-tertiary hover:bg-tertiary/10 p-1 rounded transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                      title="Confirm Delete"
                    >
                      <span className="material-symbols-outlined text-[18px] font-bold">check</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingQuizId(null);
                      }}
                      className="text-error hover:bg-error/10 p-1 rounded transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                      title="Cancel"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-xs">
                    <span className="text-label-sm text-on-surface-variant font-semibold">
                      {quiz.questions.length} Questions
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingQuizId(quiz._id);
                      }}
                      className="text-outline/60 hover:text-error p-1 rounded transition-all active:scale-95 flex items-center justify-center cursor-pointer ml-1"
                      title="Delete Quiz"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                )}
              </div>
              <h3 className="font-title-md text-title-md font-bold text-on-surface mb-xs">
                {quiz.title}
              </h3>
              <p className="text-on-surface-variant font-body-md line-clamp-2">
                {quiz.chapter}
              </p>
            </div>

            <button
              onClick={() => navigate(`/quiz/${quiz._id}`)}
              className="w-full mt-lg py-3 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-xs shadow-sm"
            >
              Start Assessment
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        ))}
      </div>

      {/* Recent Assessment Attempts */}
      <div className="mt-xl">
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Your Score History</h2>
          {attempts.length > 0 && (
            confirmClearQuizHistory ? (
              <div className="flex items-center gap-xs">
                <button
                  onClick={handleClearHistory}
                  className="px-md py-1 bg-error text-white text-xs font-bold rounded-lg hover:bg-error/90 active:scale-95 transition-all"
                >
                  Confirm Clear
                </button>
                <button
                  onClick={() => setConfirmClearQuizHistory(false)}
                  className="px-md py-1 border border-outline-variant text-on-surface-variant text-xs font-bold rounded-lg hover:bg-surface-container-low active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClearQuizHistory(true)}
                className="px-sm py-xs border border-error/30 text-error hover:bg-error/5 active:scale-95 transition-all text-xs font-bold rounded-lg flex items-center gap-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                Clear History
              </button>
            )
          )}
        </div>
        
        {attempts.length === 0 ? (
          <div className="bg-white border border-outline-variant rounded-xl p-lg text-center">
            <span className="material-symbols-outlined text-[48px] text-outline mb-xs">assignment_late</span>
            <p className="text-on-surface-variant font-body-md">You haven't completed any assessments yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="divide-y divide-outline-variant/30">
              {attempts.map((attempt) => {
                const quizInfo = attempt.quizId || {};
                const isPassed = attempt.status === "Passed";
                const attemptDate = attempt.attemptDate 
                  ? new Date(attempt.attemptDate).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) 
                  : "Date unknown";

                return (
                  <div key={attempt._id} className="p-md flex flex-col sm:flex-row sm:items-center justify-between gap-sm hover:bg-surface-container-low transition-colors">
                    <div>
                      <div className="flex items-center gap-xs mb-1">
                        <span className="px-xs py-0.5 bg-primary/10 text-primary rounded text-[10px] uppercase font-bold tracking-wider">
                          {quizInfo.subject || "Subject"}
                        </span>
                        <span className="text-[11px] text-outline">
                          {attemptDate}
                        </span>
                      </div>
                      <h4 className="font-title-md text-title-md font-bold text-on-surface">
                        {quizInfo.title || "Assessment"}
                      </h4>
                      <p className="text-label-sm text-on-surface-variant line-clamp-1">
                        {quizInfo.chapter || ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-md shrink-0">
                      <div className="text-right flex items-center gap-md">
                        <div>
                          <p className="font-headline-md text-headline-md font-bold text-primary">{attempt.score}%</p>
                          <p className={`text-label-sm font-bold uppercase tracking-wider ${isPassed ? "text-tertiary" : "text-error"}`}>
                            {attempt.status}
                          </p>
                        </div>
                        {!isPassed && quizInfo._id && (
                          <button
                            onClick={() => navigate(`/quiz/${quizInfo._id}`)}
                            className="px-md py-2 bg-error text-on-error hover:bg-error/95 active:scale-95 text-xs font-bold rounded-lg transition-all shadow-sm"
                            title="Retake assessment"
                          >
                            Retake
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Generate New Quiz Modal Overlay */}
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
              <form onSubmit={handleGenerateQuiz}>
                <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mx-auto mb-md">
                  <span className="material-symbols-outlined text-[28px] text-primary">assignment_add</span>
                </div>
                <h3 className="font-title-md text-title-md font-bold text-on-surface mb-xs text-center">
                  Generate New AI Quiz
                </h3>
                <p className="text-on-surface-variant font-body-md mb-md text-center">
                  Enter a topic or chapter name. StudyMate AI will compile a 10-question multiple choice assessment with explanations.
                </p>

                <div className="mb-lg text-left">
                  <label htmlFor="quiz-topic-input" className="block text-label-sm font-label-sm text-on-surface mb-2 font-bold uppercase tracking-wider">
                    Topic / Concept
                  </label>
                  <input
                    id="quiz-topic-input"
                    type="text"
                    required
                    className="w-full px-md py-3 border border-outline-variant rounded-xl bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-body-md text-on-surface"
                    placeholder="e.g. Promises, Flexbox, OS Scheduling"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div className="flex gap-sm">
                  <button
                    type="submit"
                    className="w-full py-sm bg-primary text-on-primary font-label-md text-label-md rounded-xl hover:opacity-90 font-bold active:scale-95 transition-all flex items-center justify-center gap-xs cursor-pointer"
                  >
                    Generate Quiz
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
                  <span className="material-symbols-outlined text-[32px] text-primary absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 animate-pulse">
                    psychology
                  </span>
                </div>
                <h4 className="font-title-md text-title-md font-bold text-on-surface mb-xs">
                  Generating AI Quiz
                </h4>
                <p className="text-primary font-label-md font-semibold animate-pulse">
                  {steps[loadingStep]}
                </p>
                <p className="text-on-surface-variant font-body-md mt-sm max-w-[280px]">
                  Drafting questions and detailed answer explanations...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizzesPage;
