// ============================================================
// controllers/flashcardController.js
// Handles listing, seeding, toggling mastery, and AI generation of flashcard decks
// ============================================================

const FlashcardDeck = require("../models/FlashcardDeck");

// ── Default Seed Data ────────────────────────────────────────
const defaultDecks = [
  {
    userId: null,
    title: "React Hooks",
    description: "Advanced patterns, useEffect dependencies, and custom hooks.",
    icon: "javascript",
    cards: [
      {
        question: "What is the primary purpose of the useEffect hook in React?",
        answer: "To synchronize a component with an external system (side effects) such as APIs, subscriptions, or direct DOM manipulation. It runs after rendering.",
      },
      {
        question: "What happens if you omit the dependency array in useEffect?",
        answer: "The effect runs after *every single render* of the component. This can cause severe performance issues or infinite loops if state is updated inside the effect.",
      },
      {
        question: "What is the rules of hooks regarding loops and conditions?",
        answer: "Hooks must only be called at the top level of your React function. Do not call hooks inside loops, conditions, or nested functions to ensure they execute in the same order on every render.",
      },
      {
        question: "What is the difference between useMemo and useCallback?",
        answer: "useMemo returns a memoized *value* computed by a function, whereas useCallback returns the memoized *callback function itself* to prevent unnecessary child rerenders.",
      },
      {
        question: "Why would you return a function from the useEffect hook?",
        answer: "To specify a cleanup mechanism. React executes this cleanup function before running the effect again and when the component unmounts (e.g. clearing timers or subscriptions).",
      },
    ],
  },
  {
    userId: null,
    title: "Data Structures",
    description: "Binary search trees, graphs, and Big O complexity analysis.",
    icon: "schema",
    cards: [
      {
        question: "What is the worst-case time complexity of searching in a Binary Search Tree (BST)?",
        answer: "O(N). This occurs in a skewed (unbalanced) BST, where the tree behaves like a linked list and you must traverse every node sequentially.",
      },
      {
        question: "What is the average time complexity of insertion in a balanced BST?",
        answer: "O(log N). Because the search space is divided in half at each level of a balanced tree, making it highly efficient.",
      },
      {
        question: "Which traversal of a BST yields sorted elements in ascending order?",
        answer: "In-order traversal. It visits the left subtree, then the current node, and finally the right subtree.",
      },
      {
        question: "What is the key difference between a Stack and a Queue?",
        answer: "A Stack is a Last-In, First-Out (LIFO) data structure, whereas a Queue is a First-In, First-Out (FIFO) data structure.",
      },
      {
        question: "What is the space complexity of a Depth First Search (DFS) on a graph?",
        answer: "O(V) where V is the number of vertices, representing the maximum call stack depth or visited list size in the worst case.",
      },
    ],
  },
  {
    userId: null,
    title: "Neuroscience",
    description: "Neural pathways, neurotransmitters, and cognitive functions.",
    icon: "psychology",
    cards: [
      {
        question: "What is the primary function of myelin sheaths surrounding axon fibers?",
        answer: "To insulate axons and drastically increase the speed of electrical signal transmission (action potentials) down the neuron.",
      },
      {
        question: "Which neurotransmitter is most closely linked to reward pathways and motivation?",
        answer: "Dopamine. It acts as a chemical messenger in the brain's reward centers, regulating feelings of pleasure, focus, and reinforcement.",
      },
      {
        question: "What is neuroplasticity?",
        answer: "The brain's ability to reorganize, adapt, and form new neural connections throughout life in response to learning, experience, or injury.",
      },
      {
        question: "What role does the hippocampus play in cognitive function?",
        answer: "It is critical for the formation and consolidation of new long-term memories and spatial navigation.",
      },
      {
        question: "What is a synapse?",
        answer: "The microscopic junction or gap across which a signal is transmitted chemically or electrically from one neuron to another target cell.",
      },
    ],
  },
];

/** Seed default decks helper */
const seedDefaultDecks = async () => {
  const count = await FlashcardDeck.countDocuments({ userId: null });
  if (count === 0) {
    await FlashcardDeck.create(defaultDecks);
    console.log("✅ Seeded default flashcard decks.");
  }
};

