const StudyPlan = require("../models/StudyPlan");
const ChatSession = require("../models/ChatSession");
const FlashcardDeck = require("../models/FlashcardDeck");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");

// Helper to seed default quizzes globally if they don't exist
const ensureGlobalQuizzesSeeded = async () => {
  const count = await Quiz.countDocuments();
  if (count === 0) {
    const defaultQuizzes = [
      {
        title: "Data Structures & Algorithms",
        subject: "Computer Science",
        chapter: "Chapter 4: Binary Search Trees — Assessment",
        questions: [
          {
            questionText: "What is the worst-case time complexity of searching for an element in a Binary Search Tree (BST) with N nodes?",
            type: "single-choice",
            options: [
              "O(1) - Constant Time",
              "O(log N) - Logarithmic Time",
              "O(N) - Linear Time (in a skewed tree)",
              "O(N log N) - Linearithmic Time"
            ],
            correctAnswerIndex: 2,
            explanation: "In a skewed Binary Search Tree, searching degrades to O(N) because it behaves like a linked list."
          },
          {
            questionText: "What is the average time complexity of insertion in a balanced BST?",
            type: "single-choice",
            options: ["O(N)", "O(log N)", "O(1)", "O(N log N)"],
            correctAnswerIndex: 1,
            explanation: "On average, a balanced BST halves the search space at each level, leading to logarithmic O(log N) operations."
          },
          {
            questionText: "Which traversal of a Binary Search Tree produces sorted ascending order?",
            type: "single-choice",
            options: ["Pre-order", "Post-order", "In-order", "Level-order"],
            correctAnswerIndex: 2,
            explanation: "In-order traversal visits the left subtree, then the current node, then the right subtree, producing elements in sorted order."
          }
        ]
      },
      {
        title: "ES6 Features",
        subject: "JavaScript",
        chapter: "Modern EcmaScript Essentials",
        questions: [
          {
            questionText: "Which of the following is true about arrow functions?",
            type: "single-choice",
            options: [
              "They have their own binding for 'this'",
              "They cannot be used as constructors",
              "They do not support rest parameters",
              "They are slower than traditional functions"
            ],
            correctAnswerIndex: 1,
            explanation: "Arrow functions do not bind their own 'this' value and cannot be used with 'new' as constructors."
          },
          {
            questionText: "What is the key difference between 'let' and 'var' declarations?",
            type: "single-choice",
            options: [
              "'let' is block-scoped, whereas 'var' is function-scoped",
              "'var' is block-scoped, whereas 'let' is function-scoped",
              "'let' variables can be redeclared in the same scope",
              "'var' does not support hoisting"
            ],
            correctAnswerIndex: 0,
            explanation: "'let' is block-scoped, restricting it to the nearest enclosing pair of curly braces."
          },
          {
            questionText: "Which ES6 feature allows you to unpack values from arrays or properties from objects into distinct variables?",
            type: "single-choice",
            options: ["Spread Syntax", "Rest Parameters", "Destructuring Assignment", "Template Literals"],
            correctAnswerIndex: 2,
            explanation: "Destructuring assignment allows unpacking values from arrays or object properties into variables."
          }
        ]
      }
    ];
    await Quiz.create(defaultQuizzes);
    console.log("✅ Seeded default quizzes globally");
  }
};

/**
 * Main function to seed mock study tutor data for a user
 * @param {string} userId - Mongoose ObjectId of the user
 */
