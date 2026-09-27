import './LoadingState.css';

export default function LoadingState({ mode }) {
  const label = mode === 'quiz' ? 'quiz questions' : 'flashcards';

  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="loading__orbs">
        <span className="loading__orb" />
        <span className="loading__orb" />
        <span className="loading__orb" />
      </div>
      <p className="loading__text">Generating your {label}…</p>
      <p className="loading__sub">The AI is reading your notes</p>
    </div>
  );
}