// ── GET /api/flashcards ───────────────────────────────────────
exports.getDecks = async (req, res, next) => {
  try {
    // Ensure default seeded decks are populated
    await seedDefaultDecks();

    // Find all global decks (userId: null) and user's custom decks
    const decks = await FlashcardDeck.find({
      $or: [{ userId: null }, { userId: req.user.id }],
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: decks,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/flashcards/:id ───────────────────────────────────
exports.getDeckById = async (req, res, next) => {
  try {
    const deck = await FlashcardDeck.findOne({
      _id: req.params.id,
      $or: [{ userId: null }, { userId: req.user.id }],
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: "Flashcard deck not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: deck,
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/flashcards/:id/cards/:cardId/mastery ──────────────
exports.toggleCardMastery = async (req, res, next) => {
  try {
    const deck = await FlashcardDeck.findOne({
      _id: req.params.id,
      $or: [{ userId: null }, { userId: req.user.id }],
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: "Flashcard deck not found.",
      });
    }

    const card = deck.cards.id(req.params.cardId);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Card not found in deck.",
      });
    }

    // Toggle mastery
    card.mastered = !card.mastered;
    deck.lastStudied = new Date();
    await deck.save();

    res.status(200).json({
      success: true,
      data: deck,
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/flashcards/:id ────────────────────────────────
exports.deleteDeck = async (req, res, next) => {
  try {
    const deck = await FlashcardDeck.findOne({
      _id: req.params.id,
      userId: req.user.id, // Can only delete custom decks belonging to the user
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: "Flashcard deck not found or you are not authorized to delete it.",
      });
    }

    await FlashcardDeck.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: "Deck deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/flashcards/generate ──────────────────────────────
exports.generateDeck = async (req, res, next) => {
  try {
    const { topic } = req.body;
    if (!topic || topic.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Topic is required to generate flashcards.",
      });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const isGeminiConfigured =
      geminiKey &&
      geminiKey !== "your_gemini_api_key_here" &&
      !geminiKey.startsWith("AQ.");

    let cardJson = "";

    // 1. Attempt LLM Generation using Gemini
    if (isGeminiConfigured) {
      try {
        const prompt = `Generate a set of 6 to 8 educational study flashcards about the topic: "${topic}".
Each flashcard must contain a clear, challenging conceptual question (for the card front) and a comprehensive, easy-to-understand explanation/answer (for the card back).
Return ONLY a valid JSON array matching this format (no markdown blocks, no backticks, no wrap text):
[
  {
    "question": "Concept Question?",
    "answer": "Detailed concept explanation."
  }
]`;

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
          cardJson = resData.candidates[0]?.content?.parts[0]?.text || "";
        } else {
          console.error("Gemini API returned error code:", response.status);
        }
      } catch (err) {
        console.error("Gemini Flashcard Gen Error:", err.message);
      }
    }

    // 2. Fallback to Local Mock Generation (If API not set or failed)
    if (!cardJson) {
      console.log("⚠️ Using local mock generator for topic:", topic);
      const mockCards = [
        {
          question: `What is the core definition of "${topic}"?`,
          answer: `"${topic}" refers to a key concept in this domain, encompassing its foundational theories, practical application rules, and structural syntax parameters.`,
        },
        {
          question: `Why is "${topic}" considered important for study?`,
          answer: "It allows developers or researchers to solve complex logical problems efficiently, optimize workflows, and maintain best practices within standard system architectures.",
        },
        {
          question: `What is a common real-world example of "${topic}"?`,
          answer: `An implementation of "${topic}" typically includes modular code design, schema structures, or system functions that execute reliably to handle common input flows.`,
        },
        {
          question: `What is a key pitfall or mistake people make with "${topic}"?`,
          answer: "Failing to account for edge cases, omitting proper error bounds, or misunderstanding state/variable lifetimes within standard execution contexts.",
        },
        {
          question: `How does "${topic}" relate to other adjacent topics in the same field?`,
          answer: "It serves as a modular building block, integrating with other core components to build larger structures, algorithms, or logical workflows.",
        },
      ];
      cardJson = JSON.stringify(mockCards);
    }

    // Clean any markdown wrappers if present
    let cleanJson = cardJson.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(json)?\n/, "");
      cleanJson = cleanJson.replace(/\n```$/, "");
    }

    const parsedCards = JSON.parse(cleanJson);

    // Dynamic icon assignment based on topic keywords
    let icon = "style"; // Default card stack
    const lowerTopic = topic.toLowerCase();
    if (lowerTopic.includes("js") || lowerTopic.includes("react") || lowerTopic.includes("code") || lowerTopic.includes("web") || lowerTopic.includes("program")) {
      icon = "javascript";
    } else if (lowerTopic.includes("data") || lowerTopic.includes("math") || lowerTopic.includes("struct") || lowerTopic.includes("algorithm")) {
      icon = "schema";
    } else if (lowerTopic.includes("brain") || lowerTopic.includes("neuro") || lowerTopic.includes("psych") || lowerTopic.includes("mind") || lowerTopic.includes("think")) {
      icon = "psychology";
    } else if (lowerTopic.includes("book") || lowerTopic.includes("history") || lowerTopic.includes("lit") || lowerTopic.includes("lang")) {
      icon = "auto_stories";
    }

    // Create the new Flashcard Deck
    const newDeck = await FlashcardDeck.create({
      userId: req.user.id,
      title: topic,
      description: `AI-generated review deck covering key concepts in "${topic}".`,
      icon,
      cards: parsedCards.map((c) => ({
        question: c.question,
        answer: c.answer,
        mastered: false,
      })),
    });

    res.status(201).json({
      success: true,
      data: newDeck,
    });
  } catch (error) {
    console.error("Flashcard generator error:", error);
    next(error);
  }
};
