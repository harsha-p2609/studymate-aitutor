// ============================================================
// config/passport.js
// Configures Google and GitHub OAuth strategies for Passport.js
// Strategies are only registered when credentials are present
// in .env — this allows the server to start without OAuth keys.
// ============================================================

const passport = require("passport");
const User = require("../models/User");

// ── Serialize user into the session ────────────────────────
// Stores only the user ID in the session to keep it lightweight
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// ── Deserialize user from the session ──────────────────────
// Fetches the full user object using the ID stored in session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ── Google OAuth 2.0 Strategy ──────────────────────────────
// Only registered when GOOGLE_CLIENT_ID is set in .env
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require("passport-google-oauth20").Strategy;

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // User already registered via Google — just log them in
            return done(null, user);
          }

          // Check if a user with the same email already exists (email/password account)
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Link the Google ID to the existing account
            user.googleId = profile.id;
            if (!user.avatar) {
              user.avatar = profile.photos[0]?.value || null;
            }
            await user.save();
            return done(null, user);
          }

          // No existing user — create a new one
          const newUser = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            avatar: profile.photos[0]?.value || null,
            isVerified: true, // Google accounts are pre-verified
          });

          return done(null, newUser);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  console.log("✅ Google OAuth strategy registered");
}

// ── GitHub OAuth Strategy ───────────────────────────────────
// Only registered when GITHUB_CLIENT_ID is set in .env
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  const GitHubStrategy = require("passport-github2").Strategy;

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
        scope: ["user:email"], // Request email permission from GitHub
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // GitHub may return multiple emails — get the primary one
          const primaryEmail =
            profile.emails && profile.emails.length > 0
              ? profile.emails[0].value
              : null;

          // Check if user already exists with this GitHub ID
          let user = await User.findOne({ githubId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with same email
          if (primaryEmail) {
            user = await User.findOne({ email: primaryEmail });
            if (user) {
              user.githubId = profile.id;
              if (!user.avatar) {
                user.avatar = profile.photos[0]?.value || null;
              }
              await user.save();
              return done(null, user);
            }
          }

          // Create a new user
          const newUser = await User.create({
            name: profile.displayName || profile.username,
            email: primaryEmail,
            githubId: profile.id,
            avatar: profile.photos[0]?.value || null,
            isVerified: true, // GitHub accounts are pre-verified
          });

          return done(null, newUser);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  console.log("✅ GitHub OAuth strategy registered");
} else {
  console.warn("⚠️  GitHub OAuth not configured (GITHUB_CLIENT_ID missing in .env)");
}

module.exports = passport;
