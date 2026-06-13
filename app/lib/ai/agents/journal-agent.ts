// =============================================================================
// Aurora Wellness – Journal Analysis Agent
// =============================================================================
// Analyses journal text and extracts emotional, academic, and environmental
// signals using Gemini. Falls back to keyword matching when AI is unavailable.
// =============================================================================

import { generateJSON } from '@/app/lib/ai/gemini';
import type { JournalAnalysis } from '@/app/lib/types';

// ---------------------------------------------------------------------------
// System prompt for Gemini
// ---------------------------------------------------------------------------

const JOURNAL_SYSTEM_PROMPT = `You are an empathetic journal analysis system for a student wellness app.

Analyse the journal entry and extract structured signals. Do NOT diagnose. Do NOT act as a therapist.

Return JSON with exactly this structure:
{
  "emotionalSignals": string[],
  "academicSignals": string[],
  "environmentalSignals": string[],
  "sentimentScore": number,
  "summary": string
}

EMOTIONAL SIGNALS (pick any that apply):
anxiety, burnout, frustration, loneliness, self-doubt, overwhelm, motivation,
hope, determination, gratitude, sadness, anger, joy, calm, guilt, fear, relief

ACADEMIC SIGNALS (pick any that apply):
procrastination, productivity, exam-pressure, time-management, focus-issues,
progress, achievement, study-fatigue, mock-test-stress, revision-anxiety,
subject-difficulty, breakthrough

ENVIRONMENTAL SIGNALS (pick any that apply):
family-pressure, social-pressure, peer-comparison, isolation, support,
financial-stress, health-concern, relationship-stress, home-conflict,
positive-environment, mentor-support

SENTIMENT SCORE:
A number from -1.0 (very negative) to 1.0 (very positive).
Use 0 for neutral. Be nuanced – a mixed entry might be 0.1 or -0.3.

SUMMARY:
1-2 empathetic sentences that reflect back what the student seems to be feeling.
Do NOT give advice. Just acknowledge and validate.`;

// ---------------------------------------------------------------------------
// Keyword-based fallback analysis
// ---------------------------------------------------------------------------

const EMOTIONAL_KEYWORDS: Record<string, string[]> = {
  anxiety: ['anxious', 'anxiety', 'nervous', 'worried', 'worry', 'panicking', 'panic', 'restless'],
  burnout: ['burnout', 'burnt out', 'burned out', 'exhausted', 'drained', 'depleted'],
  frustration: ['frustrated', 'frustration', 'annoyed', 'irritated', 'angry', 'fed up'],
  loneliness: ['lonely', 'alone', 'isolated', 'no one', 'nobody', 'miss my friends'],
  'self-doubt': ['not good enough', "can't do this", 'doubt myself', 'imposter', 'stupid', 'dumb', 'worthless'],
  overwhelm: ['overwhelmed', 'too much', 'drowning', 'can\'t handle', 'everything at once'],
  motivation: ['motivated', 'pumped', 'excited', 'ready', 'determined', 'fired up', 'inspired'],
  hope: ['hope', 'hopeful', 'optimistic', 'better days', 'things will improve', 'looking forward'],
  determination: ['determined', 'will do it', 'not giving up', 'keep going', 'persist', 'push through'],
  gratitude: ['grateful', 'thankful', 'appreciate', 'lucky', 'blessed'],
  sadness: ['sad', 'crying', 'cried', 'tears', 'heartbroken', 'miserable', 'depressed', 'unhappy'],
  joy: ['happy', 'joyful', 'wonderful', 'amazing', 'great day', 'fantastic', 'thrilled'],
  calm: ['calm', 'peaceful', 'relaxed', 'serene', 'at ease', 'content'],
  guilt: ['guilty', 'guilt', 'ashamed', 'should have', 'regret'],
  fear: ['scared', 'fear', 'afraid', 'terrified', 'frightened'],
};

const ACADEMIC_KEYWORDS: Record<string, string[]> = {
  procrastination: ['procrastinat', 'putting off', 'wasting time', 'distracted', 'can\'t start'],
  productivity: ['productive', 'got a lot done', 'finished', 'completed', 'accomplished'],
  'exam-pressure': ['exam', 'test', 'paper', 'marks', 'score', 'rank', 'percentile', 'cutoff'],
  'time-management': ['time management', 'schedule', 'timetable', 'planning', 'behind schedule', 'deadline'],
  'focus-issues': ['can\'t focus', 'can\'t concentrate', 'distracted', 'attention', 'mind wandering'],
  progress: ['progress', 'improving', 'getting better', 'learned', 'understood', 'figured out'],
  'study-fatigue': ['tired of studying', 'study fatigue', 'sick of books', 'so much syllabus'],
  'mock-test-stress': ['mock test', 'practice test', 'test series', 'mock score'],
};

