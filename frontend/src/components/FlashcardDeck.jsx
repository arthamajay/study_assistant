import { useState, useCallback } from 'react';
import './FlashcardDeck.css';

/**
 * @param {{ cards: import('../types/result').Flashcard[] }} props
 */
export default function FlashcardDeck({ cards }) {
  const [index, setIndex]   = useState(0);
  const [flipped, setFlipped] = useState(false);
  // track which card indices the user marked as known/unknown
  const [known, setKnown]   = useState(/** @type {Set<number>} */ (new Set()));
  const [unknown, setUnknown] = useState(/** @type {Set<number>} */ (new Set()));

  const total = cards.length;
  const current = cards[index];

  const goTo = useCallback((next) => {
    setFlipped(false);
    // small delay so the card flips back before sliding to next
    setTimeout(() => setIndex(next), 150);
  }, []);

  const prev = () => goTo((index - 1 + total) % total);
  const next = () => goTo((index + 1) % total);

  const markKnown = () => {
    setKnown((s) => new Set([...s, index]));
    setUnknown((s) => { const n = new Set(s); n.delete(index); return n; });
    if (index < total - 1) next();
  };

  const markUnknown = () => {
    setUnknown((s) => new Set([...s, index]));
    setKnown((s) => { const n = new Set(s); n.delete(index); return n; });
    if (index < total - 1) next();
  };

  const reset = () => {
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setUnknown(new Set());
  };

  const knownCount   = known.size;
  const unknownCount = unknown.size;
  const progress     = Math.round(((knownCount + unknownCount) / total) * 100);

  const cardState = known.has(index) ? 'known' : unknown.has(index) ? 'unknown' : 'neutral';

  return (
    <div className="deck">
      {/* ── Progress bar ── */}
      <div className="deck__meta">
        <span className="deck__counter">{index + 1} / {total}</span>
        <div className="deck__progress-wrap">
          <div className="deck__progress-bar">
            <div
              className="deck__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="deck__progress-label">{progress}% reviewed</span>
        </div>
        <div className="deck__stats">
          <span className="deck__stat deck__stat--known">✓ {knownCount}</span>
          <span className="deck__stat deck__stat--unknown">✗ {unknownCount}</span>
        </div>
      </div>

      {/* ── 3-D flip card ── */}
      <div
        className={`deck__scene`}
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        aria-label={flipped ? 'Card back — click to flip' : 'Card front — click to flip'}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFlipped((f) => !f); }}
      >
        <div className={`deck__card deck__card--${cardState}${flipped ? ' flipped' : ''}`}>
          {/* Front */}
          <div className="deck__face deck__face--front">
            <span className="deck__face-tag">TERM</span>
            <p className="deck__face-text">{current.front}</p>
            <span className="deck__face-hint">Click to reveal answer</span>
          </div>
          {/* Back */}
          <div className="deck__face deck__face--back">
            <span className="deck__face-tag">DEFINITION</span>
            <p className="deck__face-text">{current.back}</p>
            <span className="deck__face-hint">Click to flip back</span>
          </div>
        </div>
      </div>

      {/* ── Know / Don't know ── */}
      <div className="deck__judgement">
        <button
          className="deck__judge-btn deck__judge-btn--unknown"
          onClick={markUnknown}
          aria-label="Mark as still learning"
        >
          ✗ Still learning
        </button>
        <button
          className="deck__judge-btn deck__judge-btn--known"
          onClick={markKnown}
          aria-label="Mark as known"
        >
          ✓ Got it
        </button>
      </div>

      {/* ── Navigation ── */}
      <div className="deck__nav">
        <button className="deck__nav-btn" onClick={prev} aria-label="Previous card">
          ← Prev
        </button>
        <button className="deck__nav-btn deck__nav-btn--reset" onClick={reset} aria-label="Reset deck">
          ↺ Reset
        </button>
        <button className="deck__nav-btn" onClick={next} aria-label="Next card">
          Next →
        </button>
      </div>

      {/* ── All reviewed summary ── */}
      {knownCount + unknownCount === total && (
        <div className="deck__summary" role="status">
          <span className="deck__summary-icon">🎉</span>
          <p>
            You reviewed all {total} cards —&nbsp;
            <strong className="known-text">{knownCount} known</strong>,&nbsp;
            <strong className="unknown-text">{unknownCount} to review</strong>.
          </p>
          {unknownCount > 0 && (
            <button className="deck__summary-btn" onClick={reset}>
              Study again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
