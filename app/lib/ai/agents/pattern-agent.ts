// =============================================================================
// Aurora Wellness – Pattern Detection Agent
// =============================================================================
// Analyses historical check-in and journal data to identify behavioural
// patterns and trends. Uses statistical analysis + Gemini for insight text.
// =============================================================================

import { generateJSON } from '@/app/lib/ai/gemini';
import type {
  DailyCheckin,
  JournalEntry,
  PatternResult,
  DetectedPattern,
} from '@/app/lib/types';

// ---------------------------------------------------------------------------
// Statistical helpers
// ---------------------------------------------------------------------------

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function trend(values: number[]): 'improving' | 'declining' | 'stable' {
  if (values.length < 3) return 'stable';
  const first = average(values.slice(0, Math.ceil(values.length / 2)));
  const second = average(values.slice(Math.floor(values.length / 2)));
  const diff = second - first;
  if (diff > 0.5) return 'improving';
  if (diff < -0.5) return 'declining';
  return 'stable';
}

function correlation(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return 0;
  const mx = average(xs.slice(0, n));
  const my = average(ys.slice(0, n));
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const xi = xs[i] - mx;
    const yi = ys[i] - my;
    num += xi * yi;
    dx += xi * xi;
    dy += yi * yi;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : Math.round((num / denom) * 100) / 100;
}

function dayOfWeek(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
}

// ---------------------------------------------------------------------------
// Pattern analysis (statistical)
// ---------------------------------------------------------------------------

function analysePatterns(
  checkins: DailyCheckin[],
  journals: JournalEntry[],
): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  if (checkins.length < 3) {
    patterns.push({
      title: 'Getting started',
      description:
        'Keep logging your daily check-ins! I need at least 3-5 days of data to start spotting patterns for you.',
      severity: 'info',
    });
    return patterns;
  }

  // Sort chronologically
  const sorted = [...checkins].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const moods = sorted.map((c) => c.mood);
  const stresses = sorted.map((c) => c.stress);
  const energies = sorted.map((c) => c.energy);
  const sleeps = sorted.map((c) => c.sleep);
  const sleepQualities = sorted.map((c) => c.sleepQuality);
  const confidences = sorted.map((c) => c.confidence);
  const studyHours = sorted.map((c) => c.studyHours);

  // 1. Mood trend
  const moodTrend = trend(moods);
  if (moodTrend === 'declining') {
    patterns.push({
      title: 'Mood is trending down',
      description:
        'Your mood has been declining over the recent period. This is worth paying attention to — consider what might be contributing and whether you need a change of pace.',
      severity: 'warning',
      data: { trend: moodTrend, recentAvg: Math.round(average(moods.slice(-3)) * 10) / 10 },
    });
  } else if (moodTrend === 'improving') {
    patterns.push({
      title: 'Mood is improving! 🎉',
      description:
        "Your mood has been getting better recently. Whatever you're doing, it's working — keep it up!",
      severity: 'info',
      data: { trend: moodTrend },
    });
  }

  // 2. Sleep-mood correlation
  const sleepMoodCorr = correlation(sleepQualities, moods);
  if (Math.abs(sleepMoodCorr) > 0.5) {
    patterns.push({
      title: 'Sleep quality affects your mood',
      description:
        sleepMoodCorr > 0
          ? `There's a strong connection (r=${sleepMoodCorr}) between your sleep quality and mood. Nights when you sleep better, you feel better the next day. Prioritising sleep could be your superpower.`
          : `Interestingly, your mood and sleep quality seem inversely related (r=${sleepMoodCorr}). This might mean stress is disrupting your sleep on bad days.`,
      severity: sleepMoodCorr > 0 ? 'info' : 'warning',
      data: { correlation: sleepMoodCorr },
    });
  }

  // 3. Stress spikes on specific days
  const dayStress: Record<string, number[]> = {};
  for (const c of sorted) {
    const day = dayOfWeek(c.date);
    if (!dayStress[day]) dayStress[day] = [];
    dayStress[day].push(c.stress);
  }
  const avgStress = average(stresses);
  for (const [day, values] of Object.entries(dayStress)) {
    const dayAvg = average(values);
    if (dayAvg > avgStress + 1.5 && values.length >= 2) {
      patterns.push({
        title: `${day}s are your most stressful days`,
        description: `Your stress tends to spike on ${day}s (avg ${dayAvg.toFixed(1)} vs overall ${avgStress.toFixed(1)}). Consider scheduling lighter study or self-care activities on this day.`,
        severity: 'warning',
        data: { day, dayAverage: dayAvg, overallAverage: avgStress },
      });
    }
  }

  // 4. Confidence drops after high study hours
  const studyConfCorr = correlation(studyHours, confidences);
  if (studyConfCorr < -0.4) {
    patterns.push({
      title: 'Long study hours may be hurting confidence',
      description:
        'Your confidence tends to drop on days with more study hours. This might mean marathon sessions are causing fatigue and self-doubt. Try shorter, focused sessions with regular breaks.',
      severity: 'warning',
      data: { correlation: studyConfCorr },
    });
  }

  // 5. Burnout indicator — declining energy + high stress
  const energyTrend = trend(energies);
  const stressTrend = trend(stresses);
  if (energyTrend === 'declining' && (stressTrend === 'improving' || average(stresses.slice(-3)) > 6)) {
    // "improving" stress trend means stress values are going UP (getting worse)
    patterns.push({
      title: '⚠️ Burnout risk detected',
      description:
        'Your energy is declining while stress remains high. This combination is a classic burnout signal. Please consider taking a proper rest day soon.',
      severity: 'alert',
      data: { energyTrend, recentStressAvg: average(stresses.slice(-3)) },
    });
  }

  // 6. Low sleep pattern
  const recentSleep = sleeps.slice(-5);
  if (recentSleep.length >= 3 && average(recentSleep) < 6) {
    patterns.push({
      title: 'You are consistently under-sleeping',
      description: `Your average sleep over the last ${recentSleep.length} days is ${average(recentSleep).toFixed(1)} hours. Research shows students need 7-9 hours for optimal memory consolidation. Sleep is study time for your brain.`,
      severity: 'alert',
      data: { avgSleep: average(recentSleep) },
    });
  }

  // 7. Journal sentiment patterns
  if (journals.length >= 3) {
    const sentiments = journals
      .filter((j) => j.analysis?.sentimentScore !== undefined)
      .map((j) => j.analysis!.sentimentScore);
    if (sentiments.length >= 3) {
      const sentimentTrend = trend(sentiments);
      if (sentimentTrend === 'declining') {
        patterns.push({
          title: 'Journal entries are becoming more negative',
          description:
            'The emotional tone of your recent journal entries has been shifting more negative. Writing about what\'s bothering you is healthy — and if things feel too heavy, talking to someone can help.',
          severity: 'warning',
        });
      }
    }

    // Peer comparison detection
    const peerEntries = journals.filter(
      (j) => j.analysis?.environmentalSignals?.includes('peer-comparison'),
    );
    if (peerEntries.length >= 2) {
      patterns.push({
        title: 'Peer comparison is a recurring theme',
        description:
          "You've been comparing yourself to others in multiple journal entries. Remember, everyone's journey is different — your only real competition is who you were yesterday.",
        severity: 'warning',
      });
    }
  }

  return patterns;
}

