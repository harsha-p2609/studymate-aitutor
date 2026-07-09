// ============================================================
// pages/QuizInterfacePage.jsx
// Interactive assessment environment with countdown timer,
// option selection, submit confirmation modal, and final results view
// ============================================================

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const QuizInterfacePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(900); // 15:00 minutes
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [results, setResults] = useState(null); // Non-null once quiz is submitted

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/quizzes/${id}`);
        if (res.data.success) {
          setQuiz(res.data.data);
          // Initialize answers array with null values
          setSelectedAnswers(new Array(res.data.data.questions.length).fill(null));
        }
      } catch (err) {
        console.error("Error loading quiz:", err);
        toast.error("Failed to load quiz questions");
        navigate("/quizzes");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  // Quiz Timer countdown
  useEffect(() => {
    if (loading || results || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, results, timeRemaining]);

  const formatTimer = () => {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = (optionIndex) => {
    setSelectedAnswers((prev) => {
      const copy = [...prev];
      copy[currentIdx] = optionIndex;
      return copy;
    });
  };

  const handleNext = () => {
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleAutoSubmit = () => {
    toast.error("Time is up! Submitting your answers...");
    submitQuizAnswers();
  };

  const submitQuizAnswers = async () => {
    setShowSubmitModal(false);
    try {
      setLoading(true);
      // Clean up answers (convert null to -1 if any unanswered)
      const cleanedAnswers = selectedAnswers.map((ans) => (ans === null ? -1 : ans));
      const res = await api.post(`/quizzes/${id}/submit`, { answers: cleanedAnswers });
      
      if (res.data.success) {
        setResults(res.data.data);
        toast.success("Quiz submitted successfully!");
      }
    } catch (err) {
      console.error("Error submitting quiz:", err);
      toast.error("Failed to submit answers");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center p-xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // ── Results View ───────────────────────────────────────────────
  if (results) {
    const isPassed = results.status === "Passed";
    return (
      <div className="px-gutter py-md pb-32 flex-grow max-w-4xl mx-auto w-full">
        <section className="bg-white border border-outline-variant rounded-xl shadow-sm p-lg md:p-xl text-center mb-lg">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-md shadow-md ${
            isPassed ? "bg-tertiary text-white" : "bg-error text-white"
          }`}>
            <span className="material-symbols-outlined text-[40px]">
              {isPassed ? "assignment_turned_in" : "assignment_late"}
            </span>
          </div>

          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-xs">
            {isPassed ? "Congratulations!" : "Keep Practicing!"}
          </h2>
          <p className="text-on-surface-variant font-body-md max-w-md mx-auto mb-lg">
            You completed the assessment for <strong>{quiz.title}</strong>.
          </p>

          <div className="flex justify-center items-baseline gap-xs mb-lg">
            <span className="text-[64px] font-extrabold text-primary">{results.score}%</span>
            <span className="font-label-md text-label-md text-on-surface-variant">Score</span>
          </div>

          <div className="inline-block px-md py-2 rounded-full font-bold uppercase tracking-wider text-sm mb-lg shadow-sm bg-surface-container-high">
            Status:{" "}
            <span className={isPassed ? "text-tertiary" : "text-error"}>
              {results.status}
            </span>
          </div>

          <div className="border-t border-outline-variant/60 pt-lg max-w-2xl mx-auto text-left">
            <h4 className="font-title-md text-title-md font-bold mb-md">Summary of Results:</h4>
            <div className="space-y-md">
              {quiz.questions.map((q, qIndex) => {
                const userAnsIndex = results.answers[qIndex];
                const correctAnsIndex = q.correctAnswerIndex;
                const isCorrect = userAnsIndex === correctAnsIndex;

                return (
                  <div key={q._id} className="p-sm rounded-lg border border-outline-variant/40 bg-surface-container-low">
                    <p className="font-label-md text-label-md font-bold mb-xs">
                      {qIndex + 1}. {q.questionText}
                    </p>
                    <p className="text-body-md text-label-sm">
                      Your answer:{" "}
                      <span className={isCorrect ? "text-tertiary font-bold" : "text-error font-bold"}>
                        {userAnsIndex !== -1 ? q.options[userAnsIndex] : "Unanswered"}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-body-md text-label-sm text-on-surface-variant mt-0.5">
                        Correct answer: <span className="text-primary font-semibold">{q.options[correctAnsIndex]}</span>
                      </p>
                    )}
                    {q.explanation && (
                      <div className="mt-sm bg-surface-container-high/40 p-sm rounded-lg border-l-4 border-primary text-body-sm text-on-surface-variant leading-relaxed">
                        <span className="font-semibold text-primary block mb-0.5">Explanation</span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-xl flex flex-col sm:flex-row justify-center gap-sm">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-lg py-3 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => {
                setResults(null);
                setCurrentIdx(0);
                setSelectedAnswers(new Array(quiz.questions.length).fill(null));
                setTimeRemaining(900);
              }}
              className="px-lg py-3 border border-outline-variant text-primary font-bold rounded-xl hover:bg-surface-container-low active:scale-[0.98] transition-all"
            >
              Retake Quiz
            </button>
          </div>
        </section>
      </div>
    );
  }

  // ── Active Exam View ───────────────────────────────────────────
  const currentQuestion = quiz.questions[currentIdx];
  const selectedOption = selectedAnswers[currentIdx];
  const percentCompleted = Math.round(((selectedAnswers.filter((a) => a !== null).length) / quiz.questions.length) * 100);

  return (
    <div className="px-gutter py-md pb-32 flex-grow max-w-container-max mx-auto w-full">
      {/* Header Info */}
      <header className="mb-lg flex flex-col sm:flex-row sm:items-end justify-between gap-md">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold">{quiz.title}</h1>
          <p className="text-on-surface-variant font-body-md text-body-md mt-xs">{quiz.chapter}</p>
        </div>
        <div className="flex items-center gap-sm bg-white border border-outline-variant px-md py-sm rounded-xl shadow-sm shrink-0 self-start sm:self-auto">
          <span className="material-symbols-outlined text-primary text-[24px]">timer</span>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Remaining</span>
            <span className="font-title-md text-title-md text-primary font-bold">{formatTimer()}</span>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="mb-lg bg-white p-md rounded-xl border border-outline-variant shadow-sm">
        <div className="flex justify-between items-center mb-sm">
          <span className="font-label-md text-label-md text-on-surface font-bold">
            Question {currentIdx + 1} of {quiz.questions.length}
          </span>
          <span className="font-label-md text-label-md text-primary font-bold">{percentCompleted}% Completed</span>
        </div>
        <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((currentIdx + 1) / quiz.questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Central Question Card */}
      <section className="bg-white rounded-xl border border-outline-variant shadow-sm p-lg md:p-xl mb-lg">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block px-sm py-xs bg-primary-container text-on-primary-container rounded-lg font-label-sm text-label-sm mb-md font-bold tracking-wider">
            SINGLE CHOICE
          </div>

          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-lg leading-tight font-bold">
            {currentQuestion.questionText}
          </h2>

          {/* Optional Question Context Diagram Image */}
          {currentQuestion.imagePath && (
            <div className="mb-lg rounded-xl overflow-hidden border border-outline-variant max-w-2xl mx-auto shadow-sm bg-surface-container-low">
              <img
                className="w-full h-auto max-h-[300px] object-contain p-md mx-auto"
                alt="Question visual helper"
                src={currentQuestion.imagePath}
              />
            </div>
          )}

          {/* Option Choices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {currentQuestion.options.map((option, idx) => {
              const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D
              const isSelected = selectedOption === idx;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`group flex items-start gap-md p-md border rounded-xl transition-all text-left ${
                    isSelected
                      ? "border-2 border-primary-container bg-surface-container-low"
                      : "border-outline-variant hover:border-primary-container hover:bg-surface-container-low"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold shrink-0 transition-all ${
                      isSelected
                        ? "border-primary-container text-primary"
                        : "border-outline-variant group-hover:border-primary-container group-hover:text-primary text-on-surface-variant"
                    }`}
                  >
                    {optionLetter}
                  </div>
                  <span className="font-body-md text-body-md text-on-surface pt-1">{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Navigation & Submit buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-md bg-white border border-outline-variant rounded-xl p-md shadow-sm">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="w-full sm:w-auto px-lg py-sm border border-outline-variant text-primary font-label-md text-label-md rounded-xl hover:bg-surface-container-low transition-colors flex items-center justify-center gap-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span> Previous
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-md w-full sm:w-auto">
          {currentIdx < quiz.questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="w-full sm:w-auto px-lg py-sm bg-primary text-on-primary font-label-md text-label-md rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-xs font-semibold shadow-sm"
            >
              Next Question <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full sm:w-auto px-lg py-sm bg-tertiary text-on-tertiary font-label-md text-label-md rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-xs font-bold shadow-sm animate-pulse"
            >
              <span className="material-symbols-outlined text-[20px]">check_circle</span> Submit Quiz
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-on-background/40 backdrop-blur-sm z-[100] flex items-center justify-center p-md animate-fade-in">
          <div className="bg-white rounded-2xl border border-outline-variant shadow-xl max-w-md w-full p-lg text-center">
            <div className="w-16 h-16 bg-tertiary-container text-on-tertiary-container rounded-full flex items-center justify-center mx-auto mb-md shadow-sm">
              <span className="material-symbols-outlined text-[32px]">assignment_turned_in</span>
            </div>
            <h3 className="font-headline-lg text-headline-lg text-on-surface mb-xs font-bold">Ready to submit?</h3>
            <p className="text-on-surface-variant font-body-md text-body-md mb-lg">
              You have answered {selectedAnswers.filter((a) => a !== null).length} out of {quiz.questions.length} questions.
              Once submitted, you cannot change your answers.
            </p>
            <div className="flex flex-col gap-sm">
              <button
                onClick={submitQuizAnswers}
                className="w-full py-sm bg-primary text-on-primary font-label-md text-label-md rounded-xl hover:opacity-90 font-bold active:scale-95"
              >
                Confirm Submission
              </button>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="w-full py-sm border border-outline-variant text-on-surface-variant font-label-md text-label-md rounded-xl hover:bg-surface-container-low font-bold"
              >
                Keep Reviewing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizInterfacePage;
