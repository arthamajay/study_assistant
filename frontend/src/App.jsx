import { useState, useRef, useEffect } from 'react';
import { generateStudyContent } from './lib/api';
import { validateResult } from './lib/validate';
import PromptInput from './components/PromptInput';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import ResultView from './components/ResultView';
import SessionHistory from './components/SessionHistory';

// ── sessionStorage key ───────────────────────────────────────────────────────
const STORAGE_KEY = 'studyai_session_history';

/** @returns {import('./types/result').HistoryEntry[]} */
function loadHistory() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** @param {import('./types/result').HistoryEntry[]} entries */
function saveHistory(entries) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // sessionStorage full or unavailable — fail silently
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Trim notes to a short preview string */
function makePreview(notes) {
  const trimmed = notes.trim().replace(/\s+/g, ' ');
  return trimmed.length > 60 ? trimmed.slice(0, 57) + '…' : trimmed;
}

/** Generate a unique ID for each history entry */
function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── App ───────────────────────────────────────────────────────────────────────

/**
 * State machine:
 *   idle → loading → success
 *                 ↘ error → loading (retry)
 *   success → idle (reset)
 *
 * History: stored in sessionStorage (cleared when tab closes).
 * Each entry holds the full result + quiz score once completed.
 */
export default function App() {
  const [notes,   setNotes]  = useState('');
  const [mode,    setMode]   = useState(/** @type {import('./types/result').Mode} */ ('flashcards'));
  const [status,  setStatus] = useState(/** @type {import('./types/result').Status} */ ('idle'));
  const [result,  setResult] = useState(/** @type {import('./types/result').StudyResult | null} */ (null));
  const [errMsg,  setErrMsg] = useState('');

  // History: load from sessionStorage on mount
  const [history, setHistory] = useState(/** @type {import('./types/result').HistoryEntry[]} */ (loadHistory));
  // The ID of the entry currently being viewed (null = freshly generated)
  const [activeId, setActiveId] = useState(/** @type {string | null} */ (null));

  const requestIdRef       = useRef(0);
  const abortControllerRef = useRef(/** @type {AbortController | null} */ (null));

  // Persist history to sessionStorage on every change
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  // ── Generate ─────────────────────────────────────────────────
  const generate = async () => {
    if (!notes.trim()) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const id = ++requestIdRef.current;

    setStatus('loading');
    setErrMsg('');
    setResult(null);
    setActiveId(null);

    try {
      const data = await generateStudyContent({ notes, mode, signal: controller.signal });

      if (id !== requestIdRef.current) return;

      if (!validateResult(data)) {
        throw new Error('The AI returned an unexpected data shape. Please try again.');
      }

      // Build history entry — score is null until the quiz is finished
      const entry = /** @type {import('./types/result').HistoryEntry} */ ({
        id: uid(),
        timestamp: Date.now(),
        notesPreview: makePreview(notes),
        mode,
        result: data,
        quizScore: null,
        quizTotal: data.mode === 'quiz' ? data.quiz.length : null,
      });

      setHistory((prev) => [...prev, entry]);
      setActiveId(entry.id);
      setResult(data);
      setStatus('success');
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (id !== requestIdRef.current) return;
      setErrMsg(err.message || 'An unexpected error occurred. Please try again.');
      setStatus('error');
    }
  };

  // ── Quiz complete callback ────────────────────────────────────
  const handleQuizComplete = (score, total) => {
    if (!activeId) return;
    setHistory((prev) =>
      prev.map((e) =>
        e.id === activeId ? { ...e, quizScore: score, quizTotal: total } : e
      )
    );
  };

  // ── Select a history entry to re-view ────────────────────────
  const handleSelectHistory = (entry) => {
    abortControllerRef.current?.abort();
    setStatus('success');
    setResult(entry.result);
    setActiveId(entry.id);
    setNotes('');
    setErrMsg('');
  };

  // ── Reset to idle (new study set) ────────────────────────────
  const reset = () => {
    abortControllerRef.current?.abort();
    setStatus('idle');
    setResult(null);
    setErrMsg('');
    setActiveId(null);
  };

  // ── Clear all history ─────────────────────────────────────────
  const clearHistory = () => {
    setHistory([]);
    sessionStorage.removeItem(STORAGE_KEY);
    reset();
  };

  return (
    <div className="app">
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="app__header">
        <div className="app__header-inner">
          <div className="app__logo">
            <span className="app__logo-icon">⚡</span>
            <span className="app__logo-text">StudyAI</span>
          </div>
          <p className="app__tagline">Turn any notes into flashcards or a quiz — instantly</p>
        </div>
      </header>

      {/* ── Main layout: sidebar + card ────────────────────────── */}
      <main className="app__main">
        <div className="app__layout">

          {/* History sidebar — only shown when there are entries */}
          {history.length > 0 && (
            <div className="app__sidebar">
              <SessionHistory
                history={history}
                activeId={activeId}
                onSelect={handleSelectHistory}
                onClear={clearHistory}
              />
            </div>
          )}

          {/* Main card */}
          <div className="app__card">

            {(status === 'idle' || status === 'error') && (
              <PromptInput
                notes={notes}
                mode={mode}
                isLoading={false}
                onNotesChange={setNotes}
                onModeChange={setMode}
                onSubmit={generate}
              />
            )}

            {status === 'loading' && (
              <>
                <PromptInput
                  notes={notes}
                  mode={mode}
                  isLoading={true}
                  onNotesChange={setNotes}
                  onModeChange={setMode}
                  onSubmit={generate}
                />
                <div className="app__divider" />
                <LoadingState mode={mode} />
              </>
            )}

            {status === 'error' && (
              <>
                <div className="app__divider" />
                <ErrorState message={errMsg} onRetry={generate} />
              </>
            )}

            {status === 'success' && result && (
              <ResultView
                result={result}
                onReset={reset}
                onQuizComplete={handleQuizComplete}
              />
            )}

          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="app__footer">
        <p>Powered by <strong>Groq</strong> · Built for the Flam Frontend Internship</p>
      </footer>
    </div>
  );
}
