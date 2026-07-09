// ============================================================
// pages/FlashcardSessionPage.jsx
// Fullscreen study room for interactive card review (matches Picture 2)
// Includes flipping, shuffle, mastery toggle, and statistics tracker
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const FlashcardSessionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);

  // Queue state for navigation and shuffling
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Session timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Fetch deck on mount
  useEffect(() => {
    const fetchDeck = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/flashcards/${id}`);
        if (res.data.success) {
          const deckData = res.data.data;
          setDeck(deckData);
          // Initialize queue index sequence [0, 1, 2, ..., n-1]
          if (deckData.cards && deckData.cards.length > 0) {
            setQueue(deckData.cards.map((_, i) => i));
          }
        }
      } catch (err) {
        console.error("Error fetching deck details:", err);
        toast.error("Failed to load flashcard deck.");
        navigate("/flashcards");
      } finally {
        setLoading(false);
      }
    };
    fetchDeck();
  }, [id, navigate]);

  // Session timer ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format timer output (e.g. "Session started 2m ago" or "5s ago")
  const formatSessionTime = () => {
    if (secondsElapsed < 60) {
      return `${secondsElapsed}s ago`;
    }
    const mins = Math.floor(secondsElapsed / 60);
    return `${mins}m ago`;
  };

  // Keyboard Navigation Bindings
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading || !deck || deck.cards.length === 0) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          setIsFlipped((prev) => !prev);
          break;
        case "ArrowRight":
          handleNextCard();
          break;
        case "ArrowLeft":
          handlePrevCard();
          break;
        case "KeyM":
          handleToggleMastery();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!deck || !deck.cards || deck.cards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-md text-center">
        <span className="material-symbols-outlined text-[64px] text-outline mb-sm">style</span>
        <h3 className="font-headline-lg text-headline-lg font-bold text-on-surface">No cards in this deck</h3>
        <button
          onClick={() => navigate("/flashcards")}
          className="mt-md px-sm py-2 bg-primary text-on-primary font-bold rounded-lg"
        >
          Back to Decks
        </button>
      </div>
    );
  }

  const cards = deck.cards;
  const currentCardIndexInDeck = queue[queueIndex];
  const currentCard = cards[currentCardIndexInDeck];

  const totalCards = cards.length;
  const masteredCount = cards.filter((c) => c.mastered).length;
  const progressPercent = Math.round(((queueIndex + 1) / totalCards) * 100);

  // Navigation handlers
  const handleNextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setQueueIndex((prev) => (prev + 1) % totalCards);
    }, 150);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setQueueIndex((prev) => (prev - 1 + totalCards) % totalCards);
    }, 150);
  };

  // Shuffle queue handler
  const handleShuffle = () => {
    setIsFlipped(false);
    setTimeout(() => {
      const shuffled = [...queue];
      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setQueue(shuffled);
      setQueueIndex(0);
      toast.success("Deck shuffled! 🔀");
    }, 150);
  };

  // Mastery toggle handler
  const handleToggleMastery = async () => {
    try {
      const res = await api.put(`/flashcards/${id}/cards/${currentCard._id}/mastery`);
      if (res.data.success) {
        setDeck(res.data.data);
        const cardTitle = currentCard.mastered ? "Unmarked as mastered" : "Marked as mastered! 🎯";
        toast.success(cardTitle, { id: "mastery-toast" });
      }
    } catch (err) {
      console.error("Error updating card mastery:", err);
      toast.error("Failed to update card mastery.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-on-surface font-body-md antialiased flex flex-col justify-between p-md relative overflow-hidden select-none">
      {/* 3D Flip Styles injected locally to guarantee cross-browser animations */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>

      {/* Top Header Bar matching Picture 2 */}
      <header className="flex justify-between items-center w-full max-w-5xl mx-auto py-sm">
        <div className="flex items-center gap-sm">
          <button
            onClick={() => navigate("/flashcards")}
            className="w-10 h-10 rounded-full hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-center transition-colors cursor-pointer text-on-surface-variant"
            title="Close session"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <div>
            <h1 className="font-title-md text-title-md font-bold text-primary leading-tight">
              {deck.title}
            </h1>
            <p className="font-label-sm text-[12px] text-on-surface-variant mt-0.5">
              Session started {formatSessionTime()}
            </p>
          </div>
        </div>

        {/* Mastery stats and horizontal progress bar */}
        <div className="flex items-center gap-md">
          <div className="flex items-center gap-xs text-label-md font-label-md text-success font-semibold">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {masteredCount} Mastered
          </div>

          <div className="flex items-center gap-sm">
            <span className="text-label-sm text-on-surface-variant font-bold text-[13px]">
              {queueIndex + 1}/{totalCards}
            </span>
            <div className="w-24 h-2.5 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/20 hidden sm:block">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      {/* Center Flip Card matching Picture 2 */}
      <main className="flex-grow flex items-center justify-center max-w-3xl w-full mx-auto my-md perspective-1000">
        <div
          onClick={() => setIsFlipped((prev) => !prev)}
          className={`w-full max-w-2xl h-[340px] md:h-[400px] cursor-pointer relative transform-style-3d transition-transform duration-[400ms] ease-out rounded-2xl bg-white border border-outline-variant/50 shadow-sm hover:shadow-md ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* CARD FRONT: Question */}
          <div className="absolute inset-0 backface-hidden p-lg flex flex-col justify-between rounded-2xl">
            <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest font-label-sm text-outline">
              Question
            </div>

            <div className="flex-grow flex flex-col items-center justify-center text-center px-sm">
              <h2 className="font-title-md text-[20px] md:text-[23px] font-bold text-on-surface leading-snug max-w-md">
                {currentCard.question}
              </h2>
              <p className="text-[13px] text-on-surface-variant mt-md font-semibold select-none animate-pulse">
                Tap to see answer
              </p>
            </div>

            <div className="flex justify-between items-center text-on-surface-variant">
              {/* Mastery Indicator on bottom of card */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleMastery();
                }}
                className={`flex items-center gap-xs px-xs py-1 rounded-lg hover:bg-surface-container-high transition-colors ${
                  currentCard.mastered ? "text-success" : "text-outline hover:text-success"
                }`}
                title="Mark concept as mastered"
              >
                <span className="material-symbols-outlined text-[20px]" style={currentCard.mastered ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  star
                </span>
                <span className="text-[12px] font-bold uppercase tracking-wider">
                  {currentCard.mastered ? "Mastered" : "Learn"}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-outline-variant">
                Space to flip
              </div>
            </div>
          </div>

          {/* CARD BACK: Answer Explanation */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 p-lg flex flex-col justify-between rounded-2xl bg-surface-container-low">
            <div className="text-[11px] font-bold text-primary uppercase tracking-widest font-label-sm">
              Explanation
            </div>

            <div className="flex-grow flex flex-col items-center justify-center text-center px-sm overflow-y-auto max-h-[220px] md:max-h-[280px]">
              <p className="font-body-md text-[15px] md:text-[17px] text-on-surface leading-relaxed max-w-lg">
                {currentCard.answer}
              </p>
            </div>

            <div className="flex justify-between items-center text-on-surface-variant">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleMastery();
                }}
                className={`flex items-center gap-xs px-xs py-1 rounded-lg hover:bg-surface-container-high transition-colors ${
                  currentCard.mastered ? "text-success" : "text-outline hover:text-success"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" style={currentCard.mastered ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  star
                </span>
                <span className="text-[12px] font-bold uppercase tracking-wider">
                  {currentCard.mastered ? "Mastered" : "Learn"}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-outline-variant">
                Space to flip
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Navigation Bar matching Picture 2 */}
      <footer className="flex flex-col items-center justify-center py-md w-full max-w-xl mx-auto gap-md">
        <div className="flex items-center justify-center gap-lg">
          {/* Previous Card */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handlePrevCard}
              className="w-12 h-12 rounded-full border border-outline-variant/60 hover:bg-white active:scale-95 transition-all flex items-center justify-center cursor-pointer text-on-surface"
              title="Previous card"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <span className="text-[11px] text-on-surface-variant font-bold">Previous</span>
          </div>

          {/* Shuffle Card */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleShuffle}
              className="w-12 h-12 rounded-full border border-outline-variant/60 hover:bg-white active:scale-95 transition-all flex items-center justify-center cursor-pointer text-on-surface"
              title="Shuffle queue"
            >
              <span className="material-symbols-outlined text-[22px]">shuffle</span>
            </button>
            <span className="text-[11px] text-on-surface-variant font-bold">Shuffle</span>
          </div>

          {/* Next Card (Solid colored, prominent button) */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleNextCard}
              className="w-12 h-12 rounded-full bg-primary text-on-primary hover:opacity-95 active:scale-95 shadow-md transition-all flex items-center justify-center cursor-pointer"
              title="Next card"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
            </button>
            <span className="text-[11px] text-primary font-bold">Next Card</span>
          </div>
        </div>

        {/* Keyboard Helper */}
        <div className="text-[11px] text-outline font-semibold uppercase tracking-wider hidden sm:block">
          Use ← and → keys to navigate • Space to flip • M to toggle mastery
        </div>
      </footer>

      {/* Floating mini keyboard layout button on bottom-right matching Picture 2 */}
      <div className="absolute bottom-6 right-6">
        <div className="w-10 h-10 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface-variant flex items-center justify-center shadow-sm select-none" title="Study Mode Active">
          <span className="material-symbols-outlined text-[20px]">keyboard</span>
        </div>
      </div>
    </div>
  );
};

export default FlashcardSessionPage;
