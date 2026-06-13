// =============================================================================
// Aurora Wellness – Gemini AI Client (Singleton)
// =============================================================================
// Uses @google/genai SDK. Provides both standard and streaming generation.
// Falls back to helpful static responses when no API key is configured.
// =============================================================================

import { GoogleGenAI } from '@google/genai';

const DEFAULT_MODEL = 'gemini-2.0-flash';

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (_client) return _client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }

  _client = new GoogleGenAI({ apiKey });
  return _client;
}

// ---------------------------------------------------------------------------
// Standard (non-streaming) response
// ---------------------------------------------------------------------------

export async function generateResponse(
  systemPrompt: string,
  userMessage: string,
  history?: { role: string; content: string }[],
): Promise<string> {
  const client = getClient();

  if (!client) {
    return getFallbackResponse(userMessage);
  }

  try {
    // Build contents array: history turns + current user message
    const contents: { role: string; parts: { text: string }[] }[] = [];

    if (history && history.length > 0) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    const response = await client.models.generateContent({
      model: DEFAULT_MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    return response.text ?? getFallbackResponse(userMessage);
  } catch (error) {
    console.error('[Gemini] generateResponse error:', error);
    return getFallbackResponse(userMessage);
  }
}

// ---------------------------------------------------------------------------
// Streaming response
// ---------------------------------------------------------------------------

export async function generateStreamResponse(
  systemPrompt: string,
  userMessage: string,
  history?: { role: string; content: string }[],
): Promise<AsyncGenerator<string>> {
  const client = getClient();

  if (!client) {
    return (async function* () {
      yield getFallbackResponse(userMessage);
    })();
  }

  try {
    const contents: { role: string; parts: { text: string }[] }[] = [];

    if (history && history.length > 0) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    const stream = await client.models.generateContentStream({
      model: DEFAULT_MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    return (async function* () {
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) yield text;
      }
    })();
  } catch (error) {
    console.error('[Gemini] generateStreamResponse error:', error);
    return (async function* () {
      yield getFallbackResponse(userMessage);
    })();
  }
}

// ---------------------------------------------------------------------------
// JSON-structured generation (for agents that need parsed output)
// ---------------------------------------------------------------------------

export async function generateJSON<T>(
  systemPrompt: string,
  userMessage: string,
): Promise<T | null> {
  const client = getClient();

  if (!client) return null;

  try {
    const response = await client.models.generateContent({
      model: DEFAULT_MODEL,
      contents: userMessage,
      config: {
        systemInstruction:
          systemPrompt +
          '\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code fences, no extra text.',
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const raw = response.text ?? '';
    // Strip possible code-fence wrappers that some models return
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error('[Gemini] generateJSON error:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fallback response when Gemini is unavailable
// ---------------------------------------------------------------------------

function getFallbackResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('stress') || lower.includes('anxious') || lower.includes('worried')) {
    return "I can sense you're going through a tough time. Remember, it's okay to feel this way. Try taking a few deep breaths – inhale for 4 counts, hold for 4, exhale for 4. Small steps matter. You've handled challenges before, and you'll handle this one too. 💙";
  }

  if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('burnout')) {
    return "It sounds like you need a break, and that's completely okay. Rest isn't a luxury – it's essential for your best performance. Try stepping away for 15 minutes, stretch, drink some water, and come back refreshed. You deserve that kindness toward yourself. 🌿";
  }

  if (lower.includes('fail') || lower.includes('bad score') || lower.includes('not good enough')) {
    return "A setback is not the end of your story – it's a chapter that's building your resilience. Every person who succeeded has faced moments like this. What matters is that you're still here, still trying. That takes real courage. Let's focus on what you can do next. 🌟";
  }

  if (lower.includes('happy') || lower.includes('great') || lower.includes('good')) {
    return "That's wonderful to hear! 🎉 Celebrate this feeling – you've earned it. Positive moments are fuel for the challenging ones. Maybe take a moment to write down what's making today good so you can look back on it later.";
  }

  if (lower.includes('lonely') || lower.includes('alone') || lower.includes('isolated')) {
    return "Feeling lonely can be really hard, especially during intense preparation periods. Remember, reaching out – even to one person – can make a big difference. And I'm always here for you, any time you want to talk. You matter. 💜";
  }

  return "I'm here for you and I want to help. While I'm currently running in offline mode, I can still offer support. Tell me what's on your mind – whether it's about your studies, your feelings, or anything else. Every conversation is a step forward. 💙";
}
