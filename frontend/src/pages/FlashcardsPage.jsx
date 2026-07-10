// ============================================================
// pages/FlashcardsPage.jsx
// Main Flashcards dashboard displaying seeded and custom decks
// Matches Picture 1 design
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const FlashcardsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [decks, setDecks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal and creation state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const steps = [
    "Contacting StudyMate AI...",
    "Analyzing core concepts...",
    "Drafting flashcard questions...",
    "Adding detailed explanations...",
    "Seeding database record...",
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

  // Load decks on mount
  const fetchDecks = async () => {
    try {
      setLoading(true);
      const res = await api.get("/flashcards");
      if (res.data.success) {
        setDecks(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching decks:", err);
      toast.error("Failed to load flashcard decks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();

    if (location.state?.generateTopic) {
      const topicToGen = location.state.generateTopic;
      // Clear navigation state immediately to prevent re-triggering on refresh
      navigate(location.pathname, { replace: true, state: {} });
      generateDeck(topicToGen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter decks based on search query
  const filteredDecks = decks.filter(
    (deck) =>
      deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle deck deletion (only user-created decks)
  const handleDeleteDeck = async (e, deckId) => {
    e.stopPropagation(); // Avoid triggering navigation to study session
    if (!window.confirm("Are you sure you want to delete this custom deck?")) {
      return;
    }

    try {
      const res = await api.delete(`/flashcards/${deckId}`);
      if (res.data.success) {
        setDecks((prev) => prev.filter((d) => d._id !== deckId));
        toast.success("Deck deleted successfully.");
      }
    } catch (err) {
      console.error("Error deleting deck:", err);
      toast.error("Failed to delete deck.");
    }
  };

  // Helper for generating deck
  const generateDeck = async (topicToGenerate) => {
    if (!topicToGenerate || topicToGenerate.trim() === "") {
      toast.error("Please enter a topic.");
      return;
    }

    try {
      setIsModalOpen(true);
      setIsGenerating(true);
      setLoadingStep(0);
      const res = await api.post("/flashcards/generate", { topic: topicToGenerate });
      if (res.data.success) {
        toast.success("Deck generated successfully!");
        setDecks((prev) => [res.data.data, ...prev]);
        setIsModalOpen(false);
        setTopic("");
        // Redirect to new study session immediately
        navigate(`/flashcards/study/${res.data.data._id}`);
      }
    } catch (err) {
      console.error("Error generating deck:", err);
      toast.error("Failed to generate AI flashcards. Please try again.");
      setIsModalOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle deck generation
  const handleGenerateDeck = async (e) => {
    e.preventDefault();
    generateDeck(topic);
  };

  // Helper: format time ago
  const formatTimeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "yesterday";
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center p-xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-gutter py-md pb-32 flex-grow max-w-container-max mx-auto w-full relative">
      {/* Search and Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold">Your Decks</h1>
          <p className="text-on-surface-variant font-body-md mt-xs">
            Review your mastered subjects or start a new session.
          </p>
        </div>

        <div className="flex items-center gap-sm">
          {/* Custom Search bar inside page matching Picture 1 */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              className="pl-10 pr-4 py-2.5 border border-outline-variant rounded-full bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all w-60 text-label-md font-label-md shadow-sm"
              placeholder="Search decks..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-sm py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-xs shadow-sm text-label-md"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Create New Deck
          </button>
        </div>
      </div>

      {/* Grid Layout of Decks */}
      {filteredDecks.length === 0 ? (
        <div className="bg-white border border-outline-variant rounded-2xl p-lg text-center shadow-sm">
          <span className="material-symbols-outlined text-[64px] text-outline-variant mb-sm">style</span>
          <h3 className="font-title-md text-title-md font-bold text-on-surface">No decks found</h3>
          <p className="text-on-surface-variant font-body-md mt-xs">
            Search for another term, or create your first AI-generated deck.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {filteredDecks.map((deck) => (
            <div
              key={deck._id}
              onClick={() => navigate(`/flashcards/study/${deck._id}`)}
              className="bg-white border border-outline-variant rounded-2xl p-md shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-md">
                  {/* Decorative Icon Box matching Picture 1 */}
                  {deck.icon === "javascript" ? (
                    <div className="w-10 h-10 rounded-xl bg-yellow-100 border border-yellow-200 text-yellow-800 flex items-center justify-center font-extrabold text-sm select-none">
                      JS
                    </div>
                  ) : deck.icon === "schema" ? (
                    <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px]">schema</span>
                    </div>
                  ) : deck.icon === "psychology" ? (
                    <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 text-red-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px]">psychology</span>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary-container/20 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px]">{deck.icon || "style"}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-xs">
                    <span className="px-sm py-1 bg-secondary-container/10 text-secondary border border-secondary-container/20 rounded-full text-label-sm font-label-sm font-bold">
                      {deck.cardCount} cards
                    </span>
                    {deck.userId && (
                      <button
                        onClick={(e) => handleDeleteDeck(e, deck._id)}
                        className="w-8 h-8 rounded-lg hover:bg-error-container/10 text-on-surface-variant hover:text-error transition-all flex items-center justify-center"
                        title="Delete custom deck"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-title-md text-title-md font-bold text-on-surface mb-xs group-hover:text-primary transition-colors">
                  {deck.title}
                </h3>
                <p className="text-on-surface-variant font-body-md line-clamp-3 mb-md leading-relaxed">
                  {deck.description}
                </p>
              </div>

              <div className="flex items-center gap-xs pt-sm border-t border-outline-variant/30 text-on-surface-variant font-label-sm text-[13px]">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                Last studied {formatTimeAgo(deck.lastStudied)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* "+ Create New Deck" Modal Overlay */}
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
              <form onSubmit={handleGenerateDeck}>
                <h3 className="font-title-md text-title-md font-bold text-on-surface mb-xs">
                  Create New Deck
                </h3>
                <p className="text-on-surface-variant font-body-md mb-md">
                  Type in a topic or concept you want to study. StudyMate AI will generate customized flashcards for you.
                </p>

                <div className="mb-lg">
                  <label htmlFor="topic-input" className="block text-label-sm font-label-sm text-on-surface mb-2 font-bold uppercase tracking-wider">
                    Topic / Concept
                  </label>
                  <input
                    id="topic-input"
                    type="text"
                    required
                    className="w-full px-md py-3 border border-outline-variant rounded-xl bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-body-md"
                    placeholder="e.g. Closure in JavaScript, Cellular Respiration"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-sm">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-sm py-2.5 border border-outline-variant text-on-surface hover:bg-surface-container-low transition-all font-bold rounded-xl text-label-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-md py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-xs shadow-sm text-label-md cursor-pointer"
                  >
                    Generate Deck
                    <span className="material-symbols-outlined text-[18px]">psychology</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-xl flex flex-col items-center text-center">
                <div className="w-16 h-16 relative mb-lg">
                  {/* Glowing AI Spinner */}
                  <div className="absolute inset-0 rounded-full border-4 border-primary-container/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
                  <span className="material-symbols-outlined text-[32px] text-primary absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse">
                    psychology
                  </span>
                </div>
                <h4 className="font-title-md text-title-md font-bold text-on-surface mb-xs">
                  Generating Flashcards
                </h4>
                <p className="text-primary font-label-md font-semibold animate-pulse">
                  {steps[loadingStep]}
                </p>
                <p className="text-on-surface-variant font-body-md mt-sm max-w-[280px]">
                  Using LLM to formulate conceptual questions and thorough explanations...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardsPage;
