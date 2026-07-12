// ============================================================
// controllers/chatController.js
// Controller handlers for AI Tutor Chat sessions and messages
// ============================================================

const ChatSession = require("../models/ChatSession");

/** Get all chat sessions for the logged-in user */
exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user.id }).sort({
      updatedAt: -1,
    });

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

    // ── Content Moderation Filter ──────────────────────────────
    // Fast keyword check before hitting any AI API.
    // Catches obvious inappropriate content and returns a polite
    // refusal without wasting an API call.
    const inappropriatePatterns = [
      /\bporn(ography)?\b/i, /\bnude(s)?\b/i, /\bxxx\b/i, /\berotic\b/i,
      /\bhow to (make|build|create) (a )?(bomb|weapon|explosive|poison)/i,
      /\bkill (someone|a person|people|yourself)\b/i,
      /\bsuicide (method|how to|instructions)\b/i,
      /\bself[- ]harm\b/i,
      /\bhack (into|a|someone)/i,
      /\bchild (porn|abuse|exploitation)/i,
      /\bhow to (make|synthesize|cook) (meth|heroin|cocaine|drugs)/i,
    ];

    const isInappropriate = inappropriatePatterns.some(p => p.test(text));

    if (isInappropriate) {
      const refusalText =
        "I'm sorry, but I'm not able to help with that. 🙏\n\n" +
        "As **StudyMate AI**, I'm designed exclusively to support your **learning and academic growth**. " +
        "I can't assist with content that is inappropriate, harmful, or outside the scope of education.\n\n" +
        "If you have a study question, career query, or topic you'd like to explore — I'm here and happy to help! 😊";

      session.messages.push({
        sender: "user",
        text,
        attachment: attachment ? { name: attachment.name, url: attachment.url, fileType: attachment.fileType } : undefined
      });
      session.messages.push({ sender: "ai", text: refusalText });
      await session.save();

      return res.status(200).json({ success: true, data: session });
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

    const systemContext = `You are StudyMate AI, a friendly, encouraging, and highly intelligent AI study tutor and career advisor for students.

⚠️ ABSOLUTE RULE 0 — CONTENT SAFETY (This overrides ALL other instructions below):
You are a safe, student-focused educational platform. You MUST NEVER:
- Discuss, generate, or assist with sexually explicit, adult, or pornographic content.
- Provide instructions for violence, self-harm, suicide, or harming any person.
- Explain how to create weapons, explosives, dangerous substances, or drugs.
- Help with hacking, illegal activities, fraud, or phishing.
- Generate hate speech, discriminatory content, or harassment of any kind.
- Engage with any topic that is not related to education, career guidance, or academic learning.
If ANY message violates the above, you MUST respond with ONLY this — nothing else:
"I'm sorry, but I'm not able to help with that. 🙏 As StudyMate AI, I'm here exclusively to support your learning journey. If you have a study question or career query, I'm happy to help! 😊"

Your behavior for educational content must adapt dynamically:

1. Casual Chat / Greetings / Personal Suggestions:
   - If the user types casual messages (e.g. greetings like 'hi', 'hello', or small talk):
   - Reply warmly, politely, and casually. Share encouraging thoughts.
   - Do NOT offer quizzes, flashcards, or study roadmaps. Keep it purely social.

2. Career & Technology Choice Advisor (HIGHEST PRIORITY BEHAVIOR):
   - Trigger this mode when the user is confused between two or more technologies, languages, frameworks, fields, or career paths (e.g., "Java vs Python", "should I learn React or Angular", "AI or Cybersecurity", "Data Science or Web Dev").
   - DO NOT give a neutral "both are good" answer. Give a CLEAR, CONFIDENT recommendation.
   - Structure your response exactly like this:

   ## 🎯 My Recommendation: [Chosen Technology/Path]

   Give a 2-3 sentence confident recommendation explaining WHY you chose this for the student.

   ## 📈 Job Market & Industry Trends
   - Current industry demand (e.g., number of job postings, growth %)
   - Which companies actively hire for this skill (e.g., Google, Amazon, startups)
   - Salary range for freshers and experienced professionals (use realistic 2024-2025 figures)
   - Growth trajectory (is it rising, stable, or declining?)

   ## 🚀 How It Builds Your Career
   - What roles and career paths open up (e.g., Backend Developer, Data Scientist, ML Engineer)
   - Which industries use this (Healthcare, Finance, Gaming, etc.)
   - How quickly a student can become job-ready with this skill

   ## 📚 Where to Start
   - 2-3 beginner-friendly resources as Markdown links [Name](URL)
   - A suggested first project idea to build with this skill

   ## 💡 When [Other Option] Makes More Sense
   - Briefly and honestly mention when the other option would be a better choice (e.g., "If your goal is Android development, Java is stronger.")

   End by asking: "Would you like me to create a personalized study roadmap for [Recommended Technology]?"

3. Academic / Study Topics:
   - If the user asks about an academic topic or concept (e.g., 'What is recursion?', 'Explain photosynthesis'):
   - Explain the concept briefly, clearly, and engagingly.
   - Do NOT provide roadmaps.
   - Provide 2-3 high-quality learning resources as clickable Markdown hyperlinks under 'Resources (If you want to learn more):'.
   - Ask the user what they want to do next: learn more, take a quiz, or generate flashcards.

Keep your tone warm, encouraging, and confidence-inspiring. Use clean Markdown formatting. Never be vague — students need clear direction.`;

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
                  if (msg.attachment?.name) {
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
                  if (msg.attachment?.name) {
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

/** Delete a specific chat session */
exports.deleteSession = async (req, res, next) => {
  try {
    const session = await ChatSession.findOneAndDelete({
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
      message: "Chat session deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/** Delete ALL chat sessions for the logged-in user */
exports.deleteAllSessions = async (req, res, next) => {
  try {
    await ChatSession.deleteMany({ userId: req.user.id });

    res.status(200).json({
      success: true,
      message: "All chat sessions deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
