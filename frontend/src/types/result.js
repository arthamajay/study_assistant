/**
 * @typedef {{ front: string; back: string }} Flashcard
 *
 * @typedef {{
 *   question: string;
 *   options: string[];
 *   correctAnswerIndex: number;
 *   explanation: string;
 * }} QuizQuestion
 *
 * @typedef {{ mode: 'flashcards'; flashcards: Flashcard[] }} FlashcardsResult
 * @typedef {{ mode: 'quiz'; quiz: QuizQuestion[] }} QuizResult
 * @typedef {FlashcardsResult | QuizResult} StudyResult
 *
 * @typedef {'flashcards' | 'quiz'} Mode
 * @typedef {'idle' | 'loading' | 'success' | 'error'} Status
 */

export {};
