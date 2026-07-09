// ============================================================
// server.js
// Main entry point for the StudyMate AI backend server
// ============================================================

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const connectDB = require("./config/db");
const passport = require("./config/passport");
const authRoutes = require("./routes/authRoutes");

// ── Initialize Express ──────────────────────────────────────
const app = express();

// ── Connect to MongoDB ──────────────────────────────────────
connectDB();

// ── Middleware ──────────────────────────────────────────────

// CORS — allows requests from the React frontend with dynamic localhost port support
const allowedOrigins = [process.env.CLIENT_URL].filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Allow server-to-server or curl
      const isLocalhost = origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");
      if (allowedOrigins.indexOf(origin) !== -1 || isLocalhost) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy: Access denied for this origin."));
    },
    credentials: true, // Allow cookies to be sent
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies (for HTML form submissions)
app.use(express.urlencoded({ extended: true }));

// Parse cookies from incoming requests
app.use(cookieParser());

// Session middleware — required for Passport (even with JWT strategy)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve uploaded files statically
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ──────────────────────────────────────────────────

// Health check — useful for deployment environments
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "StudyMate AI API is running 🚀",
    timestamp: new Date().toISOString(),
  });
});

// Auth routes — all mounted at /api/auth
app.use("/api/auth", authRoutes);

// Study Plan, Quiz, and Chat routes
app.use("/api/study-plan", require("./routes/studyPlanRoutes"));
app.use("/api/quizzes", require("./routes/quizRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/flashcards", require("./routes/flashcardRoutes"));

// ── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});

// ── Global Error Handler ─────────────────────────────────────
// Catches any unhandled errors thrown in route handlers
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
});

// ── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});
