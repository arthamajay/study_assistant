// backend/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }));
app.use(express.json());

// ─── Schema Validator ────────────────────────────────────────────────────────

function validatePayload(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  if (obj.mode !== 'flashcards' && obj.mode !== 'quiz') return false;

  if (obj.mode === 'flashcards') {
    return (
      Array.isArray(obj.flashcards) &&
      obj.flashcards.length > 0 &&
      obj.flashcards.every(
        (c) => typeof c.front === 'string' && typeof c.back === 'string'
      )
    );
  }

  if (obj.mode === 'quiz') {
    return (
      Array.isArray(obj.quiz) &&
      obj.quiz.length > 0 &&
      obj.quiz.every(
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

  return false;
}

// ─── Prompt Builder ──────────────────────────────────────────────────────────

function buildPrompt(notes, mode) {
  const schema =
    mode === 'flashcards'
      ? {
          mode: 'flashcards',
          flashcards: [{ front: '<question or term>', back: '<answer or definition>' }],
        }
      : {
          mode: 'quiz',
          quiz: [
            {
              question: '<question text>',
              options: ['<option A>', '<option B>', '<option C>', '<option D>'],
              correctAnswerIndex: 0,
              explanation: '<why this answer is correct>',
            },
          ],
        };

  return `You are a study assistant. The user has provided study notes. 
Return ONLY a valid JSON object that exactly matches this schema — no prose, no markdown, no code fences:
${JSON.stringify(schema, null, 2)}

Generate ${mode === 'flashcards' ? '6–10 flashcards' : '5–8 quiz questions'} from the notes below.
Each ${mode === 'flashcards' ? 'flashcard front should be a key term or question, and the back should be the answer/definition' : 'question must have exactly 4 options and one correct answer with a clear explanation'}.

Notes:
"""
${notes}
"""`;
}

// ─── Generate Endpoint ───────────────────────────────────────────────────────

app.post('/generate', async (req, res) => {
  const { notes, mode } = req.body;

  if (!notes || typeof notes !== 'string' || notes.trim().length < 10) {
    return res.status(400).json({ error: 'Please provide at least a sentence of notes.' });
  }

  const chosenMode = mode === 'quiz' ? 'quiz' : 'flashcards';
  const prompt = buildPrompt(notes.trim(), chosenMode);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 2048,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq API error:', groqRes.status, errText);
      return res.status(502).json({
        error: `AI service returned an error (${groqRes.status}). Please try again.`,
      });
    }

    const data = await groqRes.json();
    const raw = data.choices?.[0]?.message?.content;

    if (!raw) {
      return res.status(500).json({ error: 'Empty response from AI. Please try again.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error('JSON parse failed:', raw);
      return res.status(500).json({ error: 'AI returned malformed JSON. Please try again.' });
    }

    if (!validatePayload(parsed)) {
      console.error('Schema validation failed:', parsed);
      return res.status(500).json({ error: 'AI response did not match expected structure. Please try again.' });
    }

    return res.json(parsed);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timed out after 25 seconds. Please try again.' });
    }
    console.error('Unexpected error:', err.message);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
});

// ─── Health Check ────────────────────────────────────────────────────────────-

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
