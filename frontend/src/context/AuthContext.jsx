// ============================================================
// context/AuthContext.jsx
// Global authentication state — provides user info and auth
// actions to all components via React Context
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getCurrentUser, logoutUser } from "../services/api";

// Create the context
const AuthContext = createContext(null);

// ── AuthProvider Component ───────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // True on initial load
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ── Load user from localStorage on app start ─────────────
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("studymate_token");

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // Verify token with backend and get fresh user data
      const response = await getCurrentUser();
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch {
      // Token is invalid or expired — clear storage
      localStorage.removeItem("studymate_token");
      localStorage.removeItem("studymate_user");
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ── Login: store token and user in state + localStorage ──
  const login = (token, userData) => {
    localStorage.setItem("studymate_token", token);
    localStorage.setItem("studymate_user", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  // ── Logout: clear everything ──────────────────────────────
  const logout = async () => {
    try {
      await logoutUser(); // Notify backend (optional)
    } catch {
      // Silently fail — we'll clear client state regardless
    } finally {
      localStorage.removeItem("studymate_token");
      localStorage.removeItem("studymate_user");
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // ── Value provided to all child components ────────────────
  const contextValue = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    loadUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Custom hook for easy access ──────────────────────────────
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
