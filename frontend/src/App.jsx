// ============================================================
// App.jsx
// Root component — defines all routes and wraps app in providers
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuthContext } from "./context/AuthContext";

// Layout
import Layout from "./components/ui/Layout";

// Pages
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import DashboardPage from "./pages/DashboardPage";
import StudyPlanPage from "./pages/StudyPlanPage";
import AiTutorPage from "./pages/AiTutorPage";
import QuizzesPage from "./pages/QuizzesPage";
import QuizInterfacePage from "./pages/QuizInterfacePage";
import FlashcardsPage from "./pages/FlashcardsPage";
import FlashcardSessionPage from "./pages/FlashcardSessionPage";

// ── Protected Route Component ────────────────────────────────
// Redirects unauthenticated users to login
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    // Show a loading spinner while checking auth status
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-bg)",
        }}
      >
        <div
          className="spinner"
          style={{
            width: 40,
            height: 40,
            border: "3px solid rgba(79,70,229,0.2)",
            borderTopColor: "var(--color-primary)",
          }}
        />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// ── Public Route Component ───────────────────────────────────
// Redirects already-authenticated users away from auth pages
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) return null;

  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

// ── App Routes ───────────────────────────────────────────────
const AppRoutes = () => {
  return (
    <Routes>
      {/* Root → redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />

      {/* OAuth Callback — always public */}
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

      {/* Protected Routes inside Layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/study-plan"
        element={
          <ProtectedRoute>
            <Layout>
              <StudyPlanPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-tutor"
        element={
          <ProtectedRoute>
            <Layout>
              <AiTutorPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/quizzes"
        element={
          <ProtectedRoute>
            <Layout>
              <QuizzesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <QuizInterfacePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/flashcards"
        element={
          <ProtectedRoute>
            <Layout>
              <FlashcardsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/flashcards/study/:id"
        element={
          <ProtectedRoute>
            <FlashcardSessionPage />
          </ProtectedRoute>
        }
      />

      {/* Home / Legacy redirect */}
      <Route path="/home" element={<Navigate to="/dashboard" replace />} />

      {/* 404 — catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

// ── Root App Component ───────────────────────────────────────
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Global toast notification container */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#ffffff",
              color: "#1e1b4b",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "white" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "white" },
            },
          }}
        />

        {/* Application Routes */}
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
