/**
 * The only place in the frontend that talks to the backend proxy.
 * The LLM call itself never happens in the browser.
 *
 * API_BASE is set via the VITE_API_URL environment variable so the same
 * build works locally (http://localhost:4000) and in production (your
 * deployed backend URL). Falls back to localhost for local development.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

/**
 * @param {{ notes: string; mode: import('../types/result').Mode; signal?: AbortSignal }} params
 * @returns {Promise<import('../types/result').StudyResult>}
 */
export async function generateStudyContent({ notes, mode, signal }) {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes, mode }),
    signal,
  });

  if (!response.ok) {
    let message = `Server error (${response.status})`;
    try {
      const err = await response.json();
      if (err.error) message = err.error;
    } catch {
      // ignore parse failure, use default message
    }
    throw new Error(message);
  }

  return response.json();
}
