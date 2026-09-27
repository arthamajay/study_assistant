import './ErrorState.css';

/**
 * @param {{ message: string; onRetry: () => void }} props
 */
export default function ErrorState({ message, onRetry }) {
  return (
    <div className="error" role="alert">
      <div className="error__icon">⚠️</div>
      <h3 className="error__title">Something went wrong</h3>
      <p className="error__message">{message}</p>
      <button className="error__retry" onClick={onRetry}>
        ↻ Try again
      </button>
    </div>
  );
}
