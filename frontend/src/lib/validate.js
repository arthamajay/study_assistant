/**
 * Validates that a parsed API response matches the expected StudyResult shape.
 * Mirrors the backend validator so the frontend never blindly trusts the API.
 *
 * @param {unknown} obj
 * @returns {obj is import('../types/result').StudyResult}
 */
export function validateResult(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;

  const { mode } = /** @type {any} */ (obj);
  if (mode !== 'flashcards' && mode !== 'quiz') return false;

  if (mode === 'flashcards') {
    const { flashcards } = /** @type {any} */ (obj);
    return (
      Array.isArray(flashcards) &&
      flashcards.length > 0 &&
      flashcards.every(
        (c) => typeof c.front === 'string' && typeof c.back === 'string'
      )
    );
  }

  // mode === 'quiz'
  const { quiz } = /** @type {any} */ (obj);
  return (
    Array.isArray(quiz) &&
    quiz.length > 0 &&
    quiz.every(
      (q) =>
        typeof q.question === 'string' &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        Number.isInteger(q.correctAnswerIndex) &&
        q.correctAnswerIndex >= 0 &&
        q.correctAnswerIndex < q.options.length &&
        typeof q.explanation === 'string'
    )
  );
}
