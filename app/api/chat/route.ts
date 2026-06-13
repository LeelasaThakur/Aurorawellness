import { NextResponse } from 'next/server';

/* ------------------------------------------------------------------ */
/*  SAFETY CHECK                                                       */
/* ------------------------------------------------------------------ */
const CRISIS_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
  "don't want to live", 'no reason to live', 'self-harm', 'self harm',
  'hurt myself', 'cutting myself', 'end it all', 'better off dead',
  "can't go on", 'give up on life',
];

const HELPLINES = [
  { name: 'iCall', number: '9152987821', desc: 'Mon–Sat, 8am–10pm' },
  { name: 'Vandrevala Foundation', number: '1860-2662-345', desc: '24/7' },
  { name: 'NIMHANS', number: '080-46110007', desc: '24/7' },
  { name: 'AASRA', number: '9820466726', desc: '24/7' },
];

function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some(k => lower.includes(k));
}

/* ------------------------------------------------------------------ */
/*  QUOTES DATABASE                                                    */
/* ------------------------------------------------------------------ */
const QUOTES = [
  { quote: "You may encounter many defeats, but you must not be defeated.", author: "Maya Angelou", tags: ["resilience", "failure"] },
  { quote: "Be yourself; everyone else is already taken.", author: "Oscar Wilde", tags: ["self-belief", "identity"] },
  { quote: "In the middle of difficulty lies opportunity.", author: "Albert Einstein", tags: ["resilience", "challenge"] },
  { quote: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie", tags: ["courage", "fear"] },
  { quote: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela", tags: ["education", "purpose"] },
  { quote: "The best way to predict your future is to create it.", author: "Abraham Lincoln", tags: ["purpose", "motivation"] },
  { quote: "Where there is a will, there is a way.", author: "Rabindranath Tagore", tags: ["determination", "perseverance"] },
  { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", tags: ["perseverance", "patience"] },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", tags: ["dreams", "self-belief"] },
  { quote: "All great achievements require time.", author: "Maya Angelou", tags: ["patience", "perseverance"] },
  { quote: "If you cannot do great things, do small things in a great way.", author: "Napoleon Hill", tags: ["effort", "motivation"] },
  { quote: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis", tags: ["resilience", "challenge"] },
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", tags: ["resilience", "courage"] },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs", tags: ["passion", "motivation"] },
  { quote: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne", tags: ["self-belief", "courage"] },
];

function matchQuote(context: string) {
  const lower = context.toLowerCase();
  const tagScores: Record<string, number> = {};

  const contextMap: Record<string, string[]> = {
    'fail|mock|score|wrong|bad result': ['resilience', 'courage'],
    'stress|overwhelm|too much|pressure|burden': ['perseverance', 'patience'],
    'motivat|lazy|purpose|why|point': ['motivation', 'purpose'],
    'confiden|doubt|believe|can\'t|unable': ['self-belief', 'courage'],
    'afraid|fear|scar|anxious|nervous': ['courage', 'resilience'],
    'tired|exhaust|burnout|drain|fatigue': ['patience', 'perseverance'],
    'compar|peer|topper|behind': ['self-belief', 'effort'],
  };

  for (const [pattern, tags] of Object.entries(contextMap)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(lower)) {
      for (const tag of tags) {
        tagScores[tag] = (tagScores[tag] || 0) + 1;
      }
    }
  }

  const topTag = Object.entries(tagScores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'resilience';
  const matching = QUOTES.filter(q => q.tags.includes(topTag));
  const pool = matching.length > 0 ? matching : QUOTES;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ------------------------------------------------------------------ */
/*  SYSTEM PROMPT                                                      */
/* ------------------------------------------------------------------ */
function buildSystemPrompt(profile: Record<string, unknown> | null) {
  const name = profile?.name || 'the student';
  const exam = profile?.exam || 'their exam';

  return `You are Aurora, a warm, empathetic AI wellness companion for students preparing for competitive exams.

ABOUT THE STUDENT:
- Name: ${name}
- Preparing for: ${exam}
${profile?.prepStage ? `- Stage: ${profile.prepStage}` : ''}
${profile?.targetScore ? `- Target: ${profile.targetScore}` : ''}
${profile?.resilienceAnchors ? `- Proud achievement: ${(profile.resilienceAnchors as Record<string, string>).proudAchievement || 'not shared yet'}` : ''}
${profile?.resilienceAnchors ? `- Challenge overcome: ${(profile.resilienceAnchors as Record<string, string>).challengeOvercome || 'not shared yet'}` : ''}
${profile?.resilienceAnchors ? `- Motivation: ${(profile.resilienceAnchors as Record<string, string>).motivation || 'not shared yet'}` : ''}

YOUR PERSONALITY:
- Calm, warm, supportive, encouraging, non-judgmental
- Like a trusted friend + mentor + emotional coach
- You understand the unique pressures of Indian competitive exam culture
- You validate feelings before offering advice
- You use the student's name naturally in conversation

RULES YOU MUST FOLLOW:
1. NEVER diagnose any mental health condition
2. NEVER act as a therapist or psychiatrist
3. NEVER prescribe medication or medical treatment
4. If the student mentions self-harm or suicidal thoughts, immediately encourage them to reach out to a helpline (iCall: 9152987821, Vandrevala: 1860-2662-345) or a trusted person
5. Keep responses concise (2-4 sentences unless they need more detail)
6. Acknowledge emotions before offering solutions
7. When confidence is low, remind them of their past achievements and strengths
8. Understand exam-specific contexts:
   - NEET: Long syllabus, biology memorization, competition pressure
   - JEE: Physics/math problem-solving, conceptual depth
   - UPSC: Vast syllabus uncertainty, long preparation timeline
   - CAT: Time pressure, verbal/quant balance
   - GATE: Technical depth, consistency
   - CUET/Board: Multiple subjects, school-level pressure
9. Suggest practical, actionable coping strategies
10. Celebrate small wins and progress

RESPONSE STYLE:
- Use a warm, conversational tone
- Include relevant emojis sparingly (1-2 per message)
- When appropriate, suggest breathing exercises, study breaks, or mindfulness
- Ask follow-up questions to understand the student better
- Be concise but thorough`;
}

/* ------------------------------------------------------------------ */
/*  GEMINI API                                                         */
/* ------------------------------------------------------------------ */
async function generateGeminiResponse(
  systemPrompt: string,
  message: string,
  history: { role: string; content: string }[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return generateFallbackResponse(message);
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const contents = [
      ...history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 500,
        temperature: 0.8,
        topP: 0.9,
      },
    });

    return response.text || generateFallbackResponse(message);
  } catch (error) {
    console.error('Gemini API error:', error);
    return generateFallbackResponse(message);
  }
}

function generateFallbackResponse(message: string): string {
  const lower = message.toLowerCase();
  const quote = matchQuote(message);

  if (lower.includes('stress') || lower.includes('overwhelm') || lower.includes('pressure')) {
    return `I hear you — that kind of pressure can feel really heavy. 💛 Here's something to remember: "${quote.quote}" — ${quote.author}. Would you like to try a quick 2-minute breathing exercise? Sometimes a small pause can make a big difference.`;
  }

  if (lower.includes('fail') || lower.includes('mock test') || lower.includes('bad score') || lower.includes('wrong')) {
    return `One test doesn't define your ability or your future. What matters is that you showed up and tried. 💪 "${quote.quote}" — ${quote.author}. What did you learn from this experience that you can apply next time?`;
  }

  if (lower.includes('tired') || lower.includes('exhaust') || lower.includes('burnout') || lower.includes('burn out')) {
    return `Your body and mind are telling you they need rest — and that's okay. 🌙 Taking a break isn't giving up, it's recharging. "${quote.quote}" — ${quote.author}. Can you give yourself permission to rest for a bit today?`;
  }

  if (lower.includes('parent') || lower.includes('family') || lower.includes('compare') || lower.includes('comparison')) {
    return `Family expectations can add a lot of weight to what you're already carrying. Your journey is uniquely yours. 💛 "${quote.quote}" — ${quote.author}. Remember, the people around you care about you beyond your scores.`;
  }

  if (lower.includes('focus') || lower.includes('distract') || lower.includes('concentrate') || lower.includes('phone')) {
    return `Struggling with focus is completely normal, especially when you have so much to study. 🎯 Try the Pomodoro technique: 25 minutes of focused study, then a 5-minute break. Would you like me to guide you through a focus recovery exercise?`;
  }

  if (lower.includes('motivat') || lower.includes('lazy') || lower.includes('purpose')) {
    return `It's natural for motivation to ebb and flow during a long preparation journey. "${quote.quote}" — ${quote.author}. ✨ Instead of waiting to feel motivated, try starting with just 10 minutes of study. Momentum often creates motivation, not the other way around.`;
  }

  if (lower.includes('anxious') || lower.includes('anxiety') || lower.includes('nervous') || lower.includes('worry')) {
    return `Anxiety before exams is something almost every student experiences — you're not alone in this. 🌿 "${quote.quote}" — ${quote.author}. Let's try grounding yourself: name 3 things you can see right now. This simple exercise can help bring you back to the present.`;
  }

  if (lower.includes('happy') || lower.includes('great') || lower.includes('good') || lower.includes('well') || lower.includes('fine')) {
    return `That's wonderful to hear! 🌟 Celebrating the good moments is just as important as navigating the tough ones. What contributed to you feeling this way? Understanding your positive patterns can help maintain them.`;
  }

  if (lower.includes('sleep') || lower.includes('insomnia') || lower.includes('can\'t sleep')) {
    return `Sleep is so important for memory consolidation and learning. 🌙 Try the 4-7-8 breathing technique before bed: breathe in for 4 seconds, hold for 7, exhale for 8. Also, try to avoid screens 30 minutes before sleep. Would you like to try a sleep wind-down exercise?`;
  }

  return `Thank you for sharing that with me. 💛 "${quote.quote}" — ${quote.author}. I'm here whenever you need to talk. What's on your mind right now?`;
}

/* ------------------------------------------------------------------ */
/*  POST HANDLER                                                       */
/* ------------------------------------------------------------------ */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, profile, history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Safety check first
    if (detectCrisis(message)) {
      return NextResponse.json({
        message: `I can hear you're going through something really difficult right now, and I want you to know — you matter. Please reach out to someone who can help:\n\n📞 iCall: 9152987821\n📞 Vandrevala Foundation: 1860-2662-345\n📞 NIMHANS: 080-46110007\n📞 AASRA: 9820466726\n\nYou don't have to face this alone. Is there a trusted person — a parent, teacher, or friend — you can talk to right now? 💛`,
        isCrisis: true,
        helplines: HELPLINES,
      });
    }

    // Generate AI response
    const systemPrompt = buildSystemPrompt(profile || null);
    const aiResponse = await generateGeminiResponse(
      systemPrompt,
      message,
      Array.isArray(history) ? history.slice(-8) : []
    );

    return NextResponse.json({
      message: aiResponse,
      emotionalContext: [],
      isCrisis: false,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      message: "I'm here for you. Can you tell me more about how you're feeling? 💛",
      isCrisis: false,
    });
  }
}
