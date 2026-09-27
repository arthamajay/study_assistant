# StudyAI — AI-Powered Study Assistant

> Flam Frontend Internship Assignment — Study Assistant

Turn any block of notes or a topic into interactive **flashcards** or a **quiz** in seconds, powered by an LLM.

---

## Demo

Paste your notes → pick Flashcards or Quiz → hit Generate.

**Flashcards:** 3D flip card, mark "Got it / Still learning", progress bar, keyboard navigation (← → Space).  
**Quiz:** A/B/C/D multiple choice, instant correct/incorrect feedback with explanation, score ring, retest wrong answers.

---

## Setup & Running Locally

### Prerequisites
- Node.js ≥ 18
- A free [Groq API key](https://console.groq.com)

### 1. Clone & install

```bash
git clone <your-repo-url>
cd study_assisstant

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Configure the API key

```bash
cd backend
cp .env.example .env
# Open .env and set your GROQ_API_KEY
```

### 3. Run

Open **two terminals**:

```bash
# Terminal 1 — backend (port 4000)
cd backend
npm start

# Terminal 2 — frontend (port 5173)
cd frontend
npm run dev
```

Then open **http://localhost:5173**.

---

## Project Structure

```
study_assisstant/
├── backend/
│   ├── index.js          # Express proxy — holds API key, calls Groq, validates schema
│   ├── .env              # Secret key (git-ignored)
│   └── .env.example      # Template
└── frontend/
    └── src/
        ├── components/
        │   ├── PromptInput.jsx   # Free-form text input + mode toggle
        │   ├── LoadingState.jsx  # Bouncing-orb animation
        │   ├── ErrorState.jsx    # Error + retry button
        │   ├── FlashcardDeck.jsx # 3D flip card with known/unknown tracking
        │   ├── Quiz.jsx          # MCQ with scoring, retest, SVG ring summary
        │   └── ResultView.jsx    # Routes parsed data to the right component
        ├── lib/
        │   ├── api.js            # Only place frontend talks to the backend proxy
        │   └── validate.js       # Schema validator (mirrors backend)
        ├── types/result.js       # JSDoc type definitions
        └── App.jsx               # State machine: idle → loading → success/error
```

---

## Architecture Decisions

### Why a backend proxy?
The Groq API key lives exclusively in `backend/.env` — it is never shipped to the browser. All LLM calls go through `POST /generate`.

### Structured output
The backend sends a strict JSON schema in the prompt and uses `response_format: { type: "json_object" }`. The response is validated on both the backend (before sending) and the frontend (before rendering). Any mismatch routes to an error state — the UI never crashes on bad AI output.

### Failure modes handled
| Failure | How it's handled |
|---------|-----------------|
| Malformed JSON from AI | `try/catch` around `JSON.parse`, 500 error returned |
| Wrong schema shape | Structural validator on both ends, error state shown |
| Empty AI response | Checked explicitly, 500 error returned |
| Slow response (>25s) | `AbortController` timeout, 504 error shown |
| Failed network request | Caught, user-friendly message shown, retry offered |
| Stale response (rapid submits) | `requestIdRef` counter — newer request discards older result |
| User clicks Submit rapidly | `AbortController` cancels previous in-flight request |

### State machine
```
idle → loading → success
              ↘ error → loading (retry)
success → idle (reset)
```

---

## Features

- **Flashcards** — 3D CSS `perspective`/`rotateY` flip animation, "Got it ✓ / Still learning ✗" tracking, progress bar, summary, keyboard navigation (← → Space/Enter)
- **Quiz** — A/B/C/D letter badges, correct answer pulses green, wrong answer shakes red, explanation panel, SVG ring score chart, "Retest wrong answers" button, Enter key to advance
- Dark mode auto-detect via `prefers-color-scheme`
- Fully mobile-responsive (tested at 375px)
- `Ctrl+Enter` shortcut to generate from the textarea
- Accessible: `aria-label`, `aria-pressed`, `role`, `aria-live` on all interactive elements

---

## Known Limitations

- **Groq API key must be refreshed** if the free-tier key expires (the app shows a clear error message and retry).
- The LLM occasionally returns fewer flashcards/questions than requested — the validator catches malformed output but cannot force a minimum count beyond rejecting empty arrays.
- No session persistence — refreshing the page loses the current deck/quiz. (Would add `localStorage` save/load as a next step.)
- No streaming — the full response arrives at once. (Would use `ReadableStream` / SSE as a next step.)

---

## AI Usage Note

I used **Kiro AI** (an AI-powered IDE assistant) to help scaffold the project structure, write boilerplate CSS, and suggest implementation patterns. All architectural decisions, state machine design, error-handling strategy, component API design, and the final code were reviewed, understood, and authored by me. I can explain every line of this codebase.

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
| Error handling & edge cases | ~45 min |
| README + polish | ~30 min |
| **Total** | **~7.25 hrs** |
