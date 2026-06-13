import { NextResponse } from 'next/server';

/* ------------------------------------------------------------------ */
/*  KEYWORD-BASED SIGNAL DETECTION (FALLBACK)                          */
/* ------------------------------------------------------------------ */
const EMOTIONAL_KEYWORDS: Record<string, string[]> = {
  anxiety: ['anxious', 'anxiety', 'worry', 'worried', 'nervous', 'panic', 'dread', 'fear', 'scared', 'restless'],
  burnout: ['burnout', 'burn out', 'burnt out', 'exhausted', 'drained', 'depleted', 'running on empty', 'nothing left'],
  frustration: ['frustrated', 'frustrating', 'annoyed', 'angry', 'irritated', 'fed up', 'sick of', 'hate this'],
  loneliness: ['alone', 'lonely', 'isolated', 'nobody understands', 'no friends', 'no one to talk', 'by myself'],
  'self-doubt': ['doubt', 'not good enough', 'can\'t do this', 'imposter', 'stupid', 'failure', 'worthless', 'dumb'],
  overwhelm: ['overwhelmed', 'too much', 'drowning', 'can\'t handle', 'suffocating', 'swamped', 'overloaded'],
  motivation: ['motivated', 'inspired', 'excited', 'pumped', 'ready', 'determined', 'fired up'],
  hope: ['hopeful', 'optimistic', 'better', 'improving', 'getting there', 'progress', 'grateful', 'thankful'],
  determination: ['determined', 'focused', 'committed', 'driven', 'dedicated', 'resolute', 'won\'t give up'],
  sadness: ['sad', 'depressed', 'unhappy', 'miserable', 'down', 'low', 'crying', 'tears'],
  guilt: ['guilty', 'ashamed', 'regret', 'should have', 'wasted time', 'blame myself'],
};

const ACADEMIC_KEYWORDS: Record<string, string[]> = {
  procrastination: ['procrastinat', 'putting off', 'delay', 'postpone', 'avoiding', 'later', 'tomorrow'],
  productivity: ['productive', 'covered a lot', 'studied well', 'good session', 'completed', 'finished chapter'],
  'exam-pressure': ['exam', 'test', 'mock', 'paper', 'marks', 'score', 'rank', 'cutoff', 'result'],
  'time-management': ['time', 'schedule', 'planner', 'too slow', 'behind', 'deadline', 'running out'],
  'focus-issues': ['focus', 'concentrate', 'distract', 'wandering', 'phone', 'social media', 'attention'],
  progress: ['improved', 'better', 'progress', 'growth', 'learned', 'understood', 'solved'],
};

const ENVIRONMENTAL_KEYWORDS: Record<string, string[]> = {
  'family-pressure': ['parent', 'family', 'mom', 'dad', 'mother', 'father', 'relative', 'uncle', 'aunt', 'expectation'],
  'peer-comparison': ['compare', 'comparison', 'friend scored', 'topper', 'classmate', 'batch', 'ahead of me', 'behind'],
  'social-pressure': ['social media', 'instagram', 'youtube', 'phone', 'friends hanging out', 'fomo', 'missing out'],
  isolation: ['locked in room', 'no social', 'no fun', 'missing friends', 'staying home', 'cabin fever'],
  support: ['teacher helped', 'friend supported', 'family understood', 'mentor', 'coaching', 'guidance'],
};

