// =============================================================================
// Aurora Wellness – Safety Agent (Crisis Detection)
// =============================================================================
// Runs on EVERY user input. Two-pass detection:
//   1. Fast regex / keyword scan  →  catches obvious signals instantly
//   2. Gemini nuanced analysis    →  runs when keywords are found to assess
//      context and severity more accurately
//
// NEVER diagnoses. Only surfaces support resources.
// =============================================================================

import { generateJSON } from '@/app/lib/ai/gemini';
import type { SafetyCheckResult, Helpline } from '@/app/lib/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HELPLINES: Helpline[] = [
  { name: 'iCall', number: '9152987821' },
  { name: 'Vandrevala Foundation', number: '1860-2662-345' },
  { name: 'NIMHANS', number: '080-46110007' },
  { name: 'AASRA', number: '9820466726' },
];

// ---------------------------------------------------------------------------
// Keyword & pattern lists (case-insensitive)
// ---------------------------------------------------------------------------

const CRITICAL_PATTERNS: RegExp[] = [
  /\b(kill\s*(my)?self|end\s*(my)?\s*life|suicide|suicidal)\b/i,
  /\b(want\s*to\s*die|wanna\s*die|better\s*off\s*dead)\b/i,
  /\b(no\s*reason\s*to\s*live|nothing\s*to\s*live\s*for)\b/i,
  /\b(take\s*my\s*(own\s*)?life)\b/i,
  /\b(jump\s*off|hang\s*myself|slit\s*(my\s*)?(wrist|throat))\b/i,
  /\b(overdose|od\s*on\s*pills)\b/i,
];

