// =============================================================================
// Aurora Wellness – Wellness Coach Agent
// =============================================================================
// Generates personalised coping strategies, recovery actions, and
// encouragement based on user profile, current state, and journal insights.
// =============================================================================

import { generateJSON } from '@/app/lib/ai/gemini';
import type { WellnessAction, JournalAnalysis, UserProfile, DailyCheckin } from '@/app/lib/types';

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const COACH_SYSTEM_PROMPT = `You are a compassionate wellness coach for students preparing for competitive exams in India.

You are NOT a therapist. You do NOT diagnose. You provide practical, evidence-based coping strategies.

Based on the student's current state, generate ONE targeted wellness action.

Return JSON with exactly this structure:
{
  "type": "coping" | "recovery" | "encouragement",
  "title": "short title (max 8 words)",
  "content": "2-3 sentences of empathetic, actionable advice",
  "exercise": {
    "name": "exercise name",
    "steps": ["step 1", "step 2", "step 3", "step 4"],
    "duration": "e.g. 5 minutes"
  }
}

RULES:
- If stress or anxiety detected → type "coping", provide grounding or breathing exercise
- If burnout or exhaustion detected → type "recovery", provide break schedule or energy management
- If confidence drops or self-doubt → type "encouragement", remind them of progress
- Tailor advice to their exam type when possible (e.g., NEET biology fatigue, JEE problem-solving stress)
- Keep language warm, encouraging, and age-appropriate (17-22 year olds)
- NEVER be preachy. NEVER shame. NEVER say "just relax".
- Exercises should be specific and doable in 2-10 minutes`;

// ---------------------------------------------------------------------------
// Context builder
// ---------------------------------------------------------------------------

interface CoachInput {
  profile?: UserProfile | null;
  currentCheckin?: DailyCheckin | null;
  journalInsights?: JournalAnalysis | null;
  recentMoods?: number[];
}

function buildContextMessage(input: CoachInput): string {
  const parts: string[] = [];

  if (input.profile) {
    parts.push(`Student: ${input.profile.preferredName || input.profile.name}`);
    parts.push(`Exam: ${input.profile.examType}`);
    if (input.profile.examDate) parts.push(`Exam date: ${input.profile.examDate}`);
    if (input.profile.struggles.length > 0) parts.push(`Known struggles: ${input.profile.struggles.join(', ')}`);
  }

  if (input.currentCheckin) {
    const c = input.currentCheckin;
    parts.push(`Current mood: ${c.mood}/10`);
    parts.push(`Stress: ${c.stress}/10`);
    parts.push(`Energy: ${c.energy}/10`);
    parts.push(`Sleep: ${c.sleep}h (quality: ${c.sleepQuality}/10)`);
    parts.push(`Confidence: ${c.confidence}/10`);
    parts.push(`Study hours today: ${c.studyHours}h, breaks: ${c.breaksTaken}`);
  }

  if (input.journalInsights) {
    const j = input.journalInsights;
    parts.push(`Emotional signals: ${j.emotionalSignals.join(', ')}`);
    parts.push(`Academic signals: ${j.academicSignals.join(', ')}`);
    parts.push(`Sentiment: ${j.sentimentScore}`);
    parts.push(`Summary: ${j.summary}`);
  }

  if (input.recentMoods && input.recentMoods.length > 1) {
    const trend = input.recentMoods[input.recentMoods.length - 1] - input.recentMoods[0];
    parts.push(`Mood trend (last ${input.recentMoods.length} days): ${trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable'}`);
  }

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Fallback wellness actions
// ---------------------------------------------------------------------------

function getFallbackAction(input: CoachInput): WellnessAction {
  const stress = input.currentCheckin?.stress ?? 5;
  const energy = input.currentCheckin?.energy ?? 5;
  const confidence = input.currentCheckin?.confidence ?? 5;
  const signals = input.journalInsights?.emotionalSignals ?? [];

  // High stress or anxiety
  if (stress >= 7 || signals.includes('anxiety') || signals.includes('overwhelm')) {
    return {
      type: 'coping',
      title: 'Ground yourself with 5-4-3-2-1',
      content:
        "When stress feels overwhelming, your senses can anchor you back to the present. This grounding exercise activates your parasympathetic nervous system and can reduce anxiety in minutes. You've got this.",
      exercise: {
        name: '5-4-3-2-1 Grounding',
        steps: [
          'Name 5 things you can SEE around you',
          'Touch 4 things and notice their TEXTURE',
          'Listen for 3 different SOUNDS',
          'Identify 2 things you can SMELL',
          'Notice 1 thing you can TASTE',
        ],
        duration: '3 minutes',
      },
    };
  }

  // Low energy or burnout
  if (energy <= 3 || signals.includes('burnout') || signals.includes('exhaustion')) {
    return {
      type: 'recovery',
      title: 'Your mind needs a recharge break',
      content:
        "Running on empty doesn't help your preparation — it hurts it. Even a short, intentional break can restore your focus. Think of it as sharpening the axe before cutting more wood.",
      exercise: {
        name: 'Micro-Recovery Break',
        steps: [
          'Stand up and stretch your arms above your head for 30 seconds',
          'Walk to a window or step outside — look at something distant for 1 minute',
          'Drink a full glass of water slowly',
          'Do 5 slow, deep breaths: in for 4, hold for 4, out for 6',
          'Set a timer for your next break in 45 minutes',
        ],
        duration: '5 minutes',
      },
    };
  }

  // Low confidence
  if (confidence <= 4 || signals.includes('self-doubt')) {
    return {
      type: 'encouragement',
      title: "Let's remember how far you've come",
      content:
        "Self-doubt is loudest right before breakthroughs. The fact that you're still showing up — still studying, still trying — is proof of your strength. Let's take a moment to recognise that.",
      exercise: {
        name: 'Progress Reflection',
        steps: [
          'Write down 3 topics you understand now that you didn\'t 1 month ago',
          'Recall one difficult question you solved correctly this week',
          'Think of one person who believes in you — what would they say right now?',
          'Say out loud: "I am making progress, even when it doesn\'t feel like it."',
        ],
        duration: '5 minutes',
      },
    };
  }

  // Default — general wellness
  return {
    type: 'coping',
    title: 'Box breathing for focus',
    content:
      'A quick breathing exercise can sharpen your focus and calm your mind before a study session. Navy SEALs use this technique — it works under real pressure.',
    exercise: {
      name: 'Box Breathing',
      steps: [
        'Breathe IN slowly for 4 counts',
        'HOLD your breath for 4 counts',
        'Breathe OUT slowly for 4 counts',
        'HOLD empty for 4 counts',
        'Repeat for 4 cycles',
      ],
      duration: '3 minutes',
    },
  };
}

// ---------------------------------------------------------------------------
// Main export: generateWellnessAction
// ---------------------------------------------------------------------------

export async function generateWellnessAction(input: CoachInput): Promise<WellnessAction> {
  const contextMessage = buildContextMessage(input);

  const aiResult = await generateJSON<WellnessAction>(
    COACH_SYSTEM_PROMPT,
    `Generate a wellness action for this student:\n\n${contextMessage}`,
  );

  if (
    aiResult &&
    aiResult.type &&
    aiResult.title &&
    aiResult.content
  ) {
    return {
      type: aiResult.type,
      title: aiResult.title,
      content: aiResult.content,
      exercise: aiResult.exercise ?? undefined,
    };
  }

  return getFallbackAction(input);
}