function detectSignals(text: string) {
  const lower = text.toLowerCase();
  const emotionalSignals: string[] = [];
  const academicSignals: string[] = [];
  const environmentalSignals: string[] = [];

  for (const [signal, keywords] of Object.entries(EMOTIONAL_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) {
      emotionalSignals.push(signal);
    }
  }

  for (const [signal, keywords] of Object.entries(ACADEMIC_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) {
      academicSignals.push(signal);
    }
  }

  for (const [signal, keywords] of Object.entries(ENVIRONMENTAL_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) {
      environmentalSignals.push(signal);
    }
  }

  // Defaults
  if (emotionalSignals.length === 0) emotionalSignals.push('self-reflection');
  if (academicSignals.length === 0) academicSignals.push('general-study');

  // Simple sentiment score
  const positiveWords = ['happy', 'good', 'great', 'better', 'improved', 'motivated', 'excited', 'grateful', 'proud', 'confident', 'hopeful'];
  const negativeWords = ['sad', 'bad', 'terrible', 'worse', 'failed', 'stressed', 'anxious', 'exhausted', 'frustrated', 'overwhelmed', 'scared', 'hopeless'];

  let sentimentScore = 0;
  for (const word of positiveWords) {
    if (lower.includes(word)) sentimentScore += 0.15;
  }
  for (const word of negativeWords) {
    if (lower.includes(word)) sentimentScore -= 0.15;
  }
  sentimentScore = Math.max(-1, Math.min(1, sentimentScore));

  return { emotionalSignals, academicSignals, environmentalSignals, sentimentScore };
}

/* ------------------------------------------------------------------ */
/*  GEMINI JOURNAL ANALYSIS                                            */
/* ------------------------------------------------------------------ */
async function analyzeWithGemini(content: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Analyze this student journal entry for emotional wellness signals. Return ONLY valid JSON with this exact structure:
{
  "emotionalSignals": ["anxiety", "burnout", etc.],
  "academicSignals": ["procrastination", "exam-pressure", etc.],
  "environmentalSignals": ["family-pressure", "peer-comparison", etc.],
  "sentimentScore": 0.0,
  "summary": "A brief, empathetic 1-2 sentence summary"
}

Possible emotional signals: anxiety, burnout, frustration, loneliness, self-doubt, overwhelm, motivation, hope, determination, sadness, guilt, gratitude
Possible academic signals: procrastination, productivity, exam-pressure, time-management, focus-issues, progress
Possible environmental signals: family-pressure, peer-comparison, social-pressure, isolation, support

sentimentScore: -1 (very negative) to 1 (very positive)

The summary should be warm and empathetic, acknowledging the student's feelings.

Journal entry:
"""
${content}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 300,
        temperature: 0.3,
      },
    });

    const text = response.text || '';
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('Gemini journal analysis error:', error);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  POST HANDLER                                                       */
/* ------------------------------------------------------------------ */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: 'Content too long (max 5000 characters)' }, { status: 400 });
    }

    // Try Gemini first
    const geminiResult = await analyzeWithGemini(content);

    if (geminiResult) {
      return NextResponse.json(geminiResult);
    }

    // Fallback to keyword analysis
    const signals = detectSignals(content);

    // Generate empathetic summary
    let summary = 'Thank you for sharing your thoughts. Taking time to reflect shows real self-awareness.';
    if (signals.emotionalSignals.includes('anxiety')) {
      summary = "I can sense some anxiety in what you've shared. That's a natural response to the pressure you're under. Remember to be gentle with yourself.";
    } else if (signals.emotionalSignals.includes('burnout')) {
      summary = "It sounds like you might be running on empty. Your body and mind need rest to perform their best. Consider taking a meaningful break today.";
    } else if (signals.emotionalSignals.includes('motivation')) {
      summary = "I can feel your energy and determination! This positive momentum is valuable. Keep channeling it wisely.";
    } else if (signals.emotionalSignals.includes('self-doubt')) {
      summary = "Self-doubt is something every achiever faces. The fact that you care this much shows how dedicated you are. You're stronger than you think.";
    }

    return NextResponse.json({
      ...signals,
      summary,
    });
  } catch (error) {
    console.error('Journal API error:', error);
    return NextResponse.json({
      emotionalSignals: ['self-reflection'],
      academicSignals: ['general-study'],
      environmentalSignals: [],
      sentimentScore: 0,
      summary: 'Your entry has been recorded. Every moment of reflection brings you closer to understanding yourself.',
    });
  }
}
