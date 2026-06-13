// =============================================================================
// Aurora Wellness – Motivation Agent
// =============================================================================
// Provides context-matched motivational quotes from a curated database,
// plus personalised messages via Gemini. Quotes are NEVER random —
// they are matched to the student's current emotional state.
// =============================================================================

import { generateJSON } from '@/app/lib/ai/gemini';
import type { MotivationResult } from '@/app/lib/types';

// ---------------------------------------------------------------------------
// Curated quote database
// ---------------------------------------------------------------------------

interface Quote {
  text: string;
  author: string;
  categories: string[];
}

const QUOTES: Quote[] = [
  // ── Resilience (failed tests, setbacks) ──
  { text: "We may encounter many defeats but we must not be defeated.", author: "Maya Angelou", categories: ['resilience', 'setback'] },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle", categories: ['resilience', 'hope'] },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison", categories: ['resilience', 'setback'] },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela", categories: ['resilience', 'courage'] },
  { text: "Failure is simply the opportunity to begin again, this time more intelligently.", author: "Henry Ford", categories: ['resilience', 'setback'] },
  { text: "You may not control all the events that happen to you, but you can decide not to be reduced by them.", author: "Maya Angelou", categories: ['resilience', 'strength'] },
  { text: "Do not judge me by my successes, judge me by how many times I fell down and got back up again.", author: "Nelson Mandela", categories: ['resilience', 'courage'] },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", categories: ['resilience', 'perseverance'] },

  // ── Perseverance (feeling overwhelmed) ──
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", categories: ['perseverance', 'passion'] },
  { text: "Patience and perseverance have a magical effect before which difficulties disappear and obstacles vanish.", author: "John Quincy Adams", categories: ['perseverance'] },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis", categories: ['perseverance', 'purpose'] },
  { text: "Perseverance is not a long race; it is many short races one after the other.", author: "Walter Elliot", categories: ['perseverance'] },
  { text: "The moment you give up is the moment you let someone else win.", author: "Kobe Bryant", categories: ['perseverance', 'determination'] },
  { text: "Rivers know this: there is no hurry. We shall get there some day.", author: "A.A. Milne", categories: ['perseverance', 'patience'] },

  // ── Purpose & passion (loss of motivation) ──
  { text: "Where there is no struggle, there is no strength.", author: "Oprah Winfrey", categories: ['purpose', 'strength'] },
  { text: "Faith is the bird that feels the light and sings when the dawn is still dark.", author: "Rabindranath Tagore", categories: ['purpose', 'hope'] },
  { text: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi", categories: ['purpose'] },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", categories: ['purpose', 'dreams'] },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein", categories: ['purpose', 'resilience'] },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde", categories: ['purpose', 'confidence'] },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon", categories: ['purpose', 'perspective'] },
  { text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie", categories: ['purpose', 'courage'] },

  // ── Courage (pre-exam anxiety) ──
  { text: "Courage is not the absence of fear, but the triumph over it.", author: "Nelson Mandela", categories: ['courage'] },
  { text: "You gain strength, courage, and confidence by every experience in which you really stop to look fear in the face.", author: "Eleanor Roosevelt", categories: ['courage', 'strength'] },
  { text: "Have the courage to follow your heart and intuition.", author: "Steve Jobs", categories: ['courage', 'purpose'] },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", categories: ['courage', 'strength'] },
  { text: "The only thing we have to fear is fear itself.", author: "Franklin D. Roosevelt", categories: ['courage'] },
  { text: "I learned that courage was not the absence of fear, but the triumph over it.", author: "Nelson Mandela", categories: ['courage', 'resilience'] },

  // ── Confidence & self-worth ──
  { text: "No one can make you feel inferior without your consent.", author: "Eleanor Roosevelt", categories: ['confidence'] },
  { text: "To love oneself is the beginning of a lifelong romance.", author: "Oscar Wilde", categories: ['confidence', 'self-worth'] },
  { text: "She was powerful not because she wasn't scared but because she went on so strongly, despite the fear.", author: "Atticus", categories: ['confidence', 'courage'] },
  { text: "If you hear a voice within you say 'you cannot paint,' then by all means paint, and that voice will be silenced.", author: "Vincent van Gogh", categories: ['confidence', 'determination'] },

  // ── Wisdom & perspective (scientists) ──
  { text: "Imagination is more important than knowledge. Knowledge is limited. Imagination encircles the world.", author: "Albert Einstein", categories: ['wisdom', 'creativity'] },
  { text: "The important thing is not to stop questioning. Curiosity has its own reason for existing.", author: "Albert Einstein", categories: ['wisdom', 'curiosity'] },
  { text: "I was taught that the way of progress was neither swift nor easy.", author: "Marie Curie", categories: ['wisdom', 'perseverance'] },
  { text: "The present is theirs; the future, for which I really worked, is mine.", author: "Nikola Tesla", categories: ['wisdom', 'purpose'] },
  { text: "Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.", author: "Thomas Edison", categories: ['wisdom', 'perseverance'] },

  // ── Literary wisdom ──
  { text: "It is not the strength of the body that counts, but the strength of the spirit.", author: "J.R.R. Tolkien", categories: ['strength', 'spirit'] },
  { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou", categories: ['expression', 'purpose'] },
  { text: "Clouds come floating into my life, no longer to carry rain or usher storm, but to add color to my sunset sky.", author: "Rabindranath Tagore", categories: ['perspective', 'hope'] },
  { text: "It isn't what we say or think that defines us, but what we do.", author: "Jane Austen", categories: ['action', 'determination'] },
  { text: "Whenever you find yourself on the side of the majority, it is time to pause and reflect.", author: "Mark Twain", categories: ['perspective', 'individuality'] },
  { text: "Even the darkest night will end and the sun will rise.", author: "Victor Hugo", categories: ['hope', 'resilience'] },

  // ── Lincoln ──
  { text: "The best way to predict the future is to create it.", author: "Abraham Lincoln", categories: ['action', 'purpose'] },
  { text: "I am a slow walker, but I never walk back.", author: "Abraham Lincoln", categories: ['perseverance', 'determination'] },
];

// ---------------------------------------------------------------------------
// Context → category mapping
// ---------------------------------------------------------------------------

type MoodContext =
  | 'failed-test'
  | 'overwhelmed'
  | 'lost-motivation'
  | 'pre-exam-anxiety'
  | 'low-confidence'
  | 'general';

function detectMoodContext(signals: string[], sentimentScore?: number): MoodContext {
  const s = new Set(signals.map((x) => x.toLowerCase()));

  if (s.has('self-doubt') || s.has('worthless') || s.has('imposter')) return 'low-confidence';
  if (s.has('exam-pressure') || s.has('mock-test-stress') || s.has('fear')) return 'pre-exam-anxiety';
  if (s.has('setback') || s.has('failure') || s.has('disappointment')) return 'failed-test';
  if (s.has('overwhelm') || s.has('burnout') || s.has('exhaustion') || s.has('study-fatigue')) return 'overwhelmed';
  if (s.has('procrastination') || s.has('unmotivated') || s.has('lost-motivation')) return 'lost-motivation';

  // Sentiment-based fallback
  if (sentimentScore !== undefined) {
    if (sentimentScore < -0.5) return 'failed-test';
    if (sentimentScore < -0.2) return 'overwhelmed';
  }

  return 'general';
}

const CONTEXT_TO_CATEGORIES: Record<MoodContext, string[]> = {
  'failed-test': ['resilience', 'setback'],
  'overwhelmed': ['perseverance', 'patience', 'strength'],
  'lost-motivation': ['purpose', 'passion', 'dreams'],
  'pre-exam-anxiety': ['courage', 'strength'],
  'low-confidence': ['confidence', 'self-worth', 'determination'],
  'general': ['wisdom', 'purpose', 'hope'],
};

function pickQuote(context: MoodContext): Quote {
  const targetCategories = CONTEXT_TO_CATEGORIES[context];
  const matches = QUOTES.filter((q) =>
    q.categories.some((c) => targetCategories.includes(c)),
  );

  if (matches.length === 0) {
    // Fallback: pick from wisdom
    const wisdomQuotes = QUOTES.filter((q) => q.categories.includes('wisdom'));
    return wisdomQuotes[Math.floor(Math.random() * wisdomQuotes.length)] ?? QUOTES[0];
  }

  // Pick pseudo-randomly from matches
  return matches[Math.floor(Math.random() * matches.length)];
}

// ---------------------------------------------------------------------------
// System prompt for personalised message
// ---------------------------------------------------------------------------

const MOTIVATION_SYSTEM_PROMPT = `You are a warm, encouraging wellness companion for Indian students preparing for competitive exams.

Generate a SHORT personalised motivational message (2-3 sentences max) based on the student's context.

Rules:
- Be genuine and specific, not generic
- Reference their specific exam or situation if known
- NEVER be preachy or condescending
- NEVER say "just believe in yourself" or similar platitudes
- Use their name if provided
- Keep it warm and human — like a supportive older sibling

Return JSON:
{
  "personalMessage": "your 2-3 sentence message"
}`;

// ---------------------------------------------------------------------------
// Main export: getMotivation
// ---------------------------------------------------------------------------

export async function getMotivation(
  emotionalSignals: string[],
  sentimentScore?: number,
  studentName?: string,
  examType?: string,
): Promise<MotivationResult> {
  const context = detectMoodContext(emotionalSignals, sentimentScore);
  const quote = pickQuote(context);

  // Try Gemini for personalised message
  const aiResult = await generateJSON<{ personalMessage: string }>(
    MOTIVATION_SYSTEM_PROMPT,
    `Context: ${context}\nEmotional signals: ${emotionalSignals.join(', ')}\nStudent name: ${studentName ?? 'friend'}\nExam: ${examType ?? 'competitive exam'}\nSentiment: ${sentimentScore ?? 'unknown'}\nQuote being shown: "${quote.text}" — ${quote.author}`,
  );

  const personalMessage =
    aiResult?.personalMessage ??
    getDefaultPersonalMessage(context, studentName ?? 'friend');

  return {
    quote: quote.text,
    author: quote.author,
    category: context,
    personalMessage,
  };
}

// ---------------------------------------------------------------------------
// Fallback personal messages
// ---------------------------------------------------------------------------

function getDefaultPersonalMessage(context: MoodContext, name: string): string {
  switch (context) {
    case 'failed-test':
      return `${name}, one test score doesn't define your entire journey. Every topper has had bad days — what makes them different is they kept going. You will too.`;
    case 'overwhelmed':
      return `${name}, it's okay to feel the weight of it all. You don't have to conquer the entire syllabus today — just the next chapter, the next problem. Small steps count.`;
    case 'lost-motivation':
      return `${name}, remember why you started this journey. That dream is still valid, and so are you. Sometimes motivation follows action — try just 20 minutes and see how you feel.`;
    case 'pre-exam-anxiety':
      return `${name}, feeling nervous before an exam means you care — and caring is a strength. You've prepared for this. Trust the work you've put in.`;
    case 'low-confidence':
      return `${name}, the voice telling you you're not good enough is lying. Look at how far you've come from day one. That progress is real, and it's yours.`;
    default:
      return `${name}, you're doing something incredible by showing up every day. Not everyone has the courage to chase a difficult dream. Keep going — you've got this. 💙`;
  }
}
