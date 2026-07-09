// ============================================================
// controllers/quizController.js
// Controller handlers for Quizzes and Attempts endpoints
// ============================================================

const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");

/** Get list of all available quizzes */
exports.getQuizzes = async (req, res, next) => {
  try {
    // Delete any existing quizzes that don't have explanations in their questions to force a fresh seed
    const shortQuizzesCount = await Quiz.countDocuments({ "questions.0.explanation": { $exists: false } });
    if (shortQuizzesCount > 0) {
      await Quiz.deleteMany({});
    }

    let count = await Quiz.countDocuments();

    // Auto-seed default quizzes if database is empty
    if (count === 0) {
      await Quiz.create([
        {
          title: "Data Structures & Algorithms",
          subject: "Computer Science",
          chapter: "Chapter 4: Binary Search Trees — Assessment",
          questions: [
            {
              questionText: "What is the worst-case time complexity of searching for an element in a Binary Search Tree (BST) with N nodes?",
              type: "single-choice",
              imagePath: "https://lh3.googleusercontent.com/aida-public/AB6AXuAqtQUCmdyXmayXU2e-p_TUI300sahs05b7RO0G5s9MTJp7u4jlm4gGdKtCAEiwvLRF5LLVlaQtLgowZ5npiBZgicP88eiOyFaTfWjEo_8qXwK387bxJ2pdr9LBHA2KZNTSSZ9Dir3maOV4Ybst42TZ0t7J5vFFpmSHcq_MAnZf54v_fWwakiPsK4N2jQ0A5rnFoOyaV2kMO0oTs6xPMlmrrCERq6OCkGX0EF24h3mNe8_i9cHdB-tG",
              options: [
                "O(1) - Constant Time",
                "O(log N) - Logarithmic Time",
                "O(N) - Linear Time (in a skewed tree)",
                "O(N log N) - Linearithmic Time"
              ],
              correctAnswerIndex: 2,
              explanation: "In a skewed Binary Search Tree (where every node only has a right child or left child), searching degrades to O(N) because it behaves like a linked list where you must inspect every element."
            },
            {
              questionText: "What is the average time complexity of insertion in a balanced BST?",
              type: "single-choice",
              options: ["O(N)", "O(log N)", "O(1)", "O(N log N)"],
              correctAnswerIndex: 1,
              explanation: "On average, a balanced BST halves the search space at each level, leading to logarithmic O(log N) operations for search, insertion, and deletion."
            },
            {
              questionText: "Which traversal of a Binary Search Tree produces sorted ascending order?",
              type: "single-choice",
              options: ["Pre-order", "Post-order", "In-order", "Level-order"],
              correctAnswerIndex: 2,
              explanation: "In-order traversal visits the left subtree, then the current node, then the right subtree, producing elements in sorted, ascending order for a BST."
            },
            {
              questionText: "Which of the following self-balancing binary search trees maintains a balance factor of -1, 0, or +1 for each node?",
              type: "single-choice",
              options: ["AVL Tree", "Red-Black Tree", "B-Tree", "Splay Tree"],
              correctAnswerIndex: 0,
              explanation: "An AVL Tree is a self-balancing BST where the height difference (balance factor) between left and right subtrees of any node is strictly limited to -1, 0, or +1."
            },
            {
              questionText: "In a Red-Black Tree, what is the color of the root node?",
              type: "single-choice",
              options: ["Red", "Black", "Either Red or Black", "Double Red"],
              correctAnswerIndex: 1,
              explanation: "Red-Black Trees mandate that the root node must be Black. This is one of the five properties that maintain structural balance during insertions and deletions."
            },
            {
              questionText: "What is the maximum number of children a node can have in a Binary Tree?",
              type: "single-choice",
              options: ["1", "2", "Unlimited", "3"],
              correctAnswerIndex: 1,
              explanation: "A Binary Tree is defined by the constraint that no node can have more than 2 children (typically referred to as left and right children)."
            },
            {
              questionText: "What traversal method is used to perform a Breadth-First Search (BFS) on a tree?",
              type: "single-choice",
              options: ["Pre-order", "In-order", "Post-order", "Level-order"],
              correctAnswerIndex: 3,
              explanation: "Level-order traversal visits nodes level-by-level from top to bottom, which represents a Breadth-First Search (BFS) traversal."
            },
            {
              questionText: "Which data structure is typically used to implement recursion or Depth-First Search (DFS) traversal?",
              type: "single-choice",
              options: ["Queue", "Stack", "Heap", "Hash Table"],
              correctAnswerIndex: 1,
              explanation: "A Stack data structure follows Last-In-First-Out (LIFO) order, which is the exact structure used by system call stacks to manage recursive calls or DFS traversals."
            },
            {
              questionText: "What is the space complexity of a recursive In-order traversal on a balanced BST of height H?",
              type: "single-choice",
              options: ["O(1)", "O(H) due to call stack", "O(N)", "O(N log N)"],
              correctAnswerIndex: 1,
              explanation: "In a balanced BST, the maximum recursion depth is bounded by the height H. The call stack holds up to H stack frames, yielding O(H) space complexity."
            },
            {
              questionText: "In a binary heap, what is the time complexity to extract the minimum element?",
              type: "single-choice",
              options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
              correctAnswerIndex: 1,
              explanation: "Extracting the minimum element from a min-heap requires replacing the root with the last element and heapifying down, taking logarithmic time O(log N)."
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
              explanation: "Arrow functions do not bind their own 'this' value (they inherit it lexically) and cannot be used with the 'new' keyword as constructors."
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
              explanation: "'let' is block-scoped, restricting it to the nearest enclosing pair of curly braces, whereas 'var' is function-scoped and undergoes hoisting to the top of its function block."
            },
            {
              questionText: "Which ES6 feature allows you to unpack values from arrays or properties from objects into distinct variables?",
              type: "single-choice",
              options: ["Spread Syntax", "Rest Parameters", "Destructuring Assignment", "Template Literals"],
              correctAnswerIndex: 2,
              explanation: "Destructuring assignment allows unpacking values from arrays or object properties into distinct variables using syntax like const [a, b] = array."
            },
            {
              questionText: "How do you define a default parameter value in an ES6 function definition?",
              type: "single-choice",
              options: [
                "function greet(name || 'Guest') {}",
                "function greet(name = 'Guest') {}",
                "function greet(name := 'Guest') {}",
                "function greet(name => 'Guest') {}"
              ],
              correctAnswerIndex: 1,
              explanation: "ES6 introduced default parameters directly in the parameter list using the assignment operator (e.g. name = 'Guest'), removing the need for manual check expressions."
            },
            {
              questionText: "What is the purpose of the Spread operator (...) in array literals?",
              type: "single-choice",
              options: [
                "To pack multiple arguments into a single array parameter",
                "To check if an array contains specific elements",
                "To expand an array into individual elements",
                "To sort the elements of an array automatically"
              ],
              correctAnswerIndex: 2,
              explanation: "The Spread operator (...) expands an iterable (like an array or string) into individual elements, which is extremely useful for merging arrays or creating shallow copies."
            },
            {
              questionText: "Which keyword is used to declare a block-scoped variable that cannot be reassigned?",
              type: "single-choice",
              options: ["var", "let", "const", "readonly"],
              correctAnswerIndex: 2,
              explanation: "The 'const' keyword creates a block-scoped variable whose reference or identifier cannot be reassigned once defined."
            },
            {
              questionText: "What do Template Literals use to wrap string expressions?",
              type: "single-choice",
              options: ["Single quotes ('')", "Double quotes (\"\")", "Backticks (``)", "Parentheses (())"],
              correctAnswerIndex: 2,
              explanation: "Template Literals are enclosed by backticks (``) and allow embedding variables or expressions inside strings using the ${expression} syntax."
            },
            {
              questionText: "Which new ES6 class method serves as the constructor for class initialization?",
              type: "single-choice",
              options: ["init", "constructor", "create", "new"],
              correctAnswerIndex: 1,
              explanation: "The 'constructor' method is a special method on ES6 classes designated for creating and initializing class object instances."
            },
            {
              questionText: "What is the output of checking the type of an ES6 class definition?",
              type: "single-choice",
              options: ["\"class\"", "\"object\"", "\"function\"", "\"type\""],
              correctAnswerIndex: 2,
              explanation: "Under the hood, JavaScript classes are syntax sugar over prototype-based inheritance, meaning the type of a class is still evaluated as a 'function'."
            },
            {
              questionText: "Which ES6 module syntax is used to export variable or function bindings?",
              type: "single-choice",
              options: ["module.exports", "require()", "export default / export", "import from"],
              correctAnswerIndex: 2,
              explanation: "ES6 modules use standard 'export default' or named 'export' keywords to expose bindings to other files."
            }
          ]
        },
        {
          title: "Tailwind Config",
          subject: "CSS",
          chapter: "Tailwind CSS Architecture",
          questions: [
            {
              questionText: "Which file is used to customize and extend Tailwind CSS theme tokens?",
              type: "single-choice",
              options: ["tailwind.css", "tailwind.config.js", "postcss.config.js", "styles.css"],
              correctAnswerIndex: 1,
              explanation: "The tailwind.config.js file is the main configuration file where you customize colors, themes, screens, content files, and plugins."
            },
            {
              questionText: "Inside tailwind.config.js, where should you place customizations to keep default styles intact but add new values?",
              type: "single-choice",
              options: ["theme", "theme.extend", "variants", "plugins"],
              correctAnswerIndex: 1,
              explanation: "Placing modifications inside theme.extend ensures that default Tailwind utility classes remain available, only extending or overriding specified elements."
            },
            {
              questionText: "Which property in tailwind.config.js configures paths to all of your HTML templates and JS components?",
              type: "single-choice",
              options: ["content", "purge", "templates", "watch"],
              correctAnswerIndex: 0,
              explanation: "The 'content' array determines the paths to templates (HTML, JS, JSX, etc.) that Tailwind should scan to build and purge unused CSS classes."
            },
            {
              questionText: "What utility prefix does Tailwind use to target dark mode styles?",
              type: "single-choice",
              options: ["mode-dark:", "night:", "dark:", "theme-dark:"],
              correctAnswerIndex: 2,
              explanation: "Tailwind targets dark mode by prefixing utilities with 'dark:', which will trigger depending on dark mode configuration classes."
            },
            {
              questionText: "How do you disable or add custom Tailwind plugins?",
              type: "single-choice",
              options: ["Via postcss config", "Via theme array", "Via plugins array", "Via components array"],
              correctAnswerIndex: 2,
              explanation: "Tailwind plugins (such as forms, typography, etc.) are registered by placing them inside the plugins array in tailwind.config.js."
            },
            {
              questionText: "Which directive is used in CSS files to inject Tailwind's base styles?",
              type: "single-choice",
              options: ["@import tailwind;", "@use tailwind;", "@tailwind base;", "@include tailwind;"],
              correctAnswerIndex: 2,
              explanation: "The '@tailwind base;' directive is standard CSS syntax to inject Tailwind's core normalize and resetting styles."
            },
            {
              questionText: "How do you write arbitrary values directly in Tailwind utility classes?",
              type: "single-choice",
              options: [
                "Using curly braces, e.g., w-{350px}",
                "Using square brackets, e.g., w-[350px]",
                "Using parentheses, e.g., w-(350px)",
                "Using hashtags, e.g., w-#350px"
              ],
              correctAnswerIndex: 1,
              explanation: "Square brackets allow the usage of arbitrary CSS values inside Tailwind's naming utilities, e.g. w-[350px] compiles exactly to width: 350px."
            },
            {
              questionText: "What does Tailwind's JIT (Just-in-Time) compiler do?",
              type: "single-choice",
              options: [
                "Compying React modules automatically",
                "Generates utility styles on-demand as you write code templates",
                "Precompiles all possible utilities into one giant file",
                "Runs tests on code changes"
              ],
              correctAnswerIndex: 1,
              explanation: "The Just-in-Time (JIT) compiler scans template files and builds only the exact utility classes you use, resulting in tiny CSS bundle sizes."
            },
            {
              questionText: "Which theme configuration property governs the breakpoint screen sizes?",
              type: "single-choice",
              options: ["theme.breakpoints", "theme.screens", "theme.media", "theme.views"],
              correctAnswerIndex: 1,
              explanation: "The breakpoints configuration is defined in tailwind.config.js under the theme.screens key, setting responsive media query widths."
            },
            {
              questionText: "Which directive allows you to inline Tailwind utility classes into custom CSS rules?",
              type: "single-choice",
              options: ["@extend", "@mixin", "@apply", "@include"],
              correctAnswerIndex: 2,
              explanation: "The '@apply' directive allows inlining Tailwind's utility classes directly into custom CSS components or custom selectors."
            }
          ]
        },
        {
          title: "Async JavaScript",
          subject: "JavaScript",
          chapter: "Promises and Async/Await",
          questions: [
            {
              questionText: "What is the status of a Promise that has successfully completed?",
              type: "single-choice",
              options: ["pending", "resolved/fulfilled", "rejected", "completed"],
              correctAnswerIndex: 1,
              explanation: "Once a Promise has successfully completed, its state shifts from pending to resolved (or fulfilled), running any registered .then() callbacks."
            },
            {
              questionText: "Which keyword is placed before a function declaration to make it return a Promise?",
              type: "single-choice",
              options: ["await", "promise", "async", "defer"],
              correctAnswerIndex: 2,
              explanation: "Prefixing a function declaration with the 'async' keyword ensures that the function always returns a Promise, implicitly wrapping return values."
            },
            {
              questionText: "How do you handle errors inside an async/await function block?",
              type: "single-choice",
              options: ["Using catch() callbacks", "Using try/catch blocks", "Using return false", "Using global error handles"],
              correctAnswerIndex: 1,
              explanation: "The async/await syntax allows using standard synchronous control flow constructs like try/catch blocks to gracefully handle rejected promises."
            },
            {
              questionText: "What method is used to execute multiple promises in parallel and wait for all to complete?",
              type: "single-choice",
              options: ["Promise.race()", "Promise.parallel()", "Promise.all()", "Promise.any()"],
              correctAnswerIndex: 2,
              explanation: "Promise.all() accepts an iterable of promises and resolves when all resolve, or rejects immediately as soon as any promise rejects."
            },
            {
              questionText: "If any promise in Promise.all() rejects, what is the outcome?",
              type: "single-choice",
              options: [
                "It waits for the others to finish and resolves anyway",
                "It immediately rejects with that error",
                "It returns a list of results ignoring the failed promise",
                "It ignores the failure and returns null"
              ],
              correctAnswerIndex: 1,
              explanation: "Promise.all() behaves as an 'all-or-nothing' function, failing fast and rejecting immediately if any of the supplied promises reject."
            },
            {
              questionText: "Which promise method resolves as soon as the first promise in an iterable resolves or rejects?",
              type: "single-choice",
              options: ["Promise.all()", "Promise.any()", "Promise.race()", "Promise.allSettled()"],
              correctAnswerIndex: 2,
              explanation: "Promise.race() returns a promise that resolves or rejects as soon as one of the input promises resolves or rejects, whichever comes first."
            },
            {
              questionText: "What is the initial state of a newly created Promise?",
              type: "single-choice",
              options: ["pending", "resolved", "rejected", "settled"],
              correctAnswerIndex: 0,
              explanation: "When a new Promise is created, it starts in the 'pending' state until it is either resolved (fulfilled) or rejected."
            },
            {
              questionText: "What helper method returns a promise that resolves after all of the given promises have either resolved or rejected?",
              type: "single-choice",
              options: ["Promise.all()", "Promise.race()", "Promise.any()", "Promise.allSettled()"],
              correctAnswerIndex: 3,
              explanation: "Promise.allSettled() waits for all input promises to settle (either resolve or reject) and returns an array of status objects for each promise."
            },
            {
              questionText: "How do you chain another asynchronous operation after a promise succeeds?",
              type: "single-choice",
              options: ["Using .catch()", "Using .then()", "Using .finally()", "Using .wait()"],
              correctAnswerIndex: 1,
              explanation: "Chaining a .then() block allows scheduling subsequent operations that will receive the resolved value of the prior promise."
            },
            {
              questionText: "What is the JavaScript Event Loop responsible for?",
              type: "single-choice",
              options: [
                "Executing callbacks from the task queues in order",
                "Running multiple JavaScript threads simultaneously",
                "Compiling JS code to machine instructions",
                "Sending HTTP requests to servers"
              ],
              correctAnswerIndex: 0,
              explanation: "The event loop continuously monitors the call stack and callback queue, pushing queued tasks into the stack once it becomes empty."
            }
          ]
        },
        {
          title: "Node.js Stream API",
          subject: "Node.js",
          chapter: "Streams, Buffers and Files",
          questions: [
            {
              questionText: "Which type of stream can be used for both reading and writing?",
              type: "single-choice",
              options: ["Readable", "Writable", "Duplex", "Transform"],
              correctAnswerIndex: 2,
              explanation: "Duplex streams implement both Readable and Writable interfaces, allowing data to flow in both directions (e.g. TCP sockets)."
            },
            {
              questionText: "What method is used to connect a Readable stream directly to a Writable stream?",
              type: "single-choice",
              options: [".connect()", ".pipe()", ".link()", ".write()"],
              correctAnswerIndex: 1,
              explanation: "The .pipe() method reads data from a readable stream and writes it to a destination writable stream while automatically managing backpressure."
            },
            {
              questionText: "Which stream event is fired when there is no more data to be read from a Readable stream?",
              type: "single-choice",
              options: ["'finish'", "'close'", "'end'", "'empty'"],
              correctAnswerIndex: 2,
              explanation: "The 'end' event is emitted on readable streams when there is no more data to be consumed from the underlying resource."
            },
            {
              questionText: "Which stream event is fired when a Writable stream has finished writing all chunks?",
              type: "single-choice",
              options: ["'finish'", "'end'", "'drain'", "'close'"],
              correctAnswerIndex: 0,
              explanation: "The 'finish' event is emitted on writable streams after calling stream.end() and once all queued chunks have been flushed."
            },
            {
              questionText: "What is a Transform stream?",
              type: "single-choice",
              options: [
                "A stream that converts Buffers to JSON",
                "A Writable stream that logs everything",
                "A Duplex stream where the output is computed from the input",
                "A Readable stream that filters data arrays"
              ],
              correctAnswerIndex: 2,
              explanation: "A Transform stream is a specific type of Duplex stream where the output is dynamically computed by transforming the input data chunk-by-chunk."
            },
            {
              questionText: "What event is emitted when data is available to read from a Readable stream in paused mode?",
              type: "single-choice",
              options: ["'data'", "'readable'", "'flowing'", "'buffer'"],
              correctAnswerIndex: 1,
              explanation: "The 'readable' event signals that the stream has new data available to be read via the stream.read() method."
            },
            {
              questionText: "Which mode are Node.js streams in by default when created?",
              type: "single-choice",
              options: ["Flowing mode", "Paused mode", "Buffered mode", "Async mode"],
              correctAnswerIndex: 1,
              explanation: "Readable streams are in paused mode by default, meaning you must explicitly resume flowing or attach event listeners to consume data."
            },
            {
              questionText: "How do you switch a Readable stream from paused mode to flowing mode?",
              type: "single-choice",
              options: [
                "Calling .pause() method",
                "Attaching a 'data' event handler or calling .resume()",
                "Calling .pipe() to another Readable stream",
                "Setting highWaterMark to 0"
              ],
              correctAnswerIndex: 1,
              explanation: "Attaching a listener to the 'data' event or calling the stream.resume() method switches the paused stream to flowing mode."
            },
            {
              questionText: "What is backpressure in Node.js streams?",
              type: "single-choice",
              options: [
                "When write rate exceeds the read rate buffer size",
                "When read rate exceeds the write rate buffer limit",
                "A network error code during stream pipeline download",
                "A memory leak in events listeners"
              ],
              correctAnswerIndex: 1,
              explanation: "Backpressure occurs when the read rate of a readable stream exceeds the processing or write rate of the destination writable stream buffer."
            },
            {
              questionText: "What module does the Stream class inherit from in Node.js core?",
              type: "single-choice",
              options: ["Buffer", "EventEmitter", "fs", "http"],
              correctAnswerIndex: 1,
              explanation: "Node.js Stream classes inherit directly from the EventEmitter class, enabling them to emit standard events like 'data', 'error', 'end', and 'finish'."
            }
          ]
        }
      ]);
    }

    const quizzes = await Quiz.find();
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
