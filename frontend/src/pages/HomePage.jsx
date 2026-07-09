// ============================================================
// pages/HomePage.jsx
// Welcome home page shown after successful login
// ============================================================

import { useAuthContext } from "../context/AuthContext";
import useAuth from "../hooks/useAuth";

// ── Icons ────────────────────────────────────────────────────
const BrainIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.16Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.16Z" />
  </svg>
);

// ── Feature Card ─────────────────────────────────────────────
const FeatureCard = ({ emoji, title, description, tag }) => (
  <div style={{
    background: "white",
    borderRadius: 16,
    padding: "28px 24px",
    boxShadow: "0 4px 20px rgba(79,70,229,0.08)",
    border: "1px solid #f0f0ff",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "default",
  }}
  onMouseEnter={e => {
    e.currentTarget.style.transform = "translateY(-4px)";
    e.currentTarget.style.boxShadow = "0 8px 30px rgba(79,70,229,0.15)";
  }}
  onMouseLeave={e => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 4px 20px rgba(79,70,229,0.08)";
  }}
  >
    <div style={{ fontSize: 36 }}>{emoji}</div>
    <div>
      <h3 style={{ color: "#1e1b4b", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{title}</h3>
      <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>{description}</p>
    </div>
    <span style={{
      display: "inline-block",
      background: "#f0f2ff",
      color: "#4f46e5",
      fontSize: 11,
      fontWeight: 600,
      padding: "3px 10px",
      borderRadius: 999,
      letterSpacing: 0.5,
      alignSelf: "flex-start",
    }}>{tag}</span>
  </div>
);

// ── HomePage Component ───────────────────────────────────────
const HomePage = () => {
  const { user } = useAuthContext();
  const { handleLogout } = useAuth();

  const firstName = user?.name?.split(" ")[0] || "Student";
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "S";

  const features = [
    {
      emoji: "🤖",
      title: "AI Study Assistant",
      description: "Chat with an AI tutor trained on your study materials. Ask anything, anytime.",
      tag: "Coming Soon",
    },
    {
      emoji: "📚",
      title: "Smart Flashcards",
      description: "Generate and review flashcards automatically from your notes using AI.",
      tag: "Coming Soon",
    },
    {
      emoji: "📝",
      title: "Quiz Generator",
      description: "Auto-generate quizzes from any topic to test and reinforce your knowledge.",
      tag: "Coming Soon",
    },
    {
      emoji: "📊",
      title: "Progress Tracker",
      description: "Visualize your learning journey with detailed analytics and insights.",
      tag: "Coming Soon",
    },
    {
      emoji: "🎯",
      title: "Study Goals",
      description: "Set daily study goals and get reminders to keep you on track.",
      tag: "Coming Soon",
    },
    {
      emoji: "🌐",
      title: "Subject Library",
      description: "Explore curated study materials across Math, Science, History, and more.",
      tag: "Coming Soon",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#eef0fb", fontFamily: "Inter, sans-serif" }}>

      {/* ── Top Navigation Bar ─────────────────────────────── */}
      <nav style={{
        background: "white",
        borderBottom: "1px solid #f0f0ff",
        padding: "0 32px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 12px rgba(79,70,229,0.06)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BrainIcon />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: "#4f46e5" }}>StudyMate AI</span>
        </div>

        {/* User Menu */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Avatar */}
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name}
              style={{ width: 38, height: 38, borderRadius: "50%", border: "2px solid #4f46e5" }}
            />
          ) : (
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 700, fontSize: 14,
            }}>
              {initials}
            </div>
          )}
          <span style={{ color: "#374151", fontWeight: 500, fontSize: 14 }}>{user?.name}</span>

          {/* Logout Button */}
          <button
            id="btn-logout"
            onClick={handleLogout}
            style={{
              padding: "8px 18px",
              background: "transparent",
              border: "1.5px solid #e5e7eb",
              borderRadius: 8,
              color: "#6b7280",
              fontWeight: 500,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontFamily: "Inter, sans-serif",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "#ef4444";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.color = "#6b7280";
            }}
          >
            Log Out
          </button>
        </div>
      </nav>

      {/* ── Hero Section ──────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        padding: "60px 32px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background decoration */}
        <div style={{
          position: "absolute", top: -60, right: -60,
          width: 280, height: 280,
          background: "rgba(255,255,255,0.06)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", bottom: -40, left: -40,
          width: 200, height: 200,
          background: "rgba(255,255,255,0.04)",
          borderRadius: "50%",
        }} />

        {/* Avatar */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} style={{
              width: 80, height: 80, borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.5)",
              margin: "0 auto 16px",
              display: "block",
            }} />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              border: "3px solid rgba(255,255,255,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 700, color: "white",
              margin: "0 auto 16px",
            }}>
              {initials}
            </div>
          )}

          <h1 style={{
            fontSize: 36, fontWeight: 800, color: "white",
            margin: "0 0 10px", letterSpacing: "-0.5px",
          }}>
            Welcome back, {firstName}! 🎓
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, margin: "0 0 8px" }}>
            {user?.email}
          </p>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
            Ready to continue your AI-powered learning journey?
          </p>
        </div>
      </div>

      {/* ── Stats Bar ─────────────────────────────────────────── */}
      <div style={{
        maxWidth: 900, margin: "-24px auto 0",
        padding: "0 24px",
        position: "relative", zIndex: 10,
      }}>
        <div style={{
          background: "white",
          borderRadius: 16,
          padding: "20px 32px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 0,
          boxShadow: "0 8px 32px rgba(79,70,229,0.12)",
          border: "1px solid #f0f0ff",
        }}>
          {[
            { value: "0", label: "Topics Studied" },
            { value: "0", label: "Quizzes Taken" },
            { value: "0", label: "Study Hours" },
          ].map((stat, i) => (
            <div key={i} style={{
              textAlign: "center",
              borderRight: i < 2 ? "1px solid #f0f0ff" : "none",
              padding: "4px 0",
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#4f46e5" }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features Grid ────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: "40px auto 60px", padding: "0 24px" }}>
        <h2 style={{
          fontSize: 20, fontWeight: 700, color: "#1e1b4b",
          marginBottom: 20, textAlign: "center",
        }}>
          🚀 What's coming to StudyMate AI
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 20,
        }}>
          {features.map((feature, i) => (
            <FeatureCard key={i} {...feature} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{
          marginTop: 40, textAlign: "center",
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          borderRadius: 16, padding: "32px 24px",
          color: "white",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Authentication is Live!
          </h3>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 1.7 }}>
            Phase 1 complete. You're logged in as <strong>{user?.name}</strong>. <br />
            More features are being built — stay tuned!
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
