import FlashcardDeck from './FlashcardDeck';
import Quiz from './Quiz';
import './ResultView.css';

/**
 * Routes the parsed API result to the correct interactive component.
 *
 * @param {{
 *   result: import('../types/result').StudyResult;
 *   onReset: () => void;
 *   onQuizComplete?: (score: number, total: number) => void;
 * }} props
 */
export default function ResultView({ result, onReset, onQuizComplete }) {
  return (
    <div className="result-view">
      <div className="result-view__toolbar">
        <span className="result-view__badge">
          {result.mode === 'flashcards'
            ? `🃏 ${result.flashcards.length} Flashcards`
            : `📝 ${result.quiz.length} Questions`}
        </span>
        <button className="result-view__new-btn" onClick={onReset}>
          + New study set
        </button>
      </div>

      {result.mode === 'flashcards' && (
        <FlashcardDeck cards={result.flashcards} />
      )}

      {result.mode === 'quiz' && (
        <Quiz items={result.quiz} onComplete={onQuizComplete} />
      )}
    </div>
  );
}