// ---------------------------------------------------------------------------
// Insight generation
// ---------------------------------------------------------------------------

function generateStaticInsights(
  checkins: DailyCheckin[],
  patterns: DetectedPattern[],
  period: 'weekly' | 'monthly',
): string[] {
  const insights: string[] = [];

  if (checkins.length === 0) {
    return ['Start logging daily check-ins to unlock personalised insights!'];
  }

  const moods = checkins.map((c) => c.mood);
  const avgMood = average(moods);
  const avgStress = average(checkins.map((c) => c.stress));
  const avgSleep = average(checkins.map((c) => c.sleep));

  insights.push(
    `Your average mood this ${period === 'weekly' ? 'week' : 'month'} was ${avgMood.toFixed(1)}/10.`,
  );

  if (avgStress > 7) {
    insights.push(
      'Stress levels have been consistently high. Consider incorporating more breaks and relaxation techniques.',
    );
  } else if (avgStress < 4) {
    insights.push(
      "Stress levels are well managed — great job maintaining balance!",
    );
  }

  if (avgSleep < 6.5) {
    insights.push(
      `Average sleep of ${avgSleep.toFixed(1)}h is below the recommended 7-9 hours. Sleep is critical for memory and performance.`,
    );
  }

  const alerts = patterns.filter((p) => p.severity === 'alert');
  if (alerts.length > 0) {
    insights.push(
      `${alerts.length} alert(s) detected that need your attention. Please review your patterns.`,
    );
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Gemini-enhanced insights (optional enhancement)
// ---------------------------------------------------------------------------

const PATTERN_SYSTEM_PROMPT = `You are an insightful wellness pattern analyst for a student wellness app.

Given the statistical patterns detected and the raw check-in data summary, generate:
1. weeklyInsights: 2-3 concise insights for the last 7 days
2. monthlyInsights: 2-3 concise insights for the last 30 days

Rules:
- Be specific and data-driven
- Offer actionable observations, not vague advice
- NEVER diagnose any condition
- Keep each insight to 1-2 sentences
- Be encouraging even when sharing concerning patterns

Return JSON:
{
  "weeklyInsights": ["insight 1", "insight 2"],
  "monthlyInsights": ["insight 1", "insight 2"]
}`;

// ---------------------------------------------------------------------------
// Main export: detectPatterns
// ---------------------------------------------------------------------------

export async function detectPatterns(
  checkins: DailyCheckin[],
  journals: JournalEntry[],
): Promise<PatternResult> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const weeklyCheckins = checkins.filter((c) => new Date(c.date) >= weekAgo);
  const monthlyCheckins = checkins.filter((c) => new Date(c.date) >= monthAgo);

  const patterns = analysePatterns(monthlyCheckins, journals);

  // Try Gemini for richer insights
  const aiInsights = await generateJSON<{
    weeklyInsights: string[];
    monthlyInsights: string[];
  }>(
    PATTERN_SYSTEM_PROMPT,
    `Detected patterns:\n${patterns.map((p) => `- ${p.title}: ${p.description}`).join('\n')}\n\nWeekly check-ins (${weeklyCheckins.length}): avg mood ${average(weeklyCheckins.map((c) => c.mood)).toFixed(1)}, avg stress ${average(weeklyCheckins.map((c) => c.stress)).toFixed(1)}\nMonthly check-ins (${monthlyCheckins.length}): avg mood ${average(monthlyCheckins.map((c) => c.mood)).toFixed(1)}, avg stress ${average(monthlyCheckins.map((c) => c.stress)).toFixed(1)}`,
  );

  return {
    patterns,
    weeklyInsights:
      aiInsights?.weeklyInsights ??
      generateStaticInsights(weeklyCheckins, patterns, 'weekly'),
    monthlyInsights:
      aiInsights?.monthlyInsights ??
      generateStaticInsights(monthlyCheckins, patterns, 'monthly'),
  };
}
