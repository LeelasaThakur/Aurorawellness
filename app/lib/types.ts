// =============================================================================
// Aurora Wellness – Shared TypeScript Types
// =============================================================================

// ── User Profile ──────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  age?: number;
  examType: 'NEET' | 'JEE' | 'UPSC' | 'CAT' | 'GATE' | 'boards' | 'other';
  examDate?: string;            // ISO date string
  goals: string[];
  strengths: string[];
  struggles: string[];
  preferredName?: string;       // how they want to be addressed
  createdAt: string;
  updatedAt: string;
}

// ── Daily Check-in ────────────────────────────────────────────────────────────

export interface DailyCheckin {
  id: string;
  date: string;                 // ISO date string (YYYY-MM-DD)
  mood: number;                 // 1-10
  stress: number;               // 1-10
  energy: number;               // 1-10
  sleep: number;                // hours (0-24)
  sleepQuality: number;         // 1-10
  confidence: number;           // 1-10
  studyHours: number;           // hours
  breaksTaken: number;          // count
  socialInteraction: number;    // 1-10
  gratitude?: string;
  todayGoal?: string;
  notes?: string;
  createdAt: string;
}

// ── Journal Entry ─────────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  content: string;
  date: string;                 // ISO date string
  analysis?: JournalAnalysis;
  createdAt: string;
}

export interface JournalAnalysis {
  emotionalSignals: string[];
  academicSignals: string[];
  environmentalSignals: string[];
  sentimentScore: number;       // -1 to 1
  summary: string;
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  emotionalContext?: EmotionalContext;
  isCrisis?: boolean;
}

export interface EmotionalContext {
  dominantEmotion: string;
  emotionalSignals: string[];
  sentimentScore: number;
}

export interface ChatResponse {
  message: string;
  emotionalContext?: EmotionalContext;
  suggestions?: WellnessAction[];
  isCrisis?: boolean;
  crisisInfo?: CrisisInfo;
}

// ── Safety / Crisis ───────────────────────────────────────────────────────────

export interface SafetyCheckResult {
  isCrisis: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message?: string;
  helplines: Helpline[];
}

export interface Helpline {
  name: string;
  number: string;
}

export interface CrisisInfo {
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  helplines: Helpline[];
}

// ── Wellness ──────────────────────────────────────────────────────────────────

export interface WellnessScore {
  id: string;
  date: string;
  burnoutScore: number;         // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  factors: WellnessFactor[];
  explanation: string;
  createdAt: string;
}

export interface WellnessFactor {
  name: string;
  value: number;                // 0-100
  impact: string;               // positive, negative, or neutral
}

export interface BurnoutResult {
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: WellnessFactor[];
  explanation: string;
}

// ── Wellness Actions ──────────────────────────────────────────────────────────

export interface WellnessAction {
  type: 'coping' | 'recovery' | 'encouragement';
  title: string;
  content: string;
  exercise?: WellnessExercise;
}

export interface WellnessExercise {
  name: string;
  steps: string[];
  duration: string;
}

// ── Motivation ────────────────────────────────────────────────────────────────

export interface MotivationResult {
  quote: string;
  author: string;
  category: string;
  personalMessage: string;
}

// ── Pattern Detection ─────────────────────────────────────────────────────────

export interface PatternResult {
  patterns: DetectedPattern[];
  weeklyInsights: string[];
  monthlyInsights: string[];
}

export interface DetectedPattern {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'alert';
  data?: Record<string, unknown>;
}

// ── Achievements ──────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: 'streak' | 'wellness' | 'journal' | 'milestone';
}

// ── Streak ────────────────────────────────────────────────────────────────────

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckinDate: string;
}

// ── App State ─────────────────────────────────────────────────────────────────

export interface AuroraState {
  profile: UserProfile | null;
  isOnboarded: boolean;
  chatHistory: ChatMessage[];
  recentCheckins: DailyCheckin[];
  recentJournals: JournalEntry[];
  wellnessScores: WellnessScore[];
  streak: StreakData;
  achievements: Achievement[];
}
