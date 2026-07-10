// ============================================================
// pages/AiTutorPage.jsx
// Interactive AI Tutor chatbot canvas with conversation history,
// prompt shortcut chips, and dynamic recommendation actions
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const AiTutorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newTopic, setNewTopic] = useState("");
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  // ── Load Sessions List ──────────────────────────────────────
  const loadSessions = async (selectFirst = true) => {
    try {
      const res = await api.get("/chat/sessions");
      if (res.data.success) {
        setSessions(res.data.data);
        if (selectFirst && res.data.data.length > 0) {
          await loadSessionDetails(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error("Error loading chat sessions:", err);
      toast.error("Failed to load conversation history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions(true);
  }, []);

  // ── Handle Initial Redirect Prompts ──────────────────────────
  useEffect(() => {
    const handleInitialPrompt = async () => {
      const initialPrompt = location.state?.initialPrompt;
      if (initialPrompt && sessions.length > 0) {
        // Clear navigation state immediately to prevent loop
        navigate(location.pathname, { replace: true, state: {} });
        
        toast.loading("Starting study session...", { id: "init-prompt" });
        try {
          // 1. Create a new session for the prompt
          const createRes = await api.post("/chat/sessions", {
            topic: initialPrompt.length > 25 ? initialPrompt.slice(0, 25) + "..." : initialPrompt
          });
          
          if (createRes.data.success) {
            const newSess = createRes.data.data;
            
            // 2. Send the message
            const sendRes = await api.post(`/chat/sessions/${newSess._id}/message`, {
              text: initialPrompt
            });
            
            if (sendRes.data.success) {
              setSessions((prev) => [sendRes.data.data, ...prev.filter(s => s._id !== newSess._id)]);
              setActiveSession(sendRes.data.data);
              toast.success("AI Tutor is ready!", { id: "init-prompt" });
            }
          }
        } catch (err) {
          console.error("Error sending initial prompt:", err);
          toast.error("Failed to send prompt", { id: "init-prompt" });
        }
      }
    };

    if (!loading && sessions.length > 0) {
      handleInitialPrompt();
    }
  }, [loading, sessions, navigate, location.pathname, location.state]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages]);

  // ── Load Single Session Details ─────────────────────────────
  const loadSessionDetails = async (id) => {
    try {
      const res = await api.get(`/chat/sessions/${id}`);
      if (res.data.success) {
        setActiveSession(res.data.data);
      }
    } catch (err) {
      console.error("Error loading session:", err);
      toast.error("Failed to load conversation details");
    }
  };

  // ── Create New Session ──────────────────────────────────────
  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    try {
      const res = await api.post("/chat/sessions", { topic: newTopic });
      if (res.data.success) {
        setSessions((prev) => [res.data.data, ...prev]);
        setActiveSession(res.data.data);
        setNewTopic("");
        setShowNewTopicModal(false);
        toast.success("New chat session started");
      }
    } catch (err) {
      console.error("Error starting session:", err);
      toast.error("Failed to start session");
    }
  };

  // ── File Selection Handlers ─────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }
    setSelectedFile(file);
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ── Dynamic Quiz Generation Helper ──────────────────────────
  const generateQuizForTopic = async (topicStr) => {
    const loadingToast = toast.loading(`Generating your custom 10-question quiz about "${topicStr.slice(0, 30)}..." 🧠`);
    try {
      const res = await api.post("/quizzes/generate", { topic: topicStr });
      if (res.data.success) {
        toast.dismiss(loadingToast);
        toast.success("Quiz generated successfully! Opening in a new tab 📝");
        window.open(`/quiz/${res.data.data._id}`, "_blank");
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error("Failed to generate custom quiz:", err);
      toast.error("Failed to generate AI quiz. Please try again.");
    }
  };

  // ── Send Message ────────────────────────────────────────────
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if ((!text.trim() && !selectedFile) || !activeSession || sending) return;

    // Check if user is manually typing a quiz generation request
    const textLower = text.toLowerCase();
    if ((textLower.includes("generate quiz") || textLower === "quiz") && !textToSend) {
      const userMessages = activeSession.messages.filter(m => m.sender === "user" && !m.text.toLowerCase().includes("generate quiz") && m.text.toLowerCase() !== "quiz");
      const quizTopic = userMessages.length > 0 ? userMessages[userMessages.length - 1].text : activeSession.topic;
      
      generateQuizForTopic(quizTopic);
      setInputText("");
      handleSendMessage(`I would like to take a quiz about: "${quizTopic}".`);
      return;
    }

    let attachment = null;
    let localPreviewUrl = null;

    try {
      setSending(true);
      if (!textToSend) setInputText(""); // Clear typing box

      // If a file is selected, upload it first
      if (selectedFile) {
        setUploadingFile(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        
        const uploadRes = await api.post("/chat/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        
        if (uploadRes.data.success) {
          attachment = uploadRes.data.data;
        }
        localPreviewUrl = URL.createObjectURL(selectedFile);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }

      // Optimistically append user message to local state
      const tempSession = { ...activeSession };
      tempSession.messages.push({
        sender: "user",
        text,
        attachment: attachment ? {
          name: attachment.name,
          url: localPreviewUrl || attachment.url,
          fileType: attachment.fileType
        } : undefined,
        timestamp: new Date()
      });
      setActiveSession(tempSession);

      const res = await api.post(`/chat/sessions/${activeSession._id}/message`, {
        text,
        attachment: attachment || undefined
      });

      if (res.data.success) {
        setActiveSession(res.data.data);
        setSessions((prev) =>
          prev.map((s) => (s._id === activeSession._id ? res.data.data : s))
        );
      }
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Message failed to send");
      loadSessionDetails(activeSession._id);
    } finally {
      setSending(false);
      setUploadingFile(false);
    }
  };

  // ── Chip Shortcuts ──────────────────────────────────────────
  const handleChipClick = async (action) => {
    if (action === "quiz") {
      const userMessages = activeSession.messages.filter(m => m.sender === "user" && !m.text.toLowerCase().includes("generate quiz") && m.text.toLowerCase() !== "quiz");
      const quizTopic = userMessages.length > 0 ? userMessages[userMessages.length - 1].text : activeSession.topic;
      
      generateQuizForTopic(quizTopic);
      handleSendMessage(`I would like to take a quiz about: "${quizTopic}".`);
      return;
    }

    if (action === "flashcard") {
      const userMessages = activeSession.messages.filter(m => m.sender === "user" && !m.text.toLowerCase().includes("generate quiz") && m.text.toLowerCase() !== "quiz");
      const flashcardTopic = userMessages.length > 0 ? userMessages[userMessages.length - 1].text : activeSession.topic;
      
      navigate("/flashcards", { state: { generateTopic: flashcardTopic } });
      return;
    }

    const promptMap = {
      quiz: "Generate a quiz for me about our current topic.",
      explain: "Explain the main topic of our session in simple, easy-to-understand terms.",
      flashcard: "Create a set of flashcards for the key terms in this lesson.",
      summary: "Summarize this study session in bullet points.",
    };
    handleSendMessage(promptMap[action]);
  };

  // ── Recommendation Cards ────────────────────────────────────
  const handleRecommendationClick = (prompt) => {
    handleSendMessage(prompt);
  };

  // ── Parse Markdown Links Helper ────────────────────────────
  const parseMarkdownLinks = (text) => {
    if (!text) return "";
    
    // Matches [link text](url)
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      // Add plain text before match
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }
      // Add anchor tag link
      const linkText = match[1];
      const linkUrl = match[2];
      parts.push(
        <a
          key={matchIndex}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-bold"
        >
          {linkText}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center p-xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex overflow-hidden relative h-[calc(100vh-120px)] lg:h-[calc(100vh-73px)] pb-[60px] lg:pb-0">
      {/* Backdrop for mobile drawer */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* ── Left Column: Conversation History (Toggleable Sidebar) ────── */}
      <aside
        className={`bg-white border-r border-outline-variant flex flex-col shrink-0 transition-all duration-300 z-50
          fixed inset-y-[73px] left-0 shadow-xl lg:shadow-none lg:static lg:h-auto lg:translate-x-0
          ${sidebarOpen ? "translate-x-0 w-80 opacity-100" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:overflow-hidden lg:border-r-0"}
        `}
      >
        <div className="p-sm flex justify-between items-center border-b border-outline-variant/30">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">History</span>
          <div className="flex gap-sm">
            <button
              onClick={() => setShowNewTopicModal(true)}
              className="text-primary hover:bg-primary-container/10 p-1.5 rounded-lg transition-colors flex items-center"
              title="New Chat"
            >
              <span className="material-symbols-outlined text-[20px]">add_comment</span>
            </button>
            {/* Collapse button inside sidebar header for easy navigation */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-outline hover:bg-surface-container-high p-1.5 rounded-lg transition-colors flex items-center lg:hidden"
              title="Close Panel"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-xs py-sm space-y-base">
          {sessions.map((sess) => {
            const isActive = activeSession?._id === sess._id;
            const lastMsg = sess.messages && sess.messages.length > 0 ? sess.messages[sess.messages.length - 1] : null;
            return (
              <div
                key={sess._id}
                onClick={() => {
                  loadSessionDetails(sess._id);
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={`p-sm rounded-xl cursor-pointer transition-all ${
                  isActive
                    ? "bg-primary-container/10 border-l-4 border-primary"
                    : "hover:bg-surface-container-high border-l-4 border-transparent"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-label-md text-label-md truncate pr-xs ${isActive ? "text-primary font-bold" : "text-on-surface font-semibold"}`}>
                    {sess.topic}
                  </span>
                  <span className="text-[10px] text-outline shrink-0">
                    {sess.updatedAt ? new Date(sess.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                  </span>
                </div>
                <p className="text-label-sm text-on-surface-variant line-clamp-1">
                  {lastMsg ? lastMsg.text : "No messages yet"}
                </p>
              </div>
            );
          })}
        </div>

        <div className="p-sm border-t border-outline-variant bg-surface-container-low">
          <div className="flex items-center space-x-sm">
            <div className="w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] text-on-tertiary-container font-bold">auto_awesome</span>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface font-bold">Pro Account</p>
              <p className="text-[10px] text-on-surface-variant">Unlimited tutor credits</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right Column: Chat Canvas ───────────────────────────────── */}
      <section className="flex-grow flex flex-col relative bg-surface-bright overflow-hidden">
        {/* Chat Header with Sidebar Toggle button */}
        <div className="h-14 border-b border-outline-variant/30 flex items-center px-md gap-sm bg-white shrink-0 shadow-sm/5 z-10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
            title={sidebarOpen ? "Close history" : "Open history"}
          >
            <span className="material-symbols-outlined text-[22px]">
              {sidebarOpen ? "menu_open" : "menu"}
            </span>
          </button>
          
          <h2 className="font-title-medium text-title-medium font-bold text-on-surface truncate">
            {activeSession ? activeSession.topic : "AI Study Tutor"}
          </h2>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-sm md:p-lg space-y-lg flex flex-col">
          {activeSession ? (
            activeSession.messages.map((msg, index) => {
              const isAi = msg.sender === "ai";
              return (
                <div
                  key={index}
                  className={`max-w-4xl w-full flex items-start gap-md ${
                    isAi ? "self-start" : "self-end flex-row-reverse"
                  }`}
                >
                  {/* Avatar */}
                  {isAi ? (
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-primary-container flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-on-primary-container text-[24px]">psychology</span>
                    </div>
                  ) : (
                    <div className="w-10 h-10 shrink-0 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant flex items-center justify-center">
                      <span className="font-bold text-sm text-primary">S</span>
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`p-md rounded-2xl max-w-[85%] sm:max-w-[75%] ${
                      isAi
                        ? "bg-white border border-outline-variant shadow-sm rounded-tl-none text-on-surface"
                        : "bg-primary text-on-primary shadow-sm rounded-tr-none"
                    }`}
                  >
                    <p className="font-body-md text-body-md whitespace-pre-wrap">{parseMarkdownLinks(msg.text)}</p>

                    {msg.attachment && (
                      <div className="mt-md border-t border-outline-variant/20 pt-sm">
                        {msg.attachment.fileType.startsWith("image/") ? (
                          <a
                            href={msg.attachment.url.startsWith("blob:") ? msg.attachment.url : `${api.defaults.baseURL.replace("/api", "")}${msg.attachment.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block max-w-sm rounded-lg overflow-hidden border border-outline-variant/30 hover:opacity-90 transition-opacity"
                          >
                            <img
                              src={msg.attachment.url.startsWith("blob:") ? msg.attachment.url : `${api.defaults.baseURL.replace("/api", "")}${msg.attachment.url}`}
                              alt={msg.attachment.name}
                              className="max-h-60 object-cover"
                            />
                          </a>
                        ) : (
                          <a
                            href={msg.attachment.url.startsWith("blob:") ? msg.attachment.url : `${api.defaults.baseURL.replace("/api", "")}${msg.attachment.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-sm p-sm rounded-xl border border-outline-variant/30 transition-all active:scale-95 ${
                              isAi
                                ? "bg-surface-container-low hover:border-primary text-on-surface"
                                : "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[32px]">description</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-label-md text-label-md truncate font-semibold">
                                {msg.attachment.name}
                              </p>
                              <p className="text-[10px] opacity-70">
                                PDF Document
                              </p>
                            </div>
                            <span className="material-symbols-outlined">download</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Inject mock recommendation cards inside specific AI responses */}
                    {isAi && msg.text.includes("Quantum mechanics") && (
                      <div className="mt-lg grid grid-cols-1 sm:grid-cols-2 gap-sm">
                        <div
                          onClick={() => handleRecommendationClick("Explain Chapter 5 Wave-Particle Duality summary")}
                          className="p-sm bg-surface-container-low border border-outline-variant rounded-xl flex items-center space-x-sm cursor-pointer hover:border-primary transition-all active:scale-95"
                        >
                          <span className="material-symbols-outlined text-primary">menu_book</span>
                          <span className="font-label-md text-label-md text-on-surface font-semibold">Read Chapter 5 Summary</span>
                        </div>
                        <div
                          onClick={() => handleRecommendationClick("Give me a 3min visualization explanation of Schrödinger wave function")}
                          className="p-sm bg-surface-container-low border border-outline-variant rounded-xl flex items-center space-x-sm cursor-pointer hover:border-primary transition-all active:scale-95"
                        >
                          <span className="material-symbols-outlined text-primary">play_circle</span>
                          <span className="font-label-md text-label-md text-on-surface font-semibold">Watch 3min Visualization</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            /* Welcome / Empty State */
            <div className="max-w-3xl w-full mx-auto flex flex-col items-center justify-center py-xl text-center space-y-md my-auto px-md">
              <div className="w-16 h-16 rounded-3xl bg-primary-container flex items-center justify-center mb-md shadow-lg rotate-3">
                <span className="material-symbols-outlined text-on-primary-container text-[40px]">psychology</span>
              </div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold">Good Morning, Alex.</h3>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
                I've analyzed your curriculum. Ready to master your courses today? Create a new session or choose one from history to start!
              </p>
              <button
                type="button"
                onClick={() => setShowNewTopicModal(true)}
                className="mt-md bg-primary text-on-primary px-lg py-sm rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-xs cursor-pointer"
              >
                <span className="material-symbols-outlined">add</span>
                Start New Study Session
              </button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Message Input Box */}
        <div className="p-sm md:p-gutter bg-gradient-to-t from-surface-bright via-surface-bright to-transparent pt-lg shrink-0 border-t border-outline-variant/30">
          <div className="max-w-4xl mx-auto w-full">
            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-xs mb-md overflow-x-auto pb-2">
              <button
                onClick={() => handleChipClick("quiz")}
                disabled={!activeSession}
                className="px-sm py-xs bg-white border border-outline-variant rounded-full font-label-md text-label-md text-primary hover:bg-primary hover:text-on-primary transition-all whitespace-nowrap flex items-center gap-xs font-semibold shadow-sm active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">quiz</span>
                Generate Quiz
              </button>
              <button
                onClick={() => handleChipClick("explain")}
                disabled={!activeSession}
                className="px-sm py-xs bg-white border border-outline-variant rounded-full font-label-md text-label-md text-primary hover:bg-primary hover:text-on-primary transition-all whitespace-nowrap flex items-center gap-xs font-semibold shadow-sm active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                Explain Topic
              </button>
              <button
                onClick={() => handleChipClick("flashcard")}
                disabled={!activeSession}
                className="px-sm py-xs bg-white border border-outline-variant rounded-full font-label-md text-label-md text-primary hover:bg-primary hover:text-on-primary transition-all whitespace-nowrap flex items-center gap-xs font-semibold shadow-sm active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">style</span>
                Create Flashcards
              </button>
              <button
                onClick={() => handleChipClick("summary")}
                disabled={!activeSession}
                className="px-sm py-xs bg-white border border-outline-variant rounded-full font-label-md text-label-md text-primary hover:bg-primary hover:text-on-primary transition-all whitespace-nowrap flex items-center gap-xs font-semibold shadow-sm active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">summarize</span>
                Summarize PDF
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              className="hidden"
            />

            {/* File Attachment Preview Chip */}
            {selectedFile && (
              <div className="flex items-center gap-xs bg-surface-container-high border border-outline-variant/40 px-sm py-xs rounded-full w-max mb-sm max-w-full">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  {selectedFile.type.startsWith("image/") ? "image" : "description"}
                </span>
                <span className="font-label-sm text-label-sm truncate max-w-[200px] text-on-surface font-semibold">
                  {selectedFile.name}
                </span>
                <button
                  onClick={handleCancelFile}
                  className="text-outline hover:text-error rounded-full flex items-center"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* Input Box */}
            <div className="bg-white border border-outline-variant p-xs rounded-[24px] focus-within:ring-2 focus-within:ring-primary/20 transition-shadow shadow-sm flex items-center gap-xs">
              <button
                disabled={!activeSession || uploadingFile}
                onClick={() => fileInputRef.current?.click()}
                className="p-sm text-outline hover:text-primary transition-colors disabled:opacity-50"
                title="Attach image or PDF"
              >
                {uploadingFile ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                ) : (
                  <span className="material-symbols-outlined">attach_file</span>
                )}
              </button>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={!activeSession}
                className="flex-grow py-sm bg-transparent border-none focus:ring-0 resize-none font-body-md text-body-md outline-none max-h-32 disabled:cursor-not-allowed"
                placeholder={activeSession ? "Ask your study partner anything..." : "Start a new conversation session first..."}
                rows={1}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!activeSession || sending}
                className="bg-primary text-on-primary p-sm rounded-2xl hover:bg-primary/90 active:scale-95 transition-all shadow-md flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
            <p className="mt-xs text-center font-label-sm text-[10px] text-outline font-medium">
              StudyMate AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </section>

      {/* ── New Chat Topic Modal ────────────────────────────────────── */}
      {showNewTopicModal && (
        <div className="fixed inset-0 bg-on-background/40 backdrop-blur-sm z-[100] flex items-center justify-center p-md animate-fade-in">
          <form
            onSubmit={handleCreateSession}
            className="bg-white rounded-2xl border border-outline-variant shadow-xl max-w-md w-full p-lg text-center"
          >
            <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mx-auto mb-md">
              <span className="material-symbols-outlined text-[28px]">add_comment</span>
            </div>
            <h3 className="font-headline-lg text-headline-lg text-on-surface mb-xs font-bold">New Chat Session</h3>
            <p className="text-on-surface-variant font-body-md text-body-md mb-lg">
              Enter a subject or concept you want to study with your AI partner.
            </p>
            <input
              type="text"
              required
              placeholder="e.g. JavaScript Arrays, operating systems"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-sm py-sm text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all mb-lg"
            />
            <div className="flex gap-sm">
              <button
                type="submit"
                className="w-full py-sm bg-primary text-on-primary font-label-md text-label-md rounded-xl hover:opacity-90 font-bold active:scale-95"
              >
                Start Chat
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewTopic("");
                  setShowNewTopicModal(false);
                }}
                className="w-full py-sm border border-outline-variant text-on-surface-variant font-label-md text-label-md rounded-xl hover:bg-surface-container-low font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AiTutorPage;
