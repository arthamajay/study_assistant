import { useState } from 'react';
import './Quiz.css';

/**
 * @param {{ items: import('../types/result').QuizQuestion[] }} props
 */
export default function Quiz({ items }) {
  const [index, setIndex]           = useState(0);
  const [selected, setSelected]     = useState(/** @type {number|null} */ (null));
  const [showExp, setShowExp]       = useState(false);
  const [score, setScore]           = useState(0);
  const [wrongItems, setWrongItems] = useState(/** @type {import('../types/result').QuizQuestion[]} */ ([]));
  const [activeItems, setActiveItems] = useState(items);
  const [done, setDone]             = useState(false);

  const current = activeItems[index];
  const total   = activeItems.length;

  const handleSelect = (idx) => {
    if (showExp) return;
    setSelected(idx);
    const correct = idx === current.correctAnswerIndex;
    if (correct) {
      setScore((s) => s + 1);
    } else {
      setWrongItems((w) => [...w, current]);
    }
    setShowExp(true);
  };

  const handleNext = () => {
    if (index + 1 >= total) {
      setDone(true);
    } else {
      setSelected(null);
      setShowExp(false);
      setIndex((i) => i + 1);
    }
  };

  const retestWrong = () => {
    setActiveItems(wrongItems);
    setWrongItems([]);
    setScore(0);
    setIndex(0);
    setSelected(null);
    setShowExp(false);
    setDone(false);
  };

  const restartFull = () => {
    setActiveItems(items);
    setWrongItems([]);
    setScore(0);
    setIndex(0);
    setSelected(null);
    setShowExp(false);
    setDone(false);
  };

  /* ── Summary screen ────────────────────────────────────────── */
  if (done) {
    const pct       = Math.round((score / total) * 100);
    const grade     = pct === 100 ? '🏆 Perfect!' : pct >= 80 ? '🎉 Great job!' : pct >= 50 ? '👍 Good effort!' : '📚 Keep studying!';
    const gradeClass = pct === 100 ? 'perfect' : pct >= 80 ? 'great' : pct >= 50 ? 'good' : 'low';

    return (
      <div className="quiz-summary" role="status" aria-live="polite">
        <div className={`quiz-summary__grade quiz-summary__grade--${gradeClass}`}>
          {grade}
        </div>
        <div className="quiz-summary__score">
          <span className="quiz-summary__num">{score}</span>
          <span className="quiz-summary__denom">/ {total}</span>
        </div>
        <div className="quiz-summary__ring-wrap">
          <svg className="quiz-summary__ring" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" className="quiz-summary__ring-bg" />
            <circle
              cx="40" cy="40" r="34"
              className="quiz-summary__ring-fill"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
            />
          </svg>
          <span className="quiz-summary__pct">{pct}%</span>
        </div>

        <div className="quiz-summary__actions">
          {wrongItems.length > 0 && (
            <button className="quiz-summary__btn quiz-summary__btn--retest" onClick={retestWrong}>
              ↻ Retest {wrongItems.length} wrong answer{wrongItems.length !== 1 ? 's' : ''}
            </button>
          )}
          <button className="quiz-summary__btn quiz-summary__btn--restart" onClick={restartFull}>
            ↺ Restart full quiz
          </button>
        </div>
      </div>
    );
  }

  /* ── Question screen ────────────────────────────────────────── */
  return (
    <div className="quiz">
      {/* Progress */}
      <div className="quiz__progress">
        <div className="quiz__progress-bar">
          <div
            className="quiz__progress-fill"
            style={{ width: `${((index) / total) * 100}%` }}
          />
        </div>
        <span className="quiz__counter">{index + 1} / {total}</span>
      </div>

      {/* Question */}
      <div className="quiz__question-card">
        <span className="quiz__q-label">Question {index + 1}</span>
        <p className="quiz__question">{current.question}</p>
      </div>

      {/* Options */}
      <ul className="quiz__options" role="list">
        {current.options.map((opt, i) => {
          const isCorrect  = i === current.correctAnswerIndex;
          const isSelected = i === selected;
          let state = 'idle';
          if (showExp) {
            if (isCorrect)                           state = 'correct';
            else if (isSelected && !isCorrect)       state = 'incorrect';
            else                                     state = 'dimmed';
          }

          return (
            <li key={i} role="listitem">
              <button
                className={`quiz__option quiz__option--${state}`}
                onClick={() => handleSelect(i)}
                disabled={showExp}
                aria-label={`Option ${String.fromCharCode(65 + i)}: ${opt}`}
                aria-pressed={isSelected}
              >
                <span className="quiz__option-letter">{String.fromCharCode(65 + i)}</span>
                <span className="quiz__option-text">{opt}</span>
                {showExp && isCorrect  && <span className="quiz__option-icon">✓</span>}
                {showExp && isSelected && !isCorrect && <span className="quiz__option-icon">✗</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Explanation */}
      {showExp && (
        <div className={`quiz__explanation quiz__explanation--${selected === current.correctAnswerIndex ? 'correct' : 'incorrect'}`}>
          <span className="quiz__exp-icon">
            {selected === current.correctAnswerIndex ? '✓ Correct!' : '✗ Incorrect'}
          </span>
          <p className="quiz__exp-text">{current.explanation}</p>
          <button className="quiz__next-btn" onClick={handleNext}>
            {index + 1 < total ? 'Next question →' : 'See results'}
          </button>
        </div>
      )}
    </div>
  );
}