const HIGH_PATTERNS: RegExp[] = [
  /\b(self[- ]?harm|cut(ting)?\s*(my)?self|hurt(ing)?\s*(my)?self)\b/i,
  /\b(don'?t\s*want\s*to\s*(be\s*here|exist|wake\s*up))\b/i,
  /\b(can'?t\s*(go\s*on|take\s*(it|this)\s*(any\s*more)?))\b/i,
  /\b(no\s*one\s*(cares|would\s*miss\s*me))\b/i,
  /\b(world\s*(is\s*)?better\s*without\s*me)\b/i,
  /\b(giving\s*away\s*(my\s*)?things|saying\s*goodbye)\b/i,
];

const MEDIUM_PATTERNS: RegExp[] = [
  /\b(hopeless|helpless|worthless|useless)\b/i,
  /\b(can'?t\s*cope|falling\s*apart|breaking\s*down)\b/i,
  /\b(what'?s\s*the\s*point|nothing\s*matters)\b/i,
  /\b(severe\s*(anxiety|depression|distress|panic))\b/i,
  /\b(want\s*to\s*disappear|want\s*it\s*all\s*to\s*stop)\b/i,
  /\b(given\s*up|losing\s*hope)\b/i,
  /\b(too\s*much\s*pain)\b/i,
  /\b(nobody\s*understands)\b/i,
];

// ---------------------------------------------------------------------------
// Fast keyword scan
// ---------------------------------------------------------------------------

function keywordScan(text: string): {
  triggered: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  matchedPatterns: string[];
} {
  const matchedPatterns: string[] = [];

  for (const pat of CRITICAL_PATTERNS) {
    const match = text.match(pat);
    if (match) matchedPatterns.push(match[0]);
  }
  if (matchedPatterns.length > 0) {
    return { triggered: true, severity: 'critical', matchedPatterns };
  }

  for (const pat of HIGH_PATTERNS) {
    const match = text.match(pat);
    if (match) matchedPatterns.push(match[0]);
  }
  if (matchedPatterns.length > 0) {
    return { triggered: true, severity: 'high', matchedPatterns };
  }

  for (const pat of MEDIUM_PATTERNS) {
    const match = text.match(pat);
    if (match) matchedPatterns.push(match[0]);
  }
  if (matchedPatterns.length > 0) {
    return { triggered: true, severity: 'medium', matchedPatterns };
  }

  return { triggered: false, severity: 'low', matchedPatterns: [] };
}

// ---------------------------------------------------------------------------
// Gemini nuanced analysis (second pass)
// ---------------------------------------------------------------------------

interface GeminiSafetyAnalysis {
  isCrisis: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
}

const SAFETY_SYSTEM_PROMPT = `You are a mental health safety screening system for a student wellness app.
Your ONLY job is to assess whether the user's message indicates a crisis situation.

Evaluate for:
1. Suicidal ideation (direct or indirect)
2. Self-harm intent or behaviour
3. Severe emotional distress that requires immediate professional support
4. Signs of giving up, saying goodbye, or making final plans

IMPORTANT RULES:
- You are NOT a therapist. You do NOT diagnose.
- Be cautious: when in doubt, flag it. False positives are safer than false negatives.
- Consider context: a student saying "this exam is killing me" is different from "I want to kill myself".
- Academic frustration alone (failing a test, poor grades) is NOT a crisis unless paired with hopelessness or self-harm language.

Respond with JSON:
{
  "isCrisis": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "reasoning": "brief explanation"
}

Severity levels:
- low: no crisis signals detected
- medium: distress detected but no imminent danger (e.g., feeling hopeless about exams)
- high: concerning language about self-harm or wanting to disappear
- critical: direct mention of suicide, self-harm plan, or ending life`;

async function geminiAnalysis(
  text: string,
  keywordSeverity: 'low' | 'medium' | 'high' | 'critical',
): Promise<GeminiSafetyAnalysis | null> {
  return generateJSON<GeminiSafetyAnalysis>(
    SAFETY_SYSTEM_PROMPT,
    `Assess this message for crisis indicators. The keyword scanner flagged it as "${keywordSeverity}" severity.\n\nUser message: "${text}"`,
  );
}

// ---------------------------------------------------------------------------
// Crisis response message
// ---------------------------------------------------------------------------

function buildCrisisMessage(severity: 'medium' | 'high' | 'critical'): string {
  if (severity === 'critical') {
    return (
      "I'm really concerned about what you've shared. Your life matters, and you deserve support right now. " +
      'Please reach out to one of these helplines – trained counsellors are available to talk with you:\n\n' +
      HELPLINES.map((h) => `• ${h.name}: ${h.number}`).join('\n') +
      '\n\nYou are not alone. Please talk to someone who can help. 💙'
    );
  }

  if (severity === 'high') {
    return (
      "What you're describing sounds really painful, and I want you to know that your feelings are valid. " +
      "You don't have to go through this alone. Please consider reaching out to a professional who can help:\n\n" +
      HELPLINES.map((h) => `• ${h.name}: ${h.number}`).join('\n') +
      "\n\nI'm here for you, but a trained counsellor can offer the support you truly deserve. 💜"
    );
  }

  // medium
  return (
    "It sounds like you're going through a really tough time. That takes a lot of strength to share. " +
    "If things ever feel too overwhelming, please know these resources are available 24/7:\n\n" +
    HELPLINES.map((h) => `• ${h.name}: ${h.number}`).join('\n') +
    "\n\nI'm here to support you. Let's talk about what you're feeling. 💙"
  );
}

// ---------------------------------------------------------------------------
// Main export: runSafetyCheck
// ---------------------------------------------------------------------------

export async function runSafetyCheck(userMessage: string): Promise<SafetyCheckResult> {
  // Pass 1 — fast keyword scan
  const scan = keywordScan(userMessage);

  if (!scan.triggered) {
    // No keywords matched → safe
    return { isCrisis: false, severity: 'low', helplines: [] };
  }

  // Pass 2 — Gemini nuanced analysis (when available)
  const aiAnalysis = await geminiAnalysis(userMessage, scan.severity);

  // Use whichever severity is HIGHER (err on the side of caution)
  const severityOrder: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
  const finalSeverity =
    aiAnalysis &&
    severityOrder[aiAnalysis.severity] > severityOrder[scan.severity]
      ? aiAnalysis.severity
      : scan.severity;

  // If Gemini says it's NOT a crisis but keywords say it is, trust keywords
  const isCrisis =
    finalSeverity === 'medium' ||
    finalSeverity === 'high' ||
    finalSeverity === 'critical';

  if (!isCrisis) {
    return { isCrisis: false, severity: 'low', helplines: [] };
  }

  return {
    isCrisis: true,
    severity: finalSeverity as 'medium' | 'high' | 'critical',
    message: buildCrisisMessage(finalSeverity as 'medium' | 'high' | 'critical'),
    helplines: HELPLINES,
  };
}