const ENVIRONMENTAL_KEYWORDS: Record<string, string[]> = {
  'family-pressure': ['parents', 'family', 'father', 'mother', 'dad', 'mom', 'mum', 'expectations', 'pressure from home'],
  'social-pressure': ['social media', 'instagram', 'comparison', 'everyone else', 'others are'],
  'peer-comparison': ['topper', 'batch mate', 'friend scored', 'classmate', 'they got', 'peer'],
  isolation: ['isolated', 'cut off', 'no friends', 'no social life', 'stuck at home'],
  support: ['support', 'teacher helped', 'friend helped', 'someone listened', 'mentor'],
};

function keywordFallback(text: string): JournalAnalysis {
  const lower = text.toLowerCase();
  const emotionalSignals: string[] = [];
  const academicSignals: string[] = [];
  const environmentalSignals: string[] = [];

  for (const [signal, keywords] of Object.entries(EMOTIONAL_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      emotionalSignals.push(signal);
    }
  }

  for (const [signal, keywords] of Object.entries(ACADEMIC_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      academicSignals.push(signal);
    }
  }

  for (const [signal, keywords] of Object.entries(ENVIRONMENTAL_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      environmentalSignals.push(signal);
    }
  }

  // Simple sentiment scoring
  const positiveWords = ['happy', 'great', 'good', 'better', 'amazing', 'wonderful', 'productive', 'grateful', 'motivated', 'excited', 'hope', 'joy', 'calm', 'progress', 'relieved'];
  const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'stressed', 'anxious', 'frustrated', 'lonely', 'overwhelmed', 'exhausted', 'hopeless', 'scared', 'angry', 'hate', 'worst', 'failed', 'crying'];

  let posCount = 0;
  let negCount = 0;
  for (const w of positiveWords) {
    if (lower.includes(w)) posCount++;
  }
  for (const w of negativeWords) {
    if (lower.includes(w)) negCount++;
  }
  const total = posCount + negCount;
  const sentimentScore = total === 0 ? 0 : Math.round(((posCount - negCount) / total) * 100) / 100;

  // Build empathetic summary
  let summary: string;
  if (sentimentScore > 0.3) {
    summary = "It sounds like you're in a positive space right now. That's wonderful – hold on to this feeling.";
  } else if (sentimentScore < -0.3) {
    summary = "It seems like you're going through a challenging time. Your feelings are completely valid, and it takes courage to express them.";
  } else if (emotionalSignals.length > 0) {
    summary = `I can sense a mix of emotions in what you've written. It's okay to feel ${emotionalSignals.slice(0, 2).join(' and ')} – these are natural responses to what you're experiencing.`;
  } else {
    summary = "Thank you for sharing your thoughts. Journaling is a powerful way to process your experiences.";
  }

  return {
    emotionalSignals: emotionalSignals.length > 0 ? emotionalSignals : ['neutral'],
    academicSignals,
    environmentalSignals,
    sentimentScore,
    summary,
  };
}

// ---------------------------------------------------------------------------
// Main export: analyseJournal
// ---------------------------------------------------------------------------

export async function analyseJournal(content: string): Promise<JournalAnalysis> {
  // Try Gemini first
  const aiResult = await generateJSON<JournalAnalysis>(
    JOURNAL_SYSTEM_PROMPT,
    `Analyse this journal entry:\n\n"${content}"`,
  );

  if (aiResult && aiResult.emotionalSignals && aiResult.summary) {
    // Validate and clamp sentiment score
    const score = typeof aiResult.sentimentScore === 'number' ? aiResult.sentimentScore : 0;
    return {
      emotionalSignals: aiResult.emotionalSignals,
      academicSignals: aiResult.academicSignals ?? [],
      environmentalSignals: aiResult.environmentalSignals ?? [],
      sentimentScore: Math.max(-1, Math.min(1, score)),
      summary: aiResult.summary,
    };
  }

  // Fallback to keyword analysis
  return keywordFallback(content);
}