const seedMockUserData = async (userId) => {
  try {
    console.log(`🌱 Seeding mock data for user: ${userId}`);

    // 1. Seed Study Plan (Roadmap)
    const existingPlan = await StudyPlan.findOne({ userId });
    if (!existingPlan) {
      await StudyPlan.create({
        userId,
        roadmapTitle: "Full-Stack Development Mastery",
        overallProgress: 25,
        streak: 3,
        lastStudyDate: new Date(),
        timeline: [
          {
            title: "Foundations of Modern Web",
            status: "completed",
            completedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            progressPercent: 100,
            lessonsCount: 4,
            examsCount: 1,
            challengesCount: 2,
            resources: [
              { name: "MDN Web Docs — HTML & CSS", url: "https://developer.mozilla.org" },
              { name: "JavaScript Guide", url: "https://javascript.info" }
            ],
            videoLinks: [
              { name: "HTML/CSS Full Course", url: "https://www.youtube.com" }
            ]
          },
          {
            title: "Advanced React State Management",
            status: "current",
            completedDate: "",
            progressPercent: 0,
            lessonsCount: 3,
            examsCount: 1,
            challengesCount: 2,
            resources: [
              { name: "Redux Toolkit docs", url: "https://redux-toolkit.js.org" }
            ],
            videoLinks: [
              { name: "React State Management patterns", url: "https://www.youtube.com" }
            ]
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
          }
        ],
        dailyGoals: [
          { task: "Review Redux Toolkit slices", completed: false, difficulty: "Medium", estMinutes: 45 },
          { task: "Solve 2 Performance Challenges", completed: true, difficulty: "High", estMinutes: 60 },
          { task: "Watch \"Hydration in SSR\" module", completed: false, difficulty: "Medium", estMinutes: 30 },
        ],
      });
      console.log("   - Seeded StudyPlan");
    }

    // 2. Seed Chat History
    const existingSessions = await ChatSession.find({ userId });
    if (existingSessions.length === 0) {
      await ChatSession.create([
        {
          userId,
          topic: "Quantum Mechanics Basics",
          messages: [
            { sender: "ai", text: "Quantum mechanics is a fundamental theory in physics that provides a description of the physical properties of nature at the scale of atoms and subatomic particles. Would you like me to focus on Wave-Particle Duality or the Schrödinger Equation first?" },
            { sender: "user", text: "Can you explain the observer effect? I find it confusing how looking at something changes it." },
            { sender: "ai", text: "The observer effect in quantum mechanics states that the act of observation inevitably alters the system being measured. In classical physics, we assume we can measure a system without affecting it. However, in the quantum realm, particles like electrons behave as waves of probability. To 'look' at an electron, we must bounce a photon off it, which transfers energy and collapses its wave function from a spread-out set of probabilities into a single definite state! So, the observer is not just a passive recorder, but an active participant. Would you like to see how this relates to the Double-Slit Experiment or Heisenberg's Uncertainty Principle?" }
          ]
        },
        {
          userId,
          topic: "Calculus II: Integration",
          messages: [
            { sender: "ai", text: "Integration is the process of finding the area under a curve. Let's work on Calculus II topics! Do you have any specific integration problems you want to solve?" },
            { sender: "user", text: "Help me solve the partial fraction problem." },
            { sender: "ai", text: "To solve an integral using partial fractions, we decompose a rational function into simpler terms that are easy to integrate. For example, if you have 1 / (x^2 - x), we factor the denominator to x(x - 1) and rewrite it as A/x + B/(x-1). Then we solve for A and B. Would you like to work through a specific problem together?" }
          ]
        },
        {
          userId,
          topic: "Neuroscience Lecture 4",
          messages: [
            { sender: "ai", text: "Hi! Let's study Neuroscience. We can review synapse transmissions and neurons." }
          ]
        },
        {
          userId,
          topic: "Modern Art Movements",
          messages: [
            { sender: "ai", text: "Welcome! Let's talk about Modern Art Movements like Surrealism, Cubism, or Dadaism." }
          ]
        }
      ]);
      console.log("   - Seeded ChatSessions");
    }

    // 3. Seed Custom User Flashcard Deck
    const existingDecks = await FlashcardDeck.find({ userId });
    if (existingDecks.length === 0) {
      await FlashcardDeck.create({
        userId,
        title: "Git & Version Control",
        description: "Essential commands, branch strategies, and resolving conflicts.",
        icon: "auto_stories",
        cards: [
          {
            question: "What is the difference between git fetch and git pull?",
            answer: "git fetch downloads new commits from the remote repository without merging them, whereas git pull downloads them and immediately merges them into your active local branch.",
            mastered: false
          },
          {
            question: "What is the purpose of git stash?",
            answer: "git stash temporarily shelves (hides) your uncommitted local changes so you can work on a clean branch, allowing you to restore them later with git stash pop.",
            mastered: true
          },
          {
            question: "What does git merge --no-ff do?",
            answer: "It disables 'fast-forward' merging, forcing Git to create a merge commit even if the branch could have been fast-forwarded. This preserves the historical existence of the feature branch.",
            mastered: false
          }
        ]
      });
      console.log("   - Seeded custom FlashcardDeck");
    }

    // 4. Seed Quiz Attempts (depends on seeded quizzes)
    await ensureGlobalQuizzesSeeded();
    const existingAttempts = await QuizAttempt.find({ userId });
    if (existingAttempts.length === 0) {
      const es6Quiz = await Quiz.findOne({ title: "ES6 Features" });
      const dsaQuiz = await Quiz.findOne({ title: "Data Structures & Algorithms" });

      if (es6Quiz) {
        await QuizAttempt.create({
          userId,
          quizId: es6Quiz._id,
          answers: [1, 0, 2], // 100% correct
          score: 100,
          status: "Passed",
          attemptDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        });
      }

      if (dsaQuiz) {
        await QuizAttempt.create({
          userId,
          quizId: dsaQuiz._id,
          answers: [1, 0, 0], // 33% correct
          score: 33,
          status: "Retake",
          attemptDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        });
      }
      console.log("   - Seeded QuizAttempts");
    }

    console.log(`✅ Seeded all mock study tutor data successfully for user ${userId}`);
  } catch (error) {
    console.error(`❌ Error seeding mock user data: ${error.message}`);
  }
};

module.exports = { seedMockUserData };
