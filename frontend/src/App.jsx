import { useState, useRef } from 'react';
import { generateStudyContent } from './lib/api';
import { validateResult } from './lib/validate';
import PromptInput from './components/PromptInput';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import ResultView from './components/ResultView';

/**
 * Application state machine:
 *   idle → loading → success
 *                 ↘ error → loading (retry)
 *   success → idle (reset)
 */
export default function App() {
  const [notes,   setNotes]  = useState('');
  const [mode,    setMode]   = useState(/** @type {import('./types/result').Mode} */ ('flashcards'));
  const [status,  setStatus] = useState(/** @type {import('./types/result').Status} */ ('idle'));
  const [result,  setResult] = useState(/** @type {import('./types/result').StudyResult | null} */ (null));
  const [errMsg,  setErrMsg] = useState('');

  // Stale-response guard: only the latest request is allowed to update state
  const requestIdRef      = useRef(0);
  const abortControllerRef = useRef(/** @type {AbortController | null} */ (null));

  const generate = async () => {
    if (!notes.trim()) return;

    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const id = ++requestIdRef.current;

    setStatus('loading');
    setErrMsg('');
    setResult(null);

    try {
      const data = await generateStudyContent({ notes, mode, signal: controller.signal });

      // Discard if a newer request has since fired
      if (id !== requestIdRef.current) return;

      if (!validateResult(data)) {
        throw new Error('The AI returned an unexpected data shape. Please try again.');
      }

      setResult(data);
      setStatus('success');
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (id !== requestIdRef.current) return;
      setErrMsg(err.message || 'An unexpected error occurred. Please try again.');
      setStatus('error');
    }
  };

  const reset = () => {
    abortControllerRef.current?.abort();
    setStatus('idle');
    setResult(null);
    setErrMsg('');
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

      {/* ── Main ──────────────────────────────────────────────── */}
      <main className="app__main">
        <div className="app__card">

          {/* Input always visible in idle/error, hidden during loading/success */}
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

          {/* Loading overlay */}
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

          {/* Error state */}
          {status === 'error' && (
            <>
              <div className="app__divider" />
              <ErrorState message={errMsg} onRetry={generate} />
            </>
          )}

          {/* Success — show results */}
          {status === 'success' && result && (
            <ResultView result={result} onReset={reset} />
          )}

        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="app__footer">
        <p>Powered by <strong>Groq</strong> · Built for the Flam Frontend Internship</p>
      </footer>
    </div>
  );
}
