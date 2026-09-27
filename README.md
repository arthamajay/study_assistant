# ⚡ StudyAI — AI-Powered Study Assistant

> Flam Frontend Internship Assignment — Study Assistant track

Turn any block of notes or a topic into interactive **flashcards** or a **quiz** in seconds, powered by Groq's LLM API.

**Live demo:** _[add your deployed URL here]_

---

## Features

- **Flashcards** — 3D CSS flip animation, "Got it ✓ / Still learning ✗" tracking, progress bar, keyboard navigation (← → Space)
- **Quiz** — A/B/C/D multiple choice, correct answer pulses green, wrong answer shakes red, explanation panel, SVG ring score chart, retest wrong answers
- **Session history** — every quiz/flashcard set from the current tab is listed in a sidebar; click any entry to re-view it; scores are saved once a quiz is completed; all history is wiped when the tab is closed (`sessionStorage`)
- Dark mode auto-detect (`prefers-color-scheme`)
- Fully mobile-responsive (tested at 375 px)
- `Ctrl + Enter` shortcut to generate from the textarea
- Full error handling — malformed JSON, wrong shape, empty, slow (25 s timeout), stale-response guard

---

## Project Structure

```
study_assisstant/
├── backend/                        # Express proxy — holds the API key
│   ├── index.js                    # Single /generate endpoint + /health
│   ├── package.json
│   ├── .env                        # Secret keys — git-ignored
│   └── .env.example                # Template — commit this
│
├── frontend/                       # React + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── PromptInput.jsx     # Free-form text input + mode toggle
│   │   │   ├── LoadingState.jsx    # Bouncing-orb animation
│   │   │   ├── ErrorState.jsx      # Error message + retry button
│   │   │   ├── FlashcardDeck.jsx   # 3D flip card with known/unknown tracking
│   │   │   ├── Quiz.jsx            # MCQ with scoring, retest, SVG ring summary
│   │   │   ├── ResultView.jsx      # Routes parsed data to the right component
│   │   │   └── SessionHistory.jsx  # Sidebar showing this-session history
│   │   ├── lib/
│   │   │   ├── api.js              # Only place frontend talks to the backend
│   │   │   └── validate.js         # Schema validator (mirrors backend)
│   │   ├── types/result.js         # JSDoc type definitions
│   │   └── App.jsx                 # State machine + sessionStorage logic
│   ├── .env.example                # Template for VITE_API_URL
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## Quick Start (Local)

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Groq API key | free at [console.groq.com](https://console.groq.com) |

### 1 — Clone

```bash
git clone https://github.com/your-username/study_assisstant.git
cd study_assisstant
```

### 2 — Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `backend/.env` and set your key:

```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
```

Start the backend:

```bash
npm start          # production
# or
npm run dev        # development — auto-restarts on file change (Node ≥ 18)
```

Backend runs at **http://localhost:4000**

### 3 — Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

> The frontend defaults to `http://localhost:4000` for the API — no extra config needed locally.

---

## Deployment

### Backend → Render (free tier)

1. Push your repo to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service** → connect your repo.
3. Settings:
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Environment:** Node
4. Add environment variables:
   - `GROQ_API_KEY` → your Groq key
   - `FRONTEND_URL` → your Vercel/Netlify URL (e.g. `https://studyai.vercel.app`)
5. Deploy. Copy the service URL (e.g. `https://studyai-backend.onrender.com`).

### Frontend → Vercel (free tier)

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo.
2. Settings:
   - **Root directory:** `frontend`
   - **Framework preset:** Vite (auto-detected)
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. Add environment variable:
   - `VITE_API_URL` → your Render backend URL (e.g. `https://studyai-backend.onrender.com`)
4. Deploy. Done.

### Frontend → Netlify (alternative)

1. Go to [netlify.com](https://netlify.com) → **Add new site** → import from Git.
2. Settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
3. Add environment variable: `VITE_API_URL` → your Render URL.
4. Deploy.

> **Important:** After deploying both, go back to your Render backend and set `FRONTEND_URL` to your live frontend URL so the CORS whitelist is correct.

---

## Environment Variables Reference

### `backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ | Your Groq API key from console.groq.com |
| `PORT` | optional | Port to listen on (default: `4000`) |
| `FRONTEND_URL` | production | Your deployed frontend URL for CORS (e.g. `https://studyai.vercel.app`) |

### `frontend/.env.local`

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | production | Your deployed backend URL (e.g. `https://studyai-backend.onrender.com`) |

---

## Architecture

```
Browser (React SPA)
   │
   │  POST /generate   (notes + mode)
   ▼
Express backend proxy          ← API key lives here only
   │
   │  POST to Groq API
   ▼
Groq LLM (openai/gpt-oss-120b)
   │
   │  JSON response
   ▼
Backend validates schema
   │
   │  Validated JSON
   ▼
Frontend validates again → renders FlashcardDeck or Quiz
```

### Failure modes handled

| Failure | Handling |
|---------|---------|
| Malformed JSON from AI | `try/catch` around `JSON.parse`, 500 returned |
| Wrong schema shape | Structural validator on both backend and frontend |
| Empty AI response | Checked explicitly, 500 returned |
| Slow response > 25 s | `AbortController` timeout → 504, shown to user |
| Failed network request | Caught, friendly message, retry button offered |
| Stale response (rapid submits) | `requestIdRef` counter — older result discarded |
| Rapid re-submits | `AbortController` cancels previous in-flight request |

---

## AI Usage Note

I used **Kiro AI** (an AI-powered IDE assistant) to help scaffold the project structure, suggest component patterns, and write repetitive CSS boilerplate. All architectural decisions — the state machine design, error-handling strategy, the sessionStorage history approach, component API design, and deployment configuration — were made and fully understood by me. I can explain every line of this codebase.

---

## Known Limitations

- **Groq API key must be valid** — the app shows a clear error and retry if the key expires.
- No session persistence across tabs — by design (uses `sessionStorage`).
- No streaming — the full response arrives at once. Next step: `ReadableStream` / SSE.
- Flashcard "Got it / Still learning" marks are not persisted to history — only quiz scores are.

---

## Time Spent

| Phase | Time |
|-------|------|
| Architecture & data shape design | ~45 min |
| Backend proxy + prompt + validator | ~45 min |
| Frontend component structure | ~1 hr |
| FlashcardDeck (3D flip, tracking) | ~1 hr |
| Quiz (MCQ, scoring, retest) | ~1 hr |
| CSS / design system / dark mode | ~1.5 hr |
| Session history feature | ~45 min |
| Error handling & edge cases | ~45 min |
| Deployment config + README | ~30 min |
| **Total** | **~8 hrs** |
