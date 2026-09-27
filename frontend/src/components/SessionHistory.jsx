import './SessionHistory.css';

/**
 * @param {{
 *   history: import('../types/result').HistoryEntry[];
 *   activeId: string | null;
 *   onSelect: (entry: import('../types/result').HistoryEntry) => void;
 *   onClear: () => void;
 * }} props
 */
export default function SessionHistory({ history, activeId, onSelect, onClear }) {
  if (history.length === 0) return null;

  return (
    <aside className="history" aria-label="Session history">
      <div className="history__header">
        <span className="history__title">📚 This session</span>
        <button className="history__clear" onClick={onClear} aria-label="Clear history">
          Clear
        </button>
      </div>

      <ul className="history__list" role="list">
        {[...history].reverse().map((entry) => {
          const isActive = entry.id === activeId;
          const time = new Date(entry.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <li key={entry.id} role="listitem">
              <button
                className={`history__item${isActive ? ' history__item--active' : ''}`}
                onClick={() => onSelect(entry)}
                aria-current={isActive ? 'true' : undefined}
              >
                <div className="history__item-top">
                  <span className="history__item-mode">
                    {entry.mode === 'flashcards' ? '🃏' : '📝'}
                    {entry.mode === 'flashcards' ? ' Flashcards' : ' Quiz'}
                  </span>
                  <span className="history__item-time">{time}</span>
                </div>

                <p className="history__item-preview">{entry.notesPreview}</p>

                <div className="history__item-meta">
                  {entry.mode === 'flashcards' ? (
                    <span className="history__item-tag history__item-tag--cards">
                      {entry.result.flashcards.length} cards
                    </span>
                  ) : (
                    <>
                      <span className="history__item-tag history__item-tag--quiz">
                        {entry.result.quiz.length} questions
                      </span>
                      {entry.quizScore !== null && (
                        <span className={`history__item-score ${getScoreClass(entry.quizScore, entry.quizTotal)}`}>
                          {entry.quizScore}/{entry.quizTotal} · {Math.round((entry.quizScore / entry.quizTotal) * 100)}%
                        </span>
                      )}
                      {entry.quizScore === null && (
                        <span className="history__item-tag history__item-tag--pending">
                          not completed
                        </span>
                      )}
                    </>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

/**
 * @param {number} score
 * @param {number | null} total
 */
function getScoreClass(score, total) {
  if (total === null) return 'score--pending';
  const pct = (score / total) * 100;
  if (pct === 100) return 'score--perfect';
  if (pct >= 80)   return 'score--great';
  if (pct >= 50)   return 'score--good';
  return 'score--low';
}
