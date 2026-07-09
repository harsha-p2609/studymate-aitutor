// ============================================================
// components/ui/Logo.jsx
// StudyMate AI brand logo with icon + name + tagline
// ============================================================

const Logo = ({ size = "default" }) => {
  const isLarge = size === "large";

  return (
    <div className="auth-logo-section">
      <div className="auth-logo-wrapper">
        {/* Brain / AI Icon */}
        <div className="auth-logo-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: isLarge ? 28 : 22, height: isLarge ? 28 : 22, color: "white" }}
            aria-hidden="true"
          >
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.16Z" />
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.16Z" />
          </svg>
        </div>

        {/* App Name */}
        <span
          className="auth-logo-name"
          style={{ fontSize: isLarge ? 26 : undefined }}
        >
          StudyMate AI
        </span>
      </div>

      {/* Tagline */}
      <p className="auth-logo-tagline">Educational Partner</p>
    </div>
  );
};

export default Logo;
