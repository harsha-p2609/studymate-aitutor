// ============================================================
// components/auth/OAuthButtons.jsx
// Google and GitHub OAuth login buttons
// Clicking calls backend — if credentials not configured,
// shows a friendly toast error instead of a broken page.
// ============================================================

import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Google Icon ──────────────────────────────────────────────
const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

// ── OAuthButtons Component ───────────────────────────────────
const OAuthButtons = () => {

  /**
   * Check if the backend OAuth route is available before redirecting.
   * If credentials are not configured, show a friendly error toast.
   */
  const handleOAuthLogin = async (provider) => {
    const oauthUrl = `${API_BASE_URL}/auth/${provider}`;

    try {
      // Ping the route first to check if it's configured
      const res = await fetch(oauthUrl, {
        method: "GET",
        redirect: "manual", // Don't follow redirect — just check the response
      });

      // If backend returns a redirect (302), OAuth is configured → go ahead
      if (res.type === "opaqueredirect" || res.status === 302 || res.ok) {
        window.location.href = oauthUrl;
        return;
      }

      // Backend returned an error — show the message
      let data;
      try {
        data = await res.json();
      } catch {
        data = { message: `${provider} login is not configured yet.` };
      }

      toast.error(data.message || `${provider} OAuth is not set up yet.`, {
        duration: 5000,
      });
    } catch {
      // Network error or backend down — just redirect and let server handle it
      window.location.href = oauthUrl;
    }
  };

  return (
    <div className="oauth-buttons">
      {/* Google OAuth Button */}
      <button
        id="btn-google-oauth"
        type="button"
        className="btn-oauth"
        onClick={() => handleOAuthLogin("google")}
        aria-label="Continue with Google"
      >
        <GoogleIcon />
        Google
      </button>
    </div>
  );
};

export default OAuthButtons;
