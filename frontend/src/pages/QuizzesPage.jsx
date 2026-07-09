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
    if (!window.confirm("Are you sure you want to clear your entire assessment score history? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await api.delete("/quizzes/attempts/clear");
      if (res.data.success) {
        setAttempts([]);
        toast.success("Score history cleared successfully!");
      }
    } catch (err) {
      console.error("Error clearing quiz history:", err);
      toast.error("Failed to clear score history");
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
        <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold">Mock Assessments</h1>
        <p className="text-on-surface-variant font-body-md mt-xs">Test your knowledge across your curriculum modules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
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
                <span className="text-label-sm text-on-surface-variant font-semibold">
                  {quiz.questions.length} Questions
                </span>
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
            <button
              onClick={handleClearHistory}
              className="px-sm py-xs border border-error/30 text-error hover:bg-error/5 active:scale-95 transition-all text-xs font-bold rounded-lg flex items-center gap-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
              Clear History
            </button>
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
    </div>
  );
};

export default QuizzesPage;
