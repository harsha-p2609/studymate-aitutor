# 🧠 StudyMate AI — AI Study Tutor

> An AI-powered educational platform that personalizes your learning journey.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features — Phase 1](#features--phase-1-authentication)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
  - [Backend (.env)](#backend-env)
  - [Frontend (.env)](#frontend-env)
- [OAuth Setup Guide](#oauth-setup-guide)
  - [Google OAuth 2.0](#google-oauth-20)
  - [GitHub OAuth](#github-oauth)
- [Gmail App Password Setup](#gmail-app-password-setup)
- [API Endpoints](#api-endpoints)
- [Running the Project](#running-the-project)
- [Project Roadmap](#project-roadmap)

---

## Overview

**StudyMate AI** is a full-stack web application built as an AI-powered study tutor. It provides students with personalized learning experiences powered by AI.

**Phase 1** covers the complete Authentication Module including:
- Email/password login and registration
- Google OAuth 2.0 and GitHub OAuth login
- Forgot password via OTP sent to Gmail
- JWT-based session management

---

## Tech Stack

| Layer     | Technology                                  |
|-----------|---------------------------------------------|
| Frontend  | React 18 + Vite, React Router, React Hook Form |
| Backend   | Node.js, Express.js                         |
| Database  | MongoDB + Mongoose                          |
| Auth      | Passport.js (Google & GitHub OAuth), JWT    |
| Email     | Nodemailer (Gmail)                          |
| Styling   | Vanilla CSS with custom design system       |

---

## Project Structure

```
Ai Study Tutor/
├── frontend/                    ← React + Vite app
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/            ← Auth-specific components
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   ├── SignupForm.jsx
│   │   │   │   ├── ForgotPassword.jsx
│   │   │   │   ├── OtpVerification.jsx
│   │   │   │   ├── ResetPassword.jsx
│   │   │   │   └── OAuthButtons.jsx
│   │   │   └── ui/              ← Reusable UI components
│   │   │       ├── Button.jsx
│   │   │       ├── InputField.jsx
│   │   │       └── Logo.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx  ← Global auth state
│   │   ├── hooks/
│   │   │   └── useAuth.js       ← Custom auth hook
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── OAuthCallbackPage.jsx
│   │   │   └── DashboardPage.jsx
│   │   ├── services/
│   │   │   └── api.js           ← Axios + API functions
│   │   └── styles/
│   │       ├── index.css        ← Global styles + CSS variables
│   │       └── auth.css         ← Auth page styles
│   ├── .env
│   └── index.html
│
├── backend/                     ← Node + Express API
│   ├── config/
│   │   ├── db.js                ← MongoDB connection
│   │   └── passport.js          ← OAuth strategies
│   ├── controllers/
│   │   └── authController.js    ← Auth business logic
│   ├── middleware/
│   │   ├── authMiddleware.js    ← JWT protection
│   │   └── rateLimiter.js       ← Brute-force prevention
│   ├── models/
│   │   └── User.js              ← Mongoose User schema
│   ├── routes/
│   │   └── authRoutes.js        ← /api/auth/* routes
│   ├── utils/
│   │   ├── emailService.js      ← Nodemailer OTP emails
│   │   ├── generateOTP.js       ← Crypto OTP generator
│   │   └── jwtHelper.js         ← JWT sign/verify
│   ├── .env                     ← (create from .env.example)
│   ├── .env.example
│   └── server.js                ← Express entry point
│
├── .gitignore
└── README.md
```

---

## Features — Phase 1 (Authentication)

- ✅ **Email/Password Registration** — with bcrypt password hashing
- ✅ **Email/Password Login** — with JWT token
- ✅ **Google OAuth 2.0** — login with Google account
- ✅ **GitHub OAuth** — login with GitHub account
- ✅ **Forgot Password OTP** — 6-digit OTP via Gmail
- ✅ **OTP Verification** — with resend cooldown timer
- ✅ **Password Reset** — secure, token-gated password update
- ✅ **Route Protection** — JWT middleware for private routes
- ✅ **Rate Limiting** — brute-force protection on login + OTP
- ✅ **Password Strength Indicator** — visual feedback on signup

---

## Getting Started

### Prerequisites

Make sure you have these installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/) (local) **or** a [MongoDB Atlas](https://cloud.mongodb.com/) cluster
- A Gmail account for sending OTP emails
- Google and GitHub OAuth credentials (see setup guide below)

---

### Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create your .env file from the template
copy .env.example .env
# Then edit .env and fill in all values

# 3. Install dependencies (already done if following this guide)
npm install

# 4. Start the development server
npm run dev
```

Server will run at: `http://localhost:5000`

---

### Frontend Setup

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies (already done)
npm install

# 3. Start the development server
npm run dev
```

App will open at: `http://localhost:5173`

---

## Environment Variables

### Backend `.env`

Create `backend/.env` by copying `backend/.env.example`:

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/studymate_ai

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d

# Session
SESSION_SECRET=your_session_secret

# Frontend URL
CLIENT_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# Gmail (use App Password)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# OTP
OTP_EXPIRES_MINUTES=10
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api
```

---

## OAuth Setup Guide

### Google OAuth 2.0

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Add **Authorized redirect URIs**:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
7. Copy the **Client ID** and **Client Secret** to your `backend/.env`

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: StudyMate AI
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
4. Click **Register application**
5. Copy **Client ID** and generate a **Client Secret**
6. Add both to your `backend/.env`

---

## Gmail App Password Setup

> ⚠️ **Do NOT use your actual Gmail password.** Use an App Password instead.

1. Enable **2-Step Verification** on your Google account
2. Go to [Google Account → Security → App Passwords](https://myaccount.google.com/apppasswords)
3. Select app: **Mail**, device: **Windows Computer**
4. Google will generate a 16-character app password
5. Add it to `backend/.env` as `EMAIL_PASS`

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET`  | `/api/health` | Health check | No |
| `POST` | `/api/auth/register` | Register new user | No |
| `POST` | `/api/auth/login` | Email/password login | No |
| `POST` | `/api/auth/logout` | Logout | No |
| `POST` | `/api/auth/forgot-password` | Request OTP via email | No |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit OTP | No |
| `POST` | `/api/auth/reset-password` | Set new password | No |
| `GET`  | `/api/auth/me` | Get current user profile | ✅ JWT |
| `GET`  | `/api/auth/google` | Start Google OAuth | No |
| `GET`  | `/api/auth/google/callback` | Google OAuth callback | No |
| `GET`  | `/api/auth/github` | Start GitHub OAuth | No |
| `GET`  | `/api/auth/github/callback` | GitHub OAuth callback | No |

---

## Running the Project

Open **two terminals** simultaneously:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Then open your browser at: **http://localhost:5173**

---

## Project Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| Phase 1 | Authentication Module (Login, Signup, OAuth, OTP) | ✅ Complete |
| Phase 2 | Dashboard & Subject Management | 🔜 Coming Soon |
| Phase 3 | AI Chat Tutor (OpenAI Integration) | 🔜 Coming Soon |
| Phase 4 | Progress Tracking & Analytics | 🔜 Coming Soon |
| Phase 5 | Quiz & Assessment Module | 🔜 Coming Soon |

---

## License

This project is built for the **Huebits Internship Program**.

---

*Built with ❤️ by the StudyMate AI team*
#   s t u d y m a t e - a i t u t o r  
 