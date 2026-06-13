// =============================================================================
// Aurora Wellness – Client-Side Data Store (localStorage)
// =============================================================================
// This file is intended for CLIENT-SIDE use only. API routes receive data
// from the client in request bodies. All data is persisted in localStorage.
// =============================================================================

import type {
  UserProfile,
  DailyCheckin,
  JournalEntry,
  ChatMessage,
  Achievement,
  WellnessScore,
  StreakData,
} from '@/app/lib/types';

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const KEYS = {
  PROFILE: 'aurora_profile',
  CHECKINS: 'aurora_checkins',
  JOURNALS: 'aurora_journals',
  CHAT: 'aurora_chat',
  ACHIEVEMENTS: 'aurora_achievements',
  WELLNESS: 'aurora_wellness',
  STREAK: 'aurora_streak',
  ONBOARDING: 'aurora_onboarding',
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`[Store] Failed to write key "${key}":`, error);
  }
}

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------

export function getUserProfile(): UserProfile | null {
  return getItem<UserProfile>(KEYS.PROFILE);
}

export function saveUserProfile(profile: UserProfile): void {
  setItem(KEYS.PROFILE, { ...profile, updatedAt: new Date().toISOString() });
}

// ---------------------------------------------------------------------------
// Daily Check-ins
// ---------------------------------------------------------------------------

export function getDailyCheckins(days?: number): DailyCheckin[] {
  const all = getItem<DailyCheckin[]>(KEYS.CHECKINS) ?? [];
  if (!days) return all;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return all.filter((c) => new Date(c.date) >= cutoff);
}

export function saveDailyCheckin(checkin: DailyCheckin): void {
  const all = getItem<DailyCheckin[]>(KEYS.CHECKINS) ?? [];

  // Replace if same date already exists, otherwise append
  const idx = all.findIndex((c) => c.date === checkin.date);
  if (idx >= 0) {
    all[idx] = checkin;
  } else {
    all.push(checkin);
  }

  // Keep sorted by date (newest first)
  all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  setItem(KEYS.CHECKINS, all);
}

// ---------------------------------------------------------------------------
// Journal Entries
// ---------------------------------------------------------------------------

export function getJournalEntries(limit?: number): JournalEntry[] {
  const all = getItem<JournalEntry[]>(KEYS.JOURNALS) ?? [];
  // Already sorted newest-first
  return limit ? all.slice(0, limit) : all;
}

export function saveJournalEntry(entry: JournalEntry): void {
  const all = getItem<JournalEntry[]>(KEYS.JOURNALS) ?? [];
  all.unshift(entry); // add to front (newest first)
  setItem(KEYS.JOURNALS, all);
}

// ---------------------------------------------------------------------------
// Chat History
// ---------------------------------------------------------------------------

export function getChatHistory(): ChatMessage[] {
  return getItem<ChatMessage[]>(KEYS.CHAT) ?? [];
}

export function saveChatMessage(message: ChatMessage): void {
  const all = getItem<ChatMessage[]>(KEYS.CHAT) ?? [];
  all.push(message);
  // Keep last 200 messages to avoid localStorage limits
  if (all.length > 200) all.splice(0, all.length - 200);
  setItem(KEYS.CHAT, all);
}

export function clearChatHistory(): void {
  setItem(KEYS.CHAT, []);
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

export function getAchievements(): Achievement[] {
  return getItem<Achievement[]>(KEYS.ACHIEVEMENTS) ?? [];
}

export function saveAchievement(achievement: Achievement): void {
  const all = getItem<Achievement[]>(KEYS.ACHIEVEMENTS) ?? [];
  // Prevent duplicates
  if (!all.some((a) => a.id === achievement.id)) {
    all.push(achievement);
    setItem(KEYS.ACHIEVEMENTS, all);
  }
}

// ---------------------------------------------------------------------------
// Wellness Scores
// ---------------------------------------------------------------------------

export function getWellnessScores(days?: number): WellnessScore[] {
  const all = getItem<WellnessScore[]>(KEYS.WELLNESS) ?? [];
  if (!days) return all;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return all.filter((s) => new Date(s.date) >= cutoff);
}

export function saveWellnessScore(score: WellnessScore): void {
  const all = getItem<WellnessScore[]>(KEYS.WELLNESS) ?? [];
  all.unshift(score);
  setItem(KEYS.WELLNESS, all);
}

// ---------------------------------------------------------------------------
// Streak Management
// ---------------------------------------------------------------------------

export function getStreakData(): StreakData {
  return (
    getItem<StreakData>(KEYS.STREAK) ?? {
      currentStreak: 0,
      longestStreak: 0,
      lastCheckinDate: '',
    }
  );
}

export function updateStreak(): void {
  const streak = getStreakData();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  if (streak.lastCheckinDate === today) return; // Already counted today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (streak.lastCheckinDate === yesterdayStr) {
    // Continuing the streak
    streak.currentStreak += 1;
  } else {
    // Streak broken – reset
    streak.currentStreak = 1;
  }

  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  streak.lastCheckinDate = today;
  setItem(KEYS.STREAK, streak);
}

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

export function isOnboardingComplete(): boolean {
  return getItem<boolean>(KEYS.ONBOARDING) === true;
}

export function completeOnboarding(): void {
  setItem(KEYS.ONBOARDING, true);
}
