// ============================================================
// controllers/quizController.js
// Controller handlers for Quizzes and Attempts endpoints
// ============================================================

const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");

/** Get list of all available quizzes */
exports.getQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes,
    });
  } catch (error) {
    next(error);
  }
};

/** Get a single quiz by ID */
exports.getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

/** Submit answers for a quiz attempt */
exports.submitQuiz = async (req, res, next) => {
  try {
    const { answers } = req.body; // Array of selected option indices (e.g. [2, 1, 2])
    const quizId = req.params.id;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "answers array is required",
      });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Evaluate answers
    let correctCount = 0;
    const questions = quiz.questions;
    
    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const status = score >= 50 ? "Passed" : "Retake";

    const attempt = await QuizAttempt.create({
      userId: req.user.id,
      quizId,
      answers,
      score,
      status,
    });

    // Dynamically update StudyPlan timeline progress if the user passes the quiz
    if (status === "Passed") {
      const StudyPlan = require("../models/StudyPlan");
      const plan = await StudyPlan.findOne({ userId: req.user.id });
      if (plan) {
        const activeModule = plan.timeline.find(m => m.status === "current");
        if (activeModule) {
          activeModule.progressPercent = Math.min(activeModule.progressPercent + 35, 100);
          
          if (activeModule.progressPercent >= 100) {
            activeModule.status = "completed";
            activeModule.completedDate = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            
            const nextModule = plan.timeline.find(m => m.status === "upcoming");
            if (nextModule) {
              nextModule.status = "current";
              nextModule.progressPercent = 0;
            }
          }
        }
        
        // Recalculate overall progress
        plan.overallProgress = Math.round(
          plan.timeline.reduce((sum, item) => sum + item.progressPercent, 0) / plan.timeline.length
        );
        
        await plan.save();
      }
    }

    res.status(201).json({
      success: true,
      data: {
        attemptId: attempt._id,
        score,
        status,
        correctCount,
        totalQuestions: questions.length,
        answers,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** Get recent quiz attempts for the logged-in user */
exports.getRecentAttempts = async (req, res, next) => {
  try {
    const attempts = await QuizAttempt.find({ userId: req.user.id })
      .populate("quizId", "title subject chapter")
      .sort({ attemptDate: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    next(error);
  }
};

/** Generate a dynamic 10-question quiz using LLMs */
exports.generateQuiz = async (req, res, next) => {
  try {
    const { topic } = req.body;
    if (!topic || topic.trim() === "") {
      return res.status(400).json({ success: false, message: "Topic is required" });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const isGroqConfigured = groqKey && groqKey !== "your_groq_api_key_here";

    let quizJson = "";

    if (isGroqConfigured) {
      try {
        const prompt = `You are a professional tutor. Generate a 10-question multiple-choice quiz about the topic: "${topic}".
Each question must have exactly 4 options (array of strings), a 0-based correctAnswerIndex (0, 1, 2, or 3), and a detailed explanation (string) explaining why the correct option is right and the others are wrong.
Return ONLY a valid JSON array, with no other text, markdown formatting, or code blocks. The JSON structure must match this format:
[
  {
    "questionText": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 2,
    "explanation": "Detailed explanation here."
  }
]`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: "You are a specialized API that returns strictly formatted JSON only. Never write conversational intros or wraps." },
              { role: "user", content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 2500,
          })
        });

        if (response.ok) {
          const resData = await response.json();
          quizJson = resData.choices[0]?.message?.content || "";
        }
      } catch (err) {
        console.error("Groq Quiz Gen Error:", err.message);
      }
    }

    // Fallback to Gemini if Groq failed or not configured
    if (!quizJson) {
      const geminiKey = process.env.GEMINI_API_KEY;
      const isGeminiConfigured = geminiKey && geminiKey !== "your_gemini_api_key_here" && !geminiKey.startsWith("AQ.");
      
      if (isGeminiConfigured) {
        try {
          const prompt = `Generate a 10-question multiple-choice quiz about: "${topic}".
Each question must have exactly 4 options, a 0-based correctAnswerIndex (0-3), and a detailed explanation.
Return ONLY a valid JSON array matching this format (no markdown code blocks, no backticks, no wrap text):
[
  {
    "questionText": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 1,
    "explanation": "Explanation here."
  }
]`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
              })
            }
          );

          if (response.ok) {
            const resData = await response.json();
            quizJson = resData.candidates[0]?.content?.parts[0]?.text || "";
          }
        } catch (err) {
          console.error("Gemini Quiz Gen Error:", err.message);
        }
      }
    }

    // Fallback Mock Quiz (if all AI fails)
    if (!quizJson) {
      const mockQuestions = [
        {
          questionText: `What is the core purpose of React (based on topic: "${topic}")?`,
          options: ["To manage databases", "To build interactive user interfaces component-by-component", "To run server-side scripts", "To compile CSS styles"],
          correctAnswerIndex: 1,
          explanation: "React is a JavaScript library designed specifically for building rich, component-driven user interfaces in web applications."
        },
        {
          questionText: "What is the Virtual DOM in React?",
          options: [
            "A direct copy of the HTML document",
            "A lightweight in-memory representation of the real DOM",
            "A security layer for database calls",
            "An external API library"
          ],
          correctAnswerIndex: 1,
          explanation: "The Virtual DOM is React's local lightweight representation of the UI state, allowing efficient diffing and batching updates before updating the real DOM."
        },
        {
          questionText: "Which hook is used to handle side effects in React functional components?",
          options: ["useState", "useContext", "useEffect", "useReducer"],
          correctAnswerIndex: 2,
          explanation: "useEffect is designated for side effects such as data fetching, subscription management, or manual DOM manipulations in functional components."
        },
        {
          questionText: "What are props in React?",
          options: ["Internal mutable state of a component", "External read-only parameters passed into a component", "HTML inline styles", "Database connection strings"],
          correctAnswerIndex: 1,
          explanation: "Props are read-only properties passed down from parent to child components, allowing component configurability and parameterization."
        },
        {
          questionText: "How do you manage local state in a functional component?",
          options: ["Using the props keyword", "Using the useState hook", "Directly altering this.state", "Using the useHistory hook"],
          correctAnswerIndex: 1,
          explanation: "The useState hook returns a state value and a updater function, allowing functional components to maintain local reactive state."
        },
        {
          questionText: "What key attribute is required when rendering a dynamic list of children components?",
          options: ["id", "index", "key", "ref"],
          correctAnswerIndex: 2,
          explanation: "React requires a unique 'key' prop for list items so that its diffing algorithm can identify which items changed, were added, or were removed."
        },
        {
          questionText: "What is JSX?",
          options: [
            "A direct database query language",
            "A syntax extension allowing HTML-like tags inside JavaScript",
            "An encrypted JS security protocol",
            "A package manager for CSS libraries"
          ],
          correctAnswerIndex: 1,
          explanation: "JSX is syntax sugar that compiles down to React.createElement calls, letting developers write UI layouts using familiar HTML-style tag declarations."
        },
        {
          questionText: "Which React hook returns a memoized callback function?",
          options: ["useMemo", "useCallback", "useRef", "useEffect"],
          correctAnswerIndex: 1,
          explanation: "useCallback caches a function instance between renders, whereas useMemo caches the computed result value of a function."
        },
        {
          questionText: "What is the correct way to handle client-side routing in a React Single Page Application?",
          options: ["Using <a href='/page'> links", "Using React Router components like Link and Route", "Calling window.location.replace()", "Implementing server-side redirect handlers"],
          correctAnswerIndex: 1,
          explanation: "React Router enables declarative navigation without page-reloads by intercepting URLs and rendering matching routes client-side."
        },
        {
          questionText: "What is the Context API in React used for?",
          options: [
            "Performing complex calculations",
            "Passing data globally down the component tree without manually drilling props",
            "Validating form inputs",
            "Running background server processes"
          ],
          correctAnswerIndex: 1,
          explanation: "Context API enables sharing global parameters (like themes, auth sessions, or locales) to nested components without manually drilling props through every intermediate level."
        }
      ];

      quizJson = JSON.stringify(mockQuestions);
    }

    // Clean any markdown wrapper blocks (e.g. ```json ... ```)
    let cleanJson = quizJson.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(json)?\n/, "");
      cleanJson = cleanJson.replace(/\n```$/, "");
    }

    const parsedQuestions = JSON.parse(cleanJson);

    // Create the Quiz in the DB
    const newQuiz = await Quiz.create({
      title: `${topic.slice(0, 30)} Assessment`,
      subject: "AI Generated",
      chapter: `Topic Review: "${topic.slice(0, 60)}"`,
      questions: parsedQuestions.map(q => ({
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation || "No explanation provided."
      }))
    });

    res.status(201).json({
      success: true,
      data: newQuiz
    });
  } catch (error) {
    console.error("Quiz Generator Error:", error);
    next(error);
  }
};

/** Clear all quiz attempts for the logged-in user */
exports.clearAttempts = async (req, res, next) => {
  try {
    await QuizAttempt.deleteMany({ userId: req.user.id });
    res.status(200).json({
      success: true,
      message: "Quiz history cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};

/** Delete a specific quiz and its attempts */
exports.deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Delete attempts for this quiz
    await QuizAttempt.deleteMany({ quizId: req.params.id });

    res.status(200).json({
      success: true,
      message: "Quiz and its associated attempts deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
