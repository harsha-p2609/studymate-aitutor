// ============================================================
// controllers/chatController.js
// Controller handlers for AI Tutor Chat sessions and messages
// ============================================================

const ChatSession = require("../models/ChatSession");

/** Get all chat sessions for the logged-in user */
exports.getSessions = async (req, res, next) => {
  try {
    let sessions = await ChatSession.find({ userId: req.user.id }).sort({ updatedAt: -1 });

    // Seed default historical sessions if user has none
    if (sessions.length === 0) {
      sessions = await ChatSession.create([
        {
          userId: req.user.id,
          topic: "Quantum Mechanics Basics",
          messages: [
            { sender: "ai", text: "Quantum mechanics is a fundamental theory in physics that provides a description of the physical properties of nature at the scale of atoms and subatomic particles. Would you like me to focus on Wave-Particle Duality or the Schrödinger Equation first?" },
            { sender: "user", text: "Can you explain the observer effect? I find it confusing how looking at something changes it." },
            { sender: "ai", text: "The observer effect in quantum mechanics states that the act of observation inevitably alters the system being measured. In classical physics, we assume we can measure a system without affecting it. However, in the quantum realm, particles like electrons behave as waves of probability. To 'look' at an electron, we must bounce a photon off it, which transfers energy and collapses its wave function from a spread-out set of probabilities into a single definite state! So, the observer is not just a passive recorder, but an active participant. Would you like to see how this relates to the Double-Slit Experiment or Heisenberg's Uncertainty Principle?" }
          ]
        },
        {
          userId: req.user.id,
          topic: "Calculus II: Integration",
          messages: [
            { sender: "ai", text: "Integration is the process of finding the area under a curve. Let's work on Calculus II topics! Do you have any specific integration problems you want to solve?" },
            { sender: "user", text: "Help me solve the partial fraction problem." },
            { sender: "ai", text: "To solve an integral using partial fractions, we decompose a rational function into simpler terms that are easy to integrate. For example, if you have 1 / (x^2 - x), we factor the denominator to x(x - 1) and rewrite it as A/x + B/(x-1). Then we solve for A and B. Would you like to work through a specific problem together?" }
          ]
        },
        {
          userId: req.user.id,
          topic: "Neuroscience Lecture 4",
          messages: [
            { sender: "ai", text: "Hi! Let's study Neuroscience. We can review synapse transmissions and neurons." }
          ]
        },
        {
          userId: req.user.id,
          topic: "Modern Art Movements",
          messages: [
            { sender: "ai", text: "Welcome! Let's talk about Modern Art Movements like Surrealism, Cubism, or Dadaism." }
          ]
        }
      ]);
    }

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

/** Create a new chat session */
exports.createSession = async (req, res, next) => {
  try {
    const { topic } = req.body;

    // Dynamically update user's StudyPlan/Roadmap to match the new session topic
    try {
      const { updateStudyPlanForTopic } = require("./studyPlanController");
      await updateStudyPlanForTopic(req.user.id, topic || "New Study Session");
    } catch (err) {
      console.error("Failed to dynamically update study plan:", err);
    }

    const newSession = await ChatSession.create({
      userId: req.user.id,
      topic: topic || "New Study Session",
      messages: [
        {
          sender: "ai",
          text: `Hello! I'm your StudyMate AI Tutor. I'm ready to help you learn about "${topic || "New Study Session"}". What questions can I answer for you?`,
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: newSession,
    });
  } catch (error) {
    next(error);
  }
};

/** Get details and messages for a specific session */
exports.getSessionById = async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/** Post a new message to a session and get a smart mock AI reply */
exports.sendMessage = async (req, res, next) => {
  try {
    const { text, attachment } = req.body;
    const sessionId = req.params.id;

    if (!text || text.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Message text is required",
      });
    }

    const session = await ChatSession.findOne({
      _id: sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    // Add user message
    session.messages.push({
      sender: "user",
      text,
      attachment: attachment ? {
        name: attachment.name,
        url: attachment.url,
        fileType: attachment.fileType
      } : undefined
    });
    // Generate response (Real Groq API, Gemini API, or fallback Mock)
    let aiText = "";
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    const isGroqConfigured = groqKey && groqKey !== "your_groq_api_key_here";
    const isGeminiConfigured = geminiKey && geminiKey !== "your_gemini_api_key_here" && !geminiKey.startsWith("AQ.");

    const systemContext = `You are StudyMate AI, a friendly, encouraging, and highly intelligent AI study tutor.

Your behavior must adapt dynamically depending on the user's input type:
1. Casual Chat / Greetings / Personal Suggestions:
   - If the user types casual messages (e.g. greetings like 'hi', 'hello', or small talk, or asks for personal life/study tips or suggestions):
   - Reply warmly, politely, and casually. Share encouraging thoughts or give personal study suggestions.
   - Do NOT offer quizzes, flashcards, or study roadmaps. Keep the talk purely social and supportive.

2. Academic / Study Topics:
   - If the user asks about an academic topic, study question, or concept (e.g., 'What is recursion?', 'Explain photosynthesis', 'Machine learning'):
   - Explain the concept briefly, clearly, and engagingly.
   - Do NOT provide roadmaps.
   - Provide 2-3 high-quality learning resources (as clickable Markdown hyperlinks, e.g. [Resource Name](URL)) under a heading 'Resources (If you want to learn more):'.
   - Finally, explicitly ask the user what they want to do next: whether they want to learn more details, take a quiz on this topic, or generate a deck of flashcards.

Keep your tone warm, encouraging, and helpful. Use clean Markdown formatting.`;

    if (isGroqConfigured) {
      try {
        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [
                {
                  role: "system",
                  content: systemContext
                },
                ...session.messages.slice(-6).map(msg => {
                  let contentText = msg.text;
                  if (msg.attachment) {
                    contentText = `[User attached file: ${msg.attachment.name} (${msg.attachment.fileType})]\n\n${msg.text}`;
                  }
                  return {
                    role: msg.sender === "user" ? "user" : "assistant",
                    content: contentText
                  };
                })
              ]
            })
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Groq API returned status ${response.status}: ${errText}`);
        }

        const resData = await response.json();
        if (resData.choices && resData.choices[0]?.message?.content) {
          aiText = resData.choices[0].message.content;
        } else {
          throw new Error("Invalid response format from Groq API");
        }
      } catch (err) {
        console.error("Groq API Error:", err.message);
        aiText = `[Tutor offline mode - Connection failed] I had trouble connecting to the Groq network. Here is a localized response:\n\n`;
      }
    } else if (isGeminiConfigured) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: `SYSTEM CONTEXT: ${systemContext} Please reply as StudyMate AI.` }]
                },
                {
                  role: "model",
                  parts: [{ text: "Understood. I will act as StudyMate AI, your dedicated study tutor, helping you learn and master your curriculum with concise, structured guidance, adapting politely between casual/personal interactions and academic study queries. Let's begin!" }]
                },
                ...session.messages.slice(-6).map(msg => {
                  let contentText = msg.text;
                  if (msg.attachment) {
                    contentText = `[User attached file: ${msg.attachment.name} (${msg.attachment.fileType})]\n\n${msg.text}`;
                  }
                  return {
                    role: msg.sender === "user" ? "user" : "model",
                    parts: [{ text: contentText }]
                  };
                })
              ]
            })
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
        }

        const resData = await response.json();
        if (resData.candidates && resData.candidates[0]?.content?.parts[0]?.text) {
          aiText = resData.candidates[0].content.parts[0].text;
        } else {
          throw new Error("Invalid response format from Gemini API");
        }
      } catch (err) {
        console.error("Gemini API Error:", err.message);
        aiText = `[Tutor offline mode - Connection failed] I had trouble connecting to the Gemini network. Here is a localized response:\n\n`;
      }
    }

    // Fallback Mock responder (if Gemini/Groq not configured or failed)
    if (!aiText || aiText.startsWith("[Tutor offline mode")) {
      const prefix = aiText.startsWith("[Tutor offline mode") ? aiText : "";
      const cleanText = text.toLowerCase().trim();
      const isCasual = /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|how are you|how's it going|what's up|thanks|thank you|bye|goodbye)/i.test(cleanText);
      const isPersonalTips = cleanText.includes("overwhelmed") || cleanText.includes("anxious") || cleanText.includes("study tips") || cleanText.includes("advice") || cleanText.includes("help") || cleanText.includes("suggest");
      
      if (isCasual) {
        aiText = prefix + "Hello there! I'm your StudyMate AI Tutor. I'm here to chat, support your learning journey, and share thoughts. What is on your mind today?";
      } else if (isPersonalTips) {
        aiText = prefix + "I completely understand that studying can feel overwhelming at times! My advice is to break your tasks down into tiny, manageable steps, use the Pomodoro timer on your study plan page to study in short 25-minute bursts, and take frequent, healthy breaks. Remember to get enough sleep, drink water, and keep a positive mindset. You've got this! How are you feeling about your subjects right now?";
      } else if (cleanText.includes("observer effect") || cleanText.includes("observe")) {
        aiText = prefix + "The observer effect in quantum mechanics states that the act of measurement alters the system. In the quantum realm, particles like electrons behave as waves of probability until observed. Bouncing a photon off an electron transfers energy and collapses its wave function from a spread of probabilities into a single definite state!\n\nResources (If you want to learn more):\n- [Quantum Observer Effect Guide](https://en.wikipedia.org/wiki/Observer_effect_(physics))\n\nWould you like to learn more details, take a quiz on this topic, or generate a deck of study flashcards?";
      } else if (cleanText.includes("schrödinger") || cleanText.includes("schrodinger")) {
        aiText = prefix + "The Schrödinger Equation (Hψ = Eψ) calculates the wave function ψ of a quantum system, telling us the probability of finding a particle at a given point in space and time. It is the quantum equivalent of Newton's second law of motion!\n\nResources (If you want to learn more):\n- [Schrödinger Equation Details](https://en.wikipedia.org/wiki/Schr%C3%B6dinger_equation)\n\nWould you like to learn more details, take a quiz on this topic, or generate a deck of study flashcards?";
      } else if (cleanText.includes("binary search tree") || cleanText.includes("bst") || cleanText.includes("tree")) {
        aiText = prefix + "A Binary Search Tree (BST) stores elements hierarchically. For any node, all keys in its left subtree are smaller, and all in its right subtree are larger. In a skewed tree, searching degrades to O(N) because it acts like a linked list. In a balanced tree, searching is O(log N) since each comparison discards half the nodes!\n\nResources (If you want to learn more):\n- [Binary Search Trees (BST) Introduction](https://www.geeksforgeeks.org/binary-search-tree-data-structure/)\n\nWould you like to learn more details, take a quiz on this topic, or generate a deck of study flashcards?";
      } else if (cleanText.includes("quiz") || cleanText.includes("generate quiz")) {
        aiText = prefix + "Sure! I can generate a custom quiz for you. Click the 'Generate Quiz' chip below to get a custom assessment!";
      } else if (cleanText.includes("flashcard") || cleanText.includes("flashcards")) {
        aiText = prefix + "I can extract flashcards from our conversation! Click the 'Create Flashcards' chip below to generate a new custom deck automatically!";
      } else if (cleanText.includes("summarize") || cleanText.includes("summary")) {
        aiText = prefix + "I can summarize topics for you! Here is a summary of **Advanced React State Management**:\n- **Context API**: Great for low-frequency global updates (themes, authentication).\n- **Redux Toolkit**: Ideal for high-frequency slices with structured reducers.\n- **Performance**: Prevent unnecessary re-renders using `useMemo` and `useCallback`.\n\nWould you like to learn more details, take a quiz on this topic, or generate a deck of study flashcards?";
      } else {
        aiText = prefix + `I've analyzed our discussion on "${session.topic}". It's a fascinating subject! Let's explore. What specific concepts or questions do you have? Also, would you like to take a quiz or generate a deck of flashcards for it?`;
      }
    }

    // Add AI message
    session.messages.push({
      sender: "ai",
      text: aiText,
    });

    await session.save();

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/** Upload a file attachment for a chat message */
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
      success: true,
      data: {
        name: req.file.originalname,
        url: fileUrl,
        fileType: req.file.mimetype,
      },
    });
  } catch (error) {
    next(error);
  }
};
