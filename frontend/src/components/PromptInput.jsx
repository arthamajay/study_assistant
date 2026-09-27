import './PromptInput.css';

/**
 * @param {{
 *   notes: string;
 *   mode: import('../types/result').Mode;
 *   isLoading: boolean;
 *   onNotesChange: (v: string) => void;
 *   onModeChange: (v: import('../types/result').Mode) => void;
 *   onSubmit: () => void;
 * }} props
 */
export default function PromptInput({ notes, mode, isLoading, onNotesChange, onModeChange, onSubmit }) {
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') onSubmit();
  };

  return (
    <div className="prompt-input">
      <div className="prompt-input__header">
        <h2 className="prompt-input__title">Paste your notes or topic</h2>
        <p className="prompt-input__hint">The AI will generate study content from your text.</p>
      </div>

      <textarea
        className="prompt-input__textarea"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. The mitochondria is the powerhouse of the cell. It produces ATP through cellular respiration via the Krebs cycle and oxidative phosphorylation..."
        rows={7}
        disabled={isLoading}
        aria-label="Study notes input"
      />

      <div className="prompt-input__controls">
        <div className="prompt-input__mode-group">
          <span className="prompt-input__mode-label">Generate:</span>
          <div className="prompt-input__mode-toggle" role="group" aria-label="Mode selection">
            <button
              className={`prompt-input__mode-btn${mode === 'flashcards' ? ' active' : ''}`}
              onClick={() => onModeChange('flashcards')}
              disabled={isLoading}
              aria-pressed={mode === 'flashcards'}
            >
              <span className="prompt-input__mode-icon">🃏</span>
              Flashcards
            </button>
            <button
              className={`prompt-input__mode-btn${mode === 'quiz' ? ' active' : ''}`}
              onClick={() => onModeChange('quiz')}
              disabled={isLoading}
              aria-pressed={mode === 'quiz'}
            >
              <span className="prompt-input__mode-icon">📝</span>
              Quiz
            </button>
          </div>
        </div>

        <button
          className="prompt-input__submit"
          onClick={onSubmit}
          disabled={isLoading || !notes.trim()}
          aria-label="Generate study content"
        >
          {isLoading ? (
            <>
              <span className="prompt-input__submit-spinner" />
              Generating…
            </>
          ) : (
            <>
              <span>✨</span>
              Generate
            </>
          )}
        </button>
      </div>

      <p className="prompt-input__shortcut">Tip: Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to generate</p>
    </div>
  );
}
