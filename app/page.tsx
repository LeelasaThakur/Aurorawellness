'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageCircle,
  Activity,
  BookOpen,
  LayoutDashboard,
  Sparkles,
  Settings,
  Home,
  Menu,
  X,
  Mic,
  MicOff,
  Send,
  Trophy,
  Calendar,
  Flame,
  Heart,
  Sun,
  Moon,
  ChevronRight,
  AlertTriangle,
  Phone,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */
interface UserProfile {
  name: string;
  age: number;
  exam: string;
  targetScore: string;
  subjects: string[];
  prepStage: string;
  studySchedule: string;
  resilienceAnchors: {
    proudAchievement: string;
    challengeOvercome: string;
    motivation: string;
  };
  createdAt: string;
}

interface DailyCheckin {
  id: string;
  date: string;
  mood: number;
  energy: number;
  stress: number;
  confidence: number;
  sleepQuality: number;
  studySatisfaction: number;
}

interface JournalEntry {
  id: string;
  content: string;
  emotionalSignals: string[];
  academicSignals: string[];
  environmentalSignals: string[];
  sentimentScore: number;
  summary: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  emotionalContext?: string[];
  isCrisis?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  earnedAt: string;
}

interface WellnessScore {
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: { name: string; value: number; impact: string }[];
  explanation: string;
  calculatedAt: string;
}

type AppView = 'home' | 'chat' | 'checkin' | 'journal' | 'dashboard' | 'exercises' | 'settings' | 'onboarding';
type AuroraState = 'idle' | 'listening' | 'speaking' | 'encouraging';

/* ------------------------------------------------------------------ */
/*  LOCAL STORAGE HELPERS                                              */
/* ------------------------------------------------------------------ */
function getStore<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setStore<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ------------------------------------------------------------------ */
/*  SAFETY AGENT (CLIENT-SIDE FAST PATH)                               */
/* ------------------------------------------------------------------ */
const CRISIS_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
  'don\'t want to live', 'no reason to live', 'self-harm', 'self harm',
  'hurt myself', 'cutting myself', 'end it all', 'better off dead',
  'can\'t go on', 'give up on life', 'hopeless',
];

const HELPLINES = [
  { name: 'iCall', number: '9152987821', desc: 'Mon–Sat, 8am–10pm' },
  { name: 'Vandrevala Foundation', number: '1860-2662-345', desc: '24/7' },
  { name: 'NIMHANS', number: '080-46110007', desc: '24/7' },
  { name: 'AASRA', number: '9820466726', desc: '24/7' },
];

function checkCrisis(text: string): { isCrisis: boolean; severity: string } {
  const lower = text.toLowerCase();
  for (const keyword of CRISIS_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { isCrisis: true, severity: 'critical' };
    }
  }
  return { isCrisis: false, severity: 'none' };
}

/* ------------------------------------------------------------------ */
/*  MOTIVATION QUOTES DATABASE                                         */
/* ------------------------------------------------------------------ */
const QUOTES_DB = [
  { quote: "You may encounter many defeats, but you must not be defeated.", author: "Maya Angelou", category: "resilience" },
  { quote: "Be yourself; everyone else is already taken.", author: "Oscar Wilde", category: "self-belief" },
  { quote: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle", category: "perseverance" },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "passion" },
  { quote: "In the middle of difficulty lies opportunity.", author: "Albert Einstein", category: "resilience" },
  { quote: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie", category: "courage" },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "dreams" },
  { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "perseverance" },
  { quote: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne", category: "self-belief" },
  { quote: "Where there is a will, there is a way.", author: "Rabindranath Tagore", category: "determination" },
  { quote: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela", category: "education" },
  { quote: "The best way to predict your future is to create it.", author: "Abraham Lincoln", category: "purpose" },
  { quote: "All great achievements require time.", author: "Maya Angelou", category: "patience" },
  { quote: "One child, one teacher, one book, one pen can change the world.", author: "Malala Yousafzai", category: "education" },
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", category: "resilience" },
  { quote: "The only impossible journey is the one you never begin.", author: "Tony Robbins", category: "beginning" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", category: "self-belief" },
  { quote: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", category: "inner-strength" },
  { quote: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi", category: "purpose" },
  { quote: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis", category: "resilience" },
];

function getContextualQuote(context: string): { quote: string; author: string } {
  const lower = context.toLowerCase();
  let category = 'resilience';
  if (lower.includes('fail') || lower.includes('mock test') || lower.includes('score')) category = 'resilience';
  else if (lower.includes('overwhelm') || lower.includes('stress') || lower.includes('pressure')) category = 'perseverance';
  else if (lower.includes('motivat') || lower.includes('purpose') || lower.includes('why')) category = 'purpose';
  else if (lower.includes('confiden') || lower.includes('doubt') || lower.includes('believe')) category = 'self-belief';
  else if (lower.includes('afraid') || lower.includes('fear') || lower.includes('scared')) category = 'courage';

  const matching = QUOTES_DB.filter(q => q.category === category);
  const pool = matching.length > 0 ? matching : QUOTES_DB;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ------------------------------------------------------------------ */
/*  BURNOUT CALCULATOR                                                 */
/* ------------------------------------------------------------------ */
function calculateBurnout(checkins: DailyCheckin[]): WellnessScore {
  if (checkins.length === 0) {
    return { score: 25, riskLevel: 'low', factors: [], explanation: 'Complete your first check-in to get a personalized burnout score.', calculatedAt: new Date().toISOString() };
  }

  const recent = checkins.slice(-7);
  const avgMood = recent.reduce((s, c) => s + c.mood, 0) / recent.length;
  const avgEnergy = recent.reduce((s, c) => s + c.energy, 0) / recent.length;
  const avgStress = recent.reduce((s, c) => s + c.stress, 0) / recent.length;
  const avgConfidence = recent.reduce((s, c) => s + c.confidence, 0) / recent.length;
  const avgSleep = recent.reduce((s, c) => s + c.sleepQuality, 0) / recent.length;
  const avgStudy = recent.reduce((s, c) => s + c.studySatisfaction, 0) / recent.length;

  // Invert positive metrics, keep negative ones
  const moodFactor = (10 - avgMood) * 10; // Low mood = high burnout
  const energyFactor = (10 - avgEnergy) * 10;
  const stressFactor = avgStress * 10; // High stress = high burnout
  const confidenceFactor = (10 - avgConfidence) * 10;
  const sleepFactor = (10 - avgSleep) * 10;
  const studyFactor = (10 - avgStudy) * 10;

  const score = Math.round(
    moodFactor * 0.20 +
    sleepFactor * 0.15 +
    stressFactor * 0.20 +
    confidenceFactor * 0.15 +
    energyFactor * 0.15 +
    studyFactor * 0.15
  );

  const clampedScore = Math.max(0, Math.min(100, score));
  const riskLevel: 'low' | 'medium' | 'high' = clampedScore <= 33 ? 'low' : clampedScore <= 66 ? 'medium' : 'high';

  const factors = [
    { name: 'Mood', value: Math.round(avgMood * 10), impact: avgMood < 5 ? 'Declining mood is a concern' : 'Mood is stable' },
    { name: 'Stress', value: Math.round(avgStress * 10), impact: avgStress > 6 ? 'High stress levels detected' : 'Stress is manageable' },
    { name: 'Sleep', value: Math.round(avgSleep * 10), impact: avgSleep < 5 ? 'Poor sleep quality affects recovery' : 'Sleep quality is adequate' },
    { name: 'Energy', value: Math.round(avgEnergy * 10), impact: avgEnergy < 4 ? 'Low energy indicates exhaustion' : 'Energy levels are ok' },
    { name: 'Confidence', value: Math.round(avgConfidence * 10), impact: avgConfidence < 4 ? 'Low confidence needs attention' : 'Confidence is building' },
  ];

  let explanation = '';
  if (riskLevel === 'low') explanation = 'You\'re doing well! Keep maintaining your balance.';
  else if (riskLevel === 'medium') explanation = 'Your wellness needs some attention. Consider taking more breaks and focusing on sleep.';
  else explanation = 'Your burnout risk is elevated. Please prioritize rest, reach out to someone you trust, and consider reducing study hours temporarily.';

  return { score: clampedScore, riskLevel, factors, explanation, calculatedAt: new Date().toISOString() };
}

/* ------------------------------------------------------------------ */
/*  AURORA AVATAR COMPONENT                                            */
/* ------------------------------------------------------------------ */
function AuroraAvatar({ state = 'idle', size = 'lg' }: { state: AuroraState; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'w-20 h-20', md: 'w-32 h-32', lg: 'w-48 h-48' };
  const ringSize = { sm: 'w-28 h-28', md: 'w-44 h-44', lg: 'w-64 h-64' };

  return (
    <div className="relative flex items-center justify-center" role="img" aria-label={`Aurora avatar - ${state}`}>
      {/* Outer glow rings */}
      {state === 'listening' && (
        <>
          {[0, 1, 2].map(i => (
            <motion.div
              key={`ring-${i}`}
              className={`absolute ${ringSize[size]} rounded-full border-2 border-amber-400/30`}
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: [0.8, 1.4 + i * 0.2], opacity: [0.6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
            />
          ))}
        </>
      )}

      {/* Speaking wave rings */}
      {state === 'speaking' && (
        <>
          {[0, 1, 2, 3].map(i => (
            <motion.div
              key={`wave-${i}`}
              className={`absolute ${ringSize[size]} rounded-full border border-amber-300/20`}
              animate={{
                scale: [1, 1.2 + i * 0.1, 1],
                opacity: [0.4, 0.1, 0.4],
              }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </>
      )}

      {/* Main sphere */}
      <motion.div
        className={`${sizeMap[size]} rounded-full relative overflow-hidden`}
        style={{
          background: state === 'encouraging'
            ? 'radial-gradient(circle at 35% 35%, #FDE68A 0%, #FBBF24 30%, #F59E0B 60%, #D97706 100%)'
            : 'radial-gradient(circle at 35% 35%, #FCD34D 0%, #F59E0B 40%, #D97706 70%, #B45309 100%)',
          boxShadow: state === 'encouraging'
            ? '0 0 60px rgba(251, 191, 36, 0.5), 0 0 120px rgba(245, 158, 11, 0.3), inset 0 -10px 30px rgba(180, 83, 9, 0.3)'
            : '0 0 40px rgba(245, 158, 11, 0.3), 0 0 80px rgba(245, 158, 11, 0.1), inset 0 -10px 30px rgba(180, 83, 9, 0.4)',
        }}
        animate={
          state === 'idle' ? { y: [0, -12, 0], scale: [1, 1.02, 1] } :
          state === 'listening' ? { scale: [1, 1.06, 1] } :
          state === 'speaking' ? { scale: [1, 1.08, 0.95, 1.05, 1] } :
          { scale: [1, 1.05, 1] }
        }
        transition={
          state === 'idle' ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } :
          state === 'listening' ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } :
          state === 'speaking' ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } :
          { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        {/* Inner shine */}
        <div
          className="absolute top-[15%] left-[20%] w-[30%] h-[30%] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)',
          }}
        />
        {/* Breathing overlay */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, transparent 40%, rgba(180,83,9,0.2) 100%)' }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Floating particles */}
      {(state === 'idle' || state === 'encouraging') && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1.5 h-1.5 rounded-full bg-amber-300/60"
              style={{
                left: `${30 + Math.random() * 40}%`,
                bottom: '20%',
              }}
              animate={{
                y: [-20, -80 - Math.random() * 40],
                x: [0, (Math.random() - 0.5) * 30],
                opacity: [0, 0.8, 0],
                scale: [0.5, 1, 0.3],
              }}
              transition={{
                duration: 2.5 + Math.random() * 1.5,
                repeat: Infinity,
                delay: i * 0.6,
                ease: 'easeOut',
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BURNOUT GAUGE COMPONENT                                            */
/* ------------------------------------------------------------------ */
function BurnoutGauge({ score, riskLevel, explanation }: { score: number; riskLevel: string; explanation: string }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = riskLevel === 'low' ? '#10B981' : riskLevel === 'medium' ? '#F59E0B' : '#EF4444';

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label={`Burnout score: ${score} out of 100, ${riskLevel} risk`}>
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <motion.circle
          cx="80" cy="80" r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          transform="rotate(-90 80 80)"
        />
        <text x="80" y="72" textAnchor="middle" className="fill-white text-3xl font-bold" style={{ fontSize: '2rem' }}>
          {score}
        </text>
        <text x="80" y="95" textAnchor="middle" className="fill-white/60 text-xs" style={{ fontSize: '0.7rem' }}>
          / 100
        </text>
      </svg>
      <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
        riskLevel === 'low' ? 'bg-emerald-500/20 text-emerald-400' :
        riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400' :
        'bg-red-500/20 text-red-400'
      }`}>
        {riskLevel === 'low' ? '✓ Low Risk' : riskLevel === 'medium' ? '⚠ Medium Risk' : '⚠ High Risk'}
      </span>
      <p className="text-xs text-white/50 text-center max-w-[200px]">{explanation}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DAILY CHECK-IN COMPONENT                                           */
/* ------------------------------------------------------------------ */
function DailyCheckinView({ onComplete }: { onComplete: () => void }) {
  const [values, setValues] = useState({ mood: 5, energy: 5, stress: 5, confidence: 5, sleepQuality: 5, studySatisfaction: 5 });
  const [submitted, setSubmitted] = useState(false);

  const metrics = [
    { key: 'mood', label: 'Mood', emojis: ['😢', '😔', '😐', '🙂', '😊', '😄'], color: 'from-rose-500 to-amber-500' },
    { key: 'energy', label: 'Energy', emojis: ['😴', '🥱', '😐', '💪', '⚡', '🔥'], color: 'from-blue-500 to-emerald-500' },
    { key: 'stress', label: 'Stress Level', emojis: ['😌', '🙂', '😐', '😰', '😫', '🤯'], color: 'from-emerald-500 to-red-500' },
    { key: 'confidence', label: 'Confidence', emojis: ['😟', '🤔', '😐', '😊', '💪', '🌟'], color: 'from-violet-500 to-amber-500' },
    { key: 'sleepQuality', label: 'Sleep Quality', emojis: ['😵', '😴', '😐', '😊', '😴', '💤'], color: 'from-indigo-500 to-sky-400' },
    { key: 'studySatisfaction', label: 'Study Satisfaction', emojis: ['😞', '😕', '😐', '🙂', '📚', '🎯'], color: 'from-pink-500 to-violet-500' },
  ];

  const getEmoji = (value: number, emojis: string[]) => {
    const index = Math.min(Math.floor((value - 1) / 2), emojis.length - 1);
    return emojis[Math.max(0, index)];
  };

  const handleSubmit = () => {
    const checkin: DailyCheckin = {
      id: generateId(),
      date: new Date().toISOString().split('T')[0],
      ...values,
    };
    const existing = getStore<DailyCheckin[]>('aurora_checkins', []);
    existing.push(checkin);
    setStore('aurora_checkins', existing);

    // Update streak
    const streakData = getStore('aurora_streak', { current: 0, longest: 0, lastDate: '' });
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (streakData.lastDate === yesterday) {
      streakData.current += 1;
    } else if (streakData.lastDate !== today) {
      streakData.current = 1;
    }
    streakData.longest = Math.max(streakData.longest, streakData.current);
    streakData.lastDate = today;
    setStore('aurora_streak', streakData);

    setSubmitted(true);
    setTimeout(() => onComplete(), 2000);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center gap-6 py-12"
      >
        <AuroraAvatar state="encouraging" size="md" />
        <h2 className="text-2xl font-bold text-amber-400 aurora-text-glow">Check-in Complete! ✨</h2>
        <p className="text-white/70 text-center max-w-md">
          Thank you for checking in. Remember, every day you show up for yourself is a victory.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Daily Check-in</h2>
        <p className="text-white/50">How are you feeling today?</p>
      </div>

      {metrics.map(({ key, label, emojis, color }) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <label htmlFor={`checkin-${key}`} className="text-sm font-medium text-white/80">{label}</label>
            <motion.span
              key={values[key as keyof typeof values]}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="text-2xl"
              aria-hidden="true"
            >
              {getEmoji(values[key as keyof typeof values], emojis)}
            </motion.span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40 w-4">1</span>
            <input
              id={`checkin-${key}`}
              type="range"
              min="1"
              max="10"
              value={values[key as keyof typeof values]}
              onChange={(e) => setValues(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
              className="flex-1"
              aria-label={`${label}: ${values[key as keyof typeof values]} out of 10`}
              style={{
                background: `linear-gradient(to right, var(--tw-gradient-from, #F59E0B) 0%, var(--tw-gradient-to, #F59E0B) ${(values[key as keyof typeof values] - 1) / 9 * 100}%, rgba(255,255,255,0.1) ${(values[key as keyof typeof values] - 1) / 9 * 100}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
            <span className="text-xs text-white/40 w-4">10</span>
            <span className="text-sm font-semibold text-amber-400 w-6 text-right">{values[key as keyof typeof values]}</span>
          </div>
        </motion.div>
      ))}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-midnight-950 font-bold text-lg shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-shadow"
        aria-label="Submit daily check-in"
      >
        Submit Check-in ✨
      </motion.button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  JOURNAL VIEW COMPONENT                                             */
/* ------------------------------------------------------------------ */
function JournalView() {
  const [content, setContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<JournalEntry | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  const prompts = [
    'How are you feeling about your preparation today?',
    'What challenged you today? What went well?',
    'What would you tell a friend in your situation?',
    'What are you grateful for right now?',
    'Is anything weighing on your mind?',
  ];
  const [promptIndex, setPromptIndex] = useState(0);

  useEffect(() => {
    setEntries(getStore<JournalEntry[]>('aurora_journals', []));
    const interval = setInterval(() => setPromptIndex(p => (p + 1) % prompts.length), 5000);
    return () => clearInterval(interval);
  }, []);

  const analyzeJournal = async () => {
    if (!content.trim()) return;
    setAnalyzing(true);

    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();

      const entry: JournalEntry = {
        id: generateId(),
        content,
        emotionalSignals: data.emotionalSignals || [],
        academicSignals: data.academicSignals || [],
        environmentalSignals: data.environmentalSignals || [],
        sentimentScore: data.sentimentScore || 0,
        summary: data.summary || '',
        createdAt: new Date().toISOString(),
      };

      setResult(entry);
      const allEntries = [...entries, entry];
      setEntries(allEntries);
      setStore('aurora_journals', allEntries);
    } catch {
      // Fallback: keyword-based analysis
      const lower = content.toLowerCase();
      const emotionalSignals: string[] = [];
      const academicSignals: string[] = [];
      const environmentalSignals: string[] = [];

      if (lower.includes('anxious') || lower.includes('worry') || lower.includes('nervous')) emotionalSignals.push('anxiety');
      if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('burnout') || lower.includes('burn out')) emotionalSignals.push('burnout');
      if (lower.includes('frustrated') || lower.includes('angry') || lower.includes('annoyed')) emotionalSignals.push('frustration');
      if (lower.includes('alone') || lower.includes('lonely') || lower.includes('isolated')) emotionalSignals.push('loneliness');
      if (lower.includes('doubt') || lower.includes('can\'t do') || lower.includes('not good enough')) emotionalSignals.push('self-doubt');
      if (lower.includes('overwhelm') || lower.includes('too much') || lower.includes('drowning')) emotionalSignals.push('overwhelm');
      if (lower.includes('motivat') || lower.includes('inspired') || lower.includes('excited')) emotionalSignals.push('motivation');
      if (lower.includes('happy') || lower.includes('glad') || lower.includes('grateful') || lower.includes('proud')) emotionalSignals.push('hope');

      if (lower.includes('procrastinat') || lower.includes('delay') || lower.includes('putting off')) academicSignals.push('procrastination');
      if (lower.includes('productive') || lower.includes('studied well') || lower.includes('covered')) academicSignals.push('productivity');
      if (lower.includes('exam') || lower.includes('test') || lower.includes('mock')) academicSignals.push('exam-pressure');
      if (lower.includes('time') || lower.includes('schedule') || lower.includes('late')) academicSignals.push('time-management');
      if (lower.includes('focus') || lower.includes('concentrate') || lower.includes('distract')) academicSignals.push('focus-issues');

      if (lower.includes('parent') || lower.includes('family') || lower.includes('mom') || lower.includes('dad')) environmentalSignals.push('family-pressure');
      if (lower.includes('friend') || lower.includes('peer') || lower.includes('compar') || lower.includes('topper')) environmentalSignals.push('peer-comparison');
      if (lower.includes('social') || lower.includes('instagram') || lower.includes('media')) environmentalSignals.push('social-pressure');

      if (emotionalSignals.length === 0) emotionalSignals.push('self-reflection');
      if (academicSignals.length === 0) academicSignals.push('general-study');

      const entry: JournalEntry = {
        id: generateId(),
        content,
        emotionalSignals,
        academicSignals,
        environmentalSignals,
        sentimentScore: 0,
        summary: 'Your entry has been recorded. Taking time to reflect is a sign of self-awareness.',
        createdAt: new Date().toISOString(),
      };

      setResult(entry);
      const allEntries = [...entries, entry];
      setEntries(allEntries);
      setStore('aurora_journals', allEntries);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Journal</h2>
        <p className="text-white/50">Express yourself freely. Aurora is here to listen.</p>
      </div>

      <div className="glass-card p-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={promptIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-amber-400/60 text-sm mb-3 italic"
          >
            💡 {prompts[promptIndex]}
          </motion.p>
        </AnimatePresence>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write what's on your mind..."
          className="w-full h-40 bg-transparent border-none outline-none text-white/90 resize-none placeholder:text-white/20 text-lg"
          aria-label="Journal entry"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-white/30">{content.length} characters</span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={analyzeJournal}
            disabled={!content.trim() || analyzing}
            className="px-6 py-2 rounded-lg bg-amber-500/20 text-amber-400 font-medium hover:bg-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {analyzing ? 'Analyzing...' : 'Save & Analyze'}
          </motion.button>
        </div>
      </div>

      {/* Analysis Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 space-y-4"
          >
            <h3 className="text-lg font-semibold text-white">Aurora&apos;s Insights</h3>
            {result.summary && <p className="text-white/70 text-sm">{result.summary}</p>}

            {result.emotionalSignals.length > 0 && (
              <div>
                <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Emotional Signals</p>
                <div className="flex flex-wrap gap-2">
                  {result.emotionalSignals.map(signal => (
                    <span key={signal} className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 text-xs font-medium">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.academicSignals.length > 0 && (
              <div>
                <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Academic Signals</p>
                <div className="flex flex-wrap gap-2">
                  {result.academicSignals.map(signal => (
                    <span key={signal} className="px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-400 text-xs font-medium">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.environmentalSignals.length > 0 && (
              <div>
                <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Environmental Signals</p>
                <div className="flex flex-wrap gap-2">
                  {result.environmentalSignals.map(signal => (
                    <span key={signal} className="px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-400 text-xs font-medium">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setResult(null); setContent(''); }}
              className="text-sm text-amber-400 hover:text-amber-300"
            >
              Write another entry →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Previous entries */}
      {entries.length > 0 && !result && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Previous Entries</h3>
          {entries.slice().reverse().slice(0, 5).map(entry => (
            <div key={entry.id} className="glass-card p-4">
              <p className="text-white/70 text-sm line-clamp-2">{entry.content}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-white/30">{new Date(entry.createdAt).toLocaleDateString()}</span>
                {entry.emotionalSignals.slice(0, 3).map(s => (
                  <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CHAT VIEW COMPONENT                                                */
/* ------------------------------------------------------------------ */
function ChatView({ userProfile }: { userProfile: UserProfile | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [auroraState, setAuroraState] = useState<AuroraState>('idle');
  const [showCrisis, setShowCrisis] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const stored = getStore<ChatMessage[]>('aurora_chat', []);
    if (stored.length === 0) {
      const greeting: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: userProfile?.name
          ? `Hi ${userProfile.name}! 💛 I'm Aurora, your wellness companion. How are you feeling about your ${userProfile.exam || 'exam'} preparation today? I'm here to listen, support, and help you thrive.`
          : `Hi there! 💛 I'm Aurora, your AI wellness companion. I'm here to support you through your exam preparation journey. How are you feeling today?`,
        timestamp: new Date().toISOString(),
      };
      setMessages([greeting]);
      setStore('aurora_chat', [greeting]);
    } else {
      setMessages(stored);
    }
  }, [userProfile]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setStore('aurora_chat', newMessages);
    setInput('');
    setIsTyping(true);
    setAuroraState('speaking');

    // Crisis check (fast path)
    const crisisCheck = checkCrisis(input);
    if (crisisCheck.isCrisis) {
      setShowCrisis(true);
      setIsTyping(false);
      setAuroraState('encouraging');
      const crisisMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `I hear you, and I want you to know that your feelings are valid. You don't have to face this alone. Please reach out to a trusted person — a family member, friend, teacher, or counselor. If you're in crisis, please contact one of these helplines immediately. You matter, and there are people who care about you. 💛`,
        timestamp: new Date().toISOString(),
        isCrisis: true,
      };
      const updated = [...newMessages, crisisMsg];
      setMessages(updated);
      setStore('aurora_chat', updated);
      return;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          profile: userProfile,
          history: newMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();

      const botMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.message || "I'm here with you. Can you tell me more about how you're feeling?",
        timestamp: new Date().toISOString(),
        emotionalContext: data.emotionalContext,
      };

      const updated = [...newMessages, botMsg];
      setMessages(updated);
      setStore('aurora_chat', updated);
    } catch {
      // Fallback response
      const quote = getContextualQuote(input);
      const fallbackResponses = [
        `I understand how you're feeling. ${quote.quote} — ${quote.author}. Remember, it's okay to take things one step at a time. What specific thing is on your mind right now?`,
        `Thank you for sharing that with me. Your feelings are valid. Let's work through this together. What would help you feel a little better right now?`,
        `I hear you. Preparing for exams can be incredibly challenging. ${quote.quote} — ${quote.author}. Would you like to try a quick relaxation exercise, or would you prefer to talk more?`,
      ];

      const botMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        timestamp: new Date().toISOString(),
      };

      const updated = [...newMessages, botMsg];
      setMessages(updated);
      setStore('aurora_chat', updated);
    } finally {
      setIsTyping(false);
      setAuroraState('idle');
    }
  };

  // Voice input
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser. Please use Chrome for the best experience.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      setAuroraState('idle');
      return;
    }

    setIsListening(true);
    setAuroraState('listening');

    const SpeechRecognition = (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      setAuroraState('idle');
    };

    recognition.onerror = () => {
      setIsListening(false);
      setAuroraState('idle');
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Crisis overlay */}
      <AnimatePresence>
        {showCrisis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-midnight-950/95 flex items-center justify-center p-6"
            role="alertdialog"
            aria-label="Crisis support resources"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card p-8 max-w-md w-full space-y-6"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
                <h2 className="text-xl font-bold text-white">You&apos;re Not Alone</h2>
              </div>
              <p className="text-white/70">
                If you&apos;re going through a difficult time, please reach out. These helplines have trained counselors available:
              </p>
              <div className="space-y-3">
                {HELPLINES.map(h => (
                  <a
                    key={h.name}
                    href={`tel:${h.number}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-white font-medium">{h.name}</p>
                      <p className="text-amber-400 text-sm font-bold">{h.number}</p>
                      <p className="text-white/40 text-xs">{h.desc}</p>
                    </div>
                  </a>
                ))}
              </div>
              <button
                onClick={() => setShowCrisis(false)}
                className="w-full py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Continue Chatting
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar */}
      <div className="flex justify-center py-4">
        <AuroraAvatar state={auroraState} size="sm" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 px-4 pb-4" role="log" aria-label="Chat messages" aria-live="polite">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-amber-500/20 text-white'
                  : msg.isCrisis
                  ? 'bg-red-500/10 border border-red-500/20 text-white'
                  : 'bg-white/5 text-white/90'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <p className="text-[10px] text-white/30 mt-2">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-amber-400"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVoice}
            className={`p-3 rounded-xl transition-colors ${
              isListening
                ? 'bg-red-500/20 text-red-400'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Talk to Aurora..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-amber-500/30 transition-colors"
            aria-label="Message input"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            disabled={!input.trim()}
            className="p-3 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-30 transition-colors"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  EXERCISES VIEW                                                     */
/* ------------------------------------------------------------------ */
function ExercisesView() {
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [breathPhase, setBreathPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [breathTimer, setBreathTimer] = useState(0);

  const exercises = [
    { id: 'breath-478', name: '4-7-8 Breathing', desc: 'Calm your nervous system in 2 minutes', duration: '2 min', icon: '🌬️' },
    { id: 'focus-reset', name: 'Focus Recovery', desc: 'Reset your concentration with a quick mindfulness exercise', duration: '5 min', icon: '🎯' },
    { id: 'pre-exam-calm', name: 'Pre-Exam Calm', desc: 'Reduce test anxiety before an exam or mock test', duration: '3 min', icon: '📝' },
    { id: 'sleep-wind-down', name: 'Sleep Wind-Down', desc: 'Prepare your mind for restful sleep', duration: '5 min', icon: '🌙' },
    { id: 'grounding-54321', name: '5-4-3-2-1 Grounding', desc: 'Come back to the present moment', duration: '3 min', icon: '🌍' },
    { id: 'body-scan', name: 'Quick Body Scan', desc: 'Release physical tension from study posture', duration: '4 min', icon: '✨' },
  ];

  useEffect(() => {
    if (activeExercise !== 'breath-478') return;

    const phases = [
      { phase: 'in' as const, duration: 4 },
      { phase: 'hold' as const, duration: 7 },
      { phase: 'out' as const, duration: 8 },
    ];
    let phaseIndex = 0;
    let count = 0;

    const interval = setInterval(() => {
      count++;
      setBreathTimer(phases[phaseIndex].duration - count);

      if (count >= phases[phaseIndex].duration) {
        phaseIndex = (phaseIndex + 1) % phases.length;
        count = 0;
        setBreathPhase(phases[phaseIndex].phase);
        setBreathTimer(phases[phaseIndex].duration);
      }
    }, 1000);

    setBreathPhase('in');
    setBreathTimer(4);
    return () => clearInterval(interval);
  }, [activeExercise]);

  if (activeExercise === 'breath-478') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
        <h2 className="text-2xl font-bold text-white">4-7-8 Breathing</h2>

        <motion.div
          className="w-48 h-48 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.3) 0%, rgba(245,158,11,0.05) 70%)',
            boxShadow: '0 0 60px rgba(245,158,11,0.2)',
          }}
          animate={
            breathPhase === 'in' ? { scale: [1, 1.5] } :
            breathPhase === 'hold' ? { scale: 1.5 } :
            { scale: [1.5, 1] }
          }
          transition={{
            duration: breathPhase === 'in' ? 4 : breathPhase === 'hold' ? 7 : 8,
            ease: 'easeInOut',
          }}
        >
          <div className="text-center">
            <p className="text-3xl font-bold text-amber-400">{breathTimer}s</p>
            <p className="text-white/60 text-sm mt-1">
              {breathPhase === 'in' ? 'Breathe In' : breathPhase === 'hold' ? 'Hold' : 'Breathe Out'}
            </p>
          </div>
        </motion.div>

        <p className="text-white/50 text-sm text-center max-w-sm">
          {breathPhase === 'in' && 'Slowly inhale through your nose...'}
          {breathPhase === 'hold' && 'Gently hold your breath...'}
          {breathPhase === 'out' && 'Exhale slowly through your mouth...'}
        </p>

        <button
          onClick={() => setActiveExercise(null)}
          className="px-6 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
        >
          End Session
        </button>
      </div>
    );
  }

  if (activeExercise === 'grounding-54321') {
    const steps = [
      { count: 5, sense: 'SEE', prompt: 'Name 5 things you can see right now.' },
      { count: 4, sense: 'TOUCH', prompt: 'Name 4 things you can touch.' },
      { count: 3, sense: 'HEAR', prompt: 'Name 3 things you can hear.' },
      { count: 2, sense: 'SMELL', prompt: 'Name 2 things you can smell.' },
      { count: 1, sense: 'TASTE', prompt: 'Name 1 thing you can taste.' },
    ];

    return (
      <div className="max-w-md mx-auto space-y-6 py-8">
        <h2 className="text-2xl font-bold text-white text-center">5-4-3-2-1 Grounding</h2>
        <p className="text-white/50 text-center text-sm">Use your senses to come back to the present moment.</p>

        {steps.map((step, i) => (
          <motion.div
            key={step.count}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
            className="glass-card p-4 flex items-start gap-4"
          >
            <span className="text-3xl font-bold text-amber-400">{step.count}</span>
            <div>
              <p className="text-sm font-semibold text-amber-300">{step.sense}</p>
              <p className="text-white/60 text-sm">{step.prompt}</p>
            </div>
          </motion.div>
        ))}

        <button
          onClick={() => setActiveExercise(null)}
          className="w-full py-3 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
        >
          Done ✓
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Mindfulness & Exercises</h2>
        <p className="text-white/50">Quick exercises to help you reset and recharge.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {exercises.map((ex) => (
          <motion.button
            key={ex.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveExercise(ex.id)}
            className="glass-card-hover p-5 text-left"
          >
            <span className="text-3xl">{ex.icon}</span>
            <h3 className="text-lg font-semibold text-white mt-3">{ex.name}</h3>
            <p className="text-white/50 text-sm mt-1">{ex.desc}</p>
            <span className="text-xs text-amber-400 mt-2 inline-block">{ex.duration}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DASHBOARD VIEW                                                     */
/* ------------------------------------------------------------------ */
function DashboardView() {
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [wellnessScore, setWellnessScore] = useState<WellnessScore | null>(null);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const c = getStore<DailyCheckin[]>('aurora_checkins', []);
    setCheckins(c);
    setWellnessScore(calculateBurnout(c));
    setStreak(getStore('aurora_streak', { current: 0, longest: 0 }));
    setProfile(getStore<UserProfile | null>('aurora_user_profile', null));
  }, []);

  const recentCheckins = checkins.slice(-7);
  const avgMood = recentCheckins.length > 0 ? (recentCheckins.reduce((s, c) => s + c.mood, 0) / recentCheckins.length).toFixed(1) : '—';
  const avgStress = recentCheckins.length > 0 ? (recentCheckins.reduce((s, c) => s + c.stress, 0) / recentCheckins.length).toFixed(1) : '—';
  const avgSleep = recentCheckins.length > 0 ? (recentCheckins.reduce((s, c) => s + c.sleepQuality, 0) / recentCheckins.length).toFixed(1) : '—';
  const avgConfidence = recentCheckins.length > 0 ? (recentCheckins.reduce((s, c) => s + c.confidence, 0) / recentCheckins.length).toFixed(1) : '—';

  // Exam countdown
  const examDates: Record<string, string> = {
    'NEET': '2027-05-04',
    'JEE': '2027-01-20',
    'CUET': '2027-05-15',
    'CAT': '2026-11-24',
    'GATE': '2027-02-01',
    'UPSC': '2027-06-01',
    'Board Exams': '2027-02-15',
  };
  const examDate = profile?.exam ? examDates[profile.exam] : null;
  const daysUntilExam = examDate ? Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000)) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Wellness Dashboard</h2>
        <p className="text-white/50">Your wellness at a glance</p>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Mood', value: avgMood, icon: '😊', color: 'text-amber-400' },
          { label: 'Avg Stress', value: avgStress, icon: '💆', color: 'text-rose-400' },
          { label: 'Avg Sleep', value: avgSleep, icon: '😴', color: 'text-indigo-400' },
          { label: 'Avg Confidence', value: avgConfidence, icon: '💪', color: 'text-emerald-400' },
        ].map(stat => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 text-center"
          >
            <span className="text-2xl">{stat.icon}</span>
            <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
            <p className="text-xs text-white/50">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Burnout + Streak + Exam Countdown row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Burnout Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 text-center">Burnout Risk</h3>
          {wellnessScore && (
            <BurnoutGauge score={wellnessScore.score} riskLevel={wellnessScore.riskLevel} explanation={wellnessScore.explanation} />
          )}
        </motion.div>

        {/* Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 flex flex-col items-center justify-center"
        >
          <Flame className="w-10 h-10 text-amber-500 mb-2" />
          <p className="text-4xl font-bold text-amber-400">{streak.current}</p>
          <p className="text-sm text-white/50 mt-1">Day Streak</p>
          <p className="text-xs text-white/30 mt-2">Longest: {streak.longest} days</p>
        </motion.div>

        {/* Exam Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 flex flex-col items-center justify-center"
        >
          <Calendar className="w-10 h-10 text-violet-400 mb-2" />
          {daysUntilExam !== null ? (
            <>
              <p className="text-4xl font-bold text-violet-400">{daysUntilExam}</p>
              <p className="text-sm text-white/50 mt-1">Days until {profile?.exam}</p>
            </>
          ) : (
            <>
              <p className="text-lg text-white/30">No exam set</p>
              <p className="text-xs text-white/20 mt-1">Complete onboarding to see countdown</p>
            </>
          )}
        </motion.div>
      </div>

      {/* Mood trend chart (simplified - text-based if no data) */}
      {recentCheckins.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">7-Day Trends</h3>
          <div className="space-y-3">
            {['mood', 'stress', 'energy', 'confidence', 'sleepQuality'].map(metric => {
              const values = recentCheckins.map(c => c[metric as keyof DailyCheckin] as number);
              const avg = values.reduce((a, b) => a + b, 0) / values.length;
              const trend = values.length >= 2 ? values[values.length - 1] - values[0] : 0;
              const labels: Record<string, string> = { mood: 'Mood', stress: 'Stress', energy: 'Energy', confidence: 'Confidence', sleepQuality: 'Sleep' };

              return (
                <div key={metric} className="flex items-center gap-3">
                  <span className="text-xs text-white/50 w-20">{labels[metric]}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: metric === 'stress'
                          ? `linear-gradient(to right, #10B981, #EF4444)`
                          : `linear-gradient(to right, #EF4444, #10B981)`,
                      }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${avg * 10}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white/70 w-8 text-right">{avg.toFixed(1)}</span>
                  <span className={`text-xs ${trend > 0 ? (metric === 'stress' ? 'text-red-400' : 'text-emerald-400') : (metric === 'stress' ? 'text-emerald-400' : 'text-red-400')}`}>
                    {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {checkins.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 text-center"
        >
          <AuroraAvatar state="idle" size="md" />
          <h3 className="text-xl font-bold text-white mt-6">Start Your Wellness Journey</h3>
          <p className="text-white/50 mt-2 max-w-md mx-auto">
            Complete your first daily check-in to start tracking your wellness. Aurora will detect patterns and provide personalized insights.
          </p>
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ONBOARDING COMPONENT                                               */
/* ------------------------------------------------------------------ */
function OnboardingView({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    age: 0,
    exam: '',
    targetScore: '',
    subjects: [],
    prepStage: '',
    studySchedule: '',
    resilienceAnchors: { proudAchievement: '', challengeOvercome: '', motivation: '' },
  });

  const exams = ['NEET', 'JEE', 'CUET', 'CAT', 'GATE', 'UPSC', 'Board Exams'];
  const stages = ['Just started', '3-6 months in', '6-12 months in', 'Final months', 'Re-attempting'];

  const handleComplete = () => {
    const fullProfile: UserProfile = {
      name: profile.name || 'Student',
      age: profile.age || 18,
      exam: profile.exam || '',
      targetScore: profile.targetScore || '',
      subjects: profile.subjects || [],
      prepStage: profile.prepStage || '',
      studySchedule: profile.studySchedule || '',
      resilienceAnchors: profile.resilienceAnchors || { proudAchievement: '', challengeOvercome: '', motivation: '' },
      createdAt: new Date().toISOString(),
    };
    setStore('aurora_user_profile', fullProfile);
    setStore('aurora_onboarding_complete', true);
    onComplete();
  };

  const steps = [
    // Step 0: Welcome
    <motion.div key="welcome" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-8 text-center">
      <AuroraAvatar state="encouraging" size="lg" />
      <h1 className="text-3xl md:text-4xl font-bold text-white">
        Welcome to <span className="text-amber-400 aurora-text-glow">Aurora</span>
      </h1>
      <p className="text-white/60 max-w-md mx-auto">
        Your AI wellness companion for exam preparation. Let&apos;s get to know each other so I can support you better.
      </p>
      <div className="space-y-4 max-w-sm mx-auto">
        <div>
          <label htmlFor="name" className="block text-sm text-white/60 mb-1 text-left">What should I call you?</label>
          <input
            id="name"
            type="text"
            value={profile.name}
            onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
            placeholder="Your name"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-amber-500/30"
          />
        </div>
        <div>
          <label htmlFor="age" className="block text-sm text-white/60 mb-1 text-left">Your age</label>
          <input
            id="age"
            type="number"
            min="10"
            max="40"
            value={profile.age || ''}
            onChange={(e) => setProfile(p => ({ ...p, age: parseInt(e.target.value) || 0 }))}
            placeholder="Age"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-amber-500/30"
          />
        </div>
      </div>
    </motion.div>,

    // Step 1: Academic Profile
    <motion.div key="academic" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6 max-w-sm mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Academic Profile</h2>
        <p className="text-white/50 mt-1">Tell me about your exam journey</p>
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-2">Which exam are you preparing for?</label>
        <div className="grid grid-cols-2 gap-2">
          {exams.map(exam => (
            <button
              key={exam}
              onClick={() => setProfile(p => ({ ...p, exam }))}
              className={`p-3 rounded-xl text-sm font-medium transition-all ${
                profile.exam === exam
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
              }`}
            >
              {exam}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="target" className="block text-sm text-white/60 mb-1">Target score/rank (optional)</label>
        <input
          id="target"
          type="text"
          value={profile.targetScore}
          onChange={(e) => setProfile(p => ({ ...p, targetScore: e.target.value }))}
          placeholder="e.g., Top 1000, 600+, etc."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-amber-500/30"
        />
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-2">Preparation stage</label>
        <div className="space-y-2">
          {stages.map(stage => (
            <button
              key={stage}
              onClick={() => setProfile(p => ({ ...p, prepStage: stage }))}
              className={`w-full p-3 rounded-xl text-sm text-left transition-all ${
                profile.prepStage === stage
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>
    </motion.div>,

    // Step 2: Strength Discovery
    <motion.div key="strengths" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6 max-w-md mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Discover Your Strengths</h2>
        <p className="text-white/50 mt-1">These will become your resilience anchors</p>
      </div>

      <div className="glass-card p-4">
        <label htmlFor="proud" className="block text-sm text-amber-400 mb-2">✨ What achievement are you most proud of?</label>
        <textarea
          id="proud"
          value={profile.resilienceAnchors?.proudAchievement}
          onChange={(e) => setProfile(p => ({
            ...p,
            resilienceAnchors: { ...p.resilienceAnchors!, proudAchievement: e.target.value },
          }))}
          placeholder="Any achievement, big or small..."
          className="w-full h-20 bg-transparent border-none outline-none text-white/80 resize-none placeholder:text-white/20"
        />
      </div>

      <div className="glass-card p-4">
        <label htmlFor="challenge" className="block text-sm text-amber-400 mb-2">💪 What challenge have you overcome before?</label>
        <textarea
          id="challenge"
          value={profile.resilienceAnchors?.challengeOvercome}
          onChange={(e) => setProfile(p => ({
            ...p,
            resilienceAnchors: { ...p.resilienceAnchors!, challengeOvercome: e.target.value },
          }))}
          placeholder="A time you proved yourself..."
          className="w-full h-20 bg-transparent border-none outline-none text-white/80 resize-none placeholder:text-white/20"
        />
      </div>

      <div className="glass-card p-4">
        <label htmlFor="motivate" className="block text-sm text-amber-400 mb-2">🔥 What motivates you to succeed?</label>
        <textarea
          id="motivate"
          value={profile.resilienceAnchors?.motivation}
          onChange={(e) => setProfile(p => ({
            ...p,
            resilienceAnchors: { ...p.resilienceAnchors!, motivation: e.target.value },
          }))}
          placeholder="Your deepest motivation..."
          className="w-full h-20 bg-transparent border-none outline-none text-white/80 resize-none placeholder:text-white/20"
        />
      </div>
    </motion.div>,
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i <= step ? 'w-12 bg-amber-400' : 'w-8 bg-white/10'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {steps[step]}
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex items-center gap-4 mt-8">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="px-6 py-3 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
          >
            Back
          </button>
        )}
        {step < 2 ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStep(s => s + 1)}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-midnight-950 font-bold"
          >
            Continue →
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleComplete}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-midnight-950 font-bold"
          >
            Start My Journey ✨
          </motion.button>
        )}
      </div>

      {step === 0 && (
        <button
          onClick={handleComplete}
          className="mt-4 text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          Skip onboarding →
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SETTINGS VIEW                                                      */
/* ------------------------------------------------------------------ */
function SettingsView() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [highContrast, setHighContrast] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);

  useEffect(() => {
    setProfile(getStore<UserProfile | null>('aurora_user_profile', null));
    setHighContrast(getStore('aurora_high_contrast', false));
    setDyslexiaFont(getStore('aurora_dyslexia_font', false));
  }, []);

  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    setStore('aurora_high_contrast', next);
    document.documentElement.style.filter = next ? 'contrast(1.3)' : '';
  };

  const toggleDyslexiaFont = () => {
    const next = !dyslexiaFont;
    setDyslexiaFont(next);
    setStore('aurora_dyslexia_font', next);
    document.body.classList.toggle('font-dyslexia', next);
  };

  const clearData = () => {
    if (confirm('Are you sure? This will delete all your Aurora data including check-ins, journals, and chat history.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
      </div>

      {/* Profile info */}
      {profile && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Profile</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-white/50">Name</span><span className="text-white">{profile.name}</span></div>
            <div className="flex justify-between"><span className="text-white/50">Exam</span><span className="text-white">{profile.exam || 'Not set'}</span></div>
            <div className="flex justify-between"><span className="text-white/50">Stage</span><span className="text-white">{profile.prepStage || 'Not set'}</span></div>
          </div>
        </div>
      )}

      {/* Accessibility */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Accessibility</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm">High Contrast Mode</p>
              <p className="text-white/40 text-xs">Increases contrast for better visibility</p>
            </div>
            <button
              onClick={toggleHighContrast}
              className={`w-12 h-6 rounded-full transition-colors ${highContrast ? 'bg-amber-500' : 'bg-white/10'}`}
              role="switch"
              aria-checked={highContrast}
              aria-label="Toggle high contrast mode"
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${highContrast ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm">Dyslexia-Friendly Font</p>
              <p className="text-white/40 text-xs">Uses a font designed for easier reading</p>
            </div>
            <button
              onClick={toggleDyslexiaFont}
              className={`w-12 h-6 rounded-full transition-colors ${dyslexiaFont ? 'bg-amber-500' : 'bg-white/10'}`}
              role="switch"
              aria-checked={dyslexiaFont}
              aria-label="Toggle dyslexia-friendly font"
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${dyslexiaFont ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">About Aurora</h3>
        <p className="text-white/50 text-sm">
          Aurora is an AI wellness companion designed to support students during exam preparation.
          Aurora is not a substitute for professional mental health support.
          If you&apos;re in crisis, please contact a helpline or trusted adult.
        </p>
      </div>

      {/* Danger zone */}
      <div className="glass-card p-6 border-red-500/20">
        <h3 className="text-sm font-semibold text-red-400/60 uppercase tracking-wider mb-3">Danger Zone</h3>
        <button
          onClick={clearData}
          className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
        >
          Clear All Data
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  EMERGENCY CALM BUTTON                                              */
/* ------------------------------------------------------------------ */
function EmergencyCalmOverlay({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [timer, setTimer] = useState(4);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const phases = [
      { phase: 'in' as const, duration: 4 },
      { phase: 'hold' as const, duration: 7 },
      { phase: 'out' as const, duration: 8 },
    ];
    let phaseIndex = 0;
    let count = 0;
    let totalCycles = 0;

    const interval = setInterval(() => {
      count++;
      setTimer(phases[phaseIndex].duration - count);

      if (count >= phases[phaseIndex].duration) {
        phaseIndex = (phaseIndex + 1) % phases.length;
        if (phaseIndex === 0) {
          totalCycles++;
          setCycle(totalCycles);
        }
        count = 0;
        setPhase(phases[phaseIndex].phase);
        setTimer(phases[phaseIndex].duration);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)',
      }}
      role="dialog"
      aria-label="Emergency calm breathing exercise"
    >
      <AuroraAvatar state="encouraging" size="lg" />

      <motion.div
        className="w-64 h-64 rounded-full mt-12 flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
        }}
        animate={
          phase === 'in' ? { scale: [1, 1.6] } :
          phase === 'hold' ? { scale: 1.6 } :
          { scale: [1.6, 1] }
        }
        transition={{
          duration: phase === 'in' ? 4 : phase === 'hold' ? 7 : 8,
          ease: 'easeInOut',
        }}
      >
        <div className="text-center">
          <p className="text-5xl font-bold text-amber-400">{timer}</p>
          <p className="text-white/60 text-lg mt-2">
            {phase === 'in' ? 'Breathe In' : phase === 'hold' ? 'Hold' : 'Breathe Out'}
          </p>
        </div>
      </motion.div>

      <p className="text-white/40 text-sm mt-8">Cycle {cycle + 1} of 3</p>

      <button
        onClick={onClose}
        className="mt-8 px-8 py-3 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
        autoFocus
      >
        {cycle >= 2 ? 'Feeling Better ✨' : 'End Session'}
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN APP                                                           */
/* ------------------------------------------------------------------ */
export default function AuroraApp() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showEmergencyCalm, setShowEmergencyCalm] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const profile = getStore<UserProfile | null>('aurora_user_profile', null);
    const onboarded = getStore('aurora_onboarding_complete', false);

    if (!onboarded) {
      setShowOnboarding(true);
    } else {
      setUserProfile(profile);
    }
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    setUserProfile(getStore<UserProfile | null>('aurora_user_profile', null));
  }, []);

  const navItems = [
    { id: 'home' as AppView, label: 'Home', icon: Home },
    { id: 'chat' as AppView, label: 'Chat', icon: MessageCircle },
    { id: 'checkin' as AppView, label: 'Check-in', icon: Activity },
    { id: 'journal' as AppView, label: 'Journal', icon: BookOpen },
    { id: 'dashboard' as AppView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'exercises' as AppView, label: 'Exercises', icon: Sparkles },
    { id: 'settings' as AppView, label: 'Settings', icon: Settings },
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 animate-pulse" />
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingView onComplete={handleOnboardingComplete} />;
  }

  const quote = getContextualQuote('general');

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <nav
        className="hidden md:flex flex-col w-64 min-h-screen p-4 border-r border-white/5"
        style={{ background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(20px)' }}
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-3 px-3 py-4 mb-6">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600" />
          <span className="text-lg font-bold text-white">Aurora</span>
        </div>

        <div className="space-y-1 flex-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                currentView === item.id
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
              aria-current={currentView === item.id ? 'page' : undefined}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Emergency calm button in sidebar */}
        <button
          onClick={() => setShowEmergencyCalm(true)}
          className="mt-4 w-full p-3 rounded-xl bg-gradient-to-r from-rose-500/20 to-amber-500/20 border border-rose-500/20 text-rose-300 text-sm font-medium hover:border-rose-500/40 transition-all"
        >
          <Heart className="w-4 h-4 inline mr-2" />
          Emergency Calm
        </button>
      </nav>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-4 border-b border-white/5" style={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600" />
          <span className="text-sm font-bold text-white">Aurora</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmergencyCalm(true)}
            className="p-2 rounded-lg bg-rose-500/20 text-rose-400"
            aria-label="Emergency calm"
          >
            <Heart className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white/5 text-white/70"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-30 bg-midnight-950/95 pt-16"
          >
            <div className="p-6 space-y-2">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setCurrentView(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left ${
                    currentView === item.id
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'text-white/60 hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main id="main-content" className="flex-1 md:p-8 p-4 pt-20 md:pt-8 pb-24 md:pb-8 overflow-y-auto min-h-screen" tabIndex={-1}>
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              {/* Greeting */}
              <div className="text-center py-8">
                <AuroraAvatar state="idle" size="lg" />
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl md:text-4xl font-bold text-white mt-8"
                >
                  {getGreeting()}, <span className="text-amber-400 aurora-text-glow">{userProfile?.name || 'there'}</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/50 mt-2"
                >
                  How are you feeling today?
                </motion.p>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Daily Check-in', icon: Activity, view: 'checkin' as AppView, color: 'from-amber-500/20 to-orange-500/20 border-amber-500/20' },
                  { label: 'Talk to Aurora', icon: MessageCircle, view: 'chat' as AppView, color: 'from-violet-500/20 to-indigo-500/20 border-violet-500/20' },
                  { label: 'Write Journal', icon: BookOpen, view: 'journal' as AppView, color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/20' },
                  { label: 'View Dashboard', icon: LayoutDashboard, view: 'dashboard' as AppView, color: 'from-sky-500/20 to-blue-500/20 border-sky-500/20' },
                ].map(action => (
                  <motion.button
                    key={action.label}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setCurrentView(action.view)}
                    className={`p-4 rounded-xl bg-gradient-to-br ${action.color} border text-left transition-all hover:shadow-lg`}
                  >
                    <action.icon className="w-6 h-6 text-white/80 mb-2" />
                    <p className="text-sm font-medium text-white/90">{action.label}</p>
                  </motion.button>
                ))}
              </div>

              {/* Daily quote */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-card p-6 text-center"
              >
                <p className="text-white/70 italic text-lg">&ldquo;{quote.quote}&rdquo;</p>
                <p className="text-amber-400/60 text-sm mt-3">— {quote.author}</p>
              </motion.div>

              {/* Streak info */}
              {(() => {
                const streakData = getStore('aurora_streak', { current: 0, longest: 0 });
                if (streakData.current > 0) {
                  return (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="glass-card p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Flame className="w-6 h-6 text-amber-400" />
                        <div>
                          <p className="text-white font-medium">{streakData.current} Day Streak!</p>
                          <p className="text-white/40 text-xs">Keep showing up for yourself</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/30" />
                    </motion.div>
                  );
                }
                return null;
              })()}
            </motion.div>
          )}

          {currentView === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
              <ChatView userProfile={userProfile} />
            </motion.div>
          )}

          {currentView === 'checkin' && (
            <motion.div key="checkin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <DailyCheckinView onComplete={() => setCurrentView('dashboard')} />
            </motion.div>
          )}

          {currentView === 'journal' && (
            <motion.div key="journal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <JournalView />
            </motion.div>
          )}

          {currentView === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <DashboardView />
            </motion.div>
          )}

          {currentView === 'exercises' && (
            <motion.div key="exercises" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ExercisesView />
            </motion.div>
          )}

          {currentView === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <SettingsView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around p-2 border-t border-white/5"
        style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)' }}
        aria-label="Mobile navigation"
      >
        {navItems.slice(0, 5).map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              currentView === item.id ? 'text-amber-400' : 'text-white/40'
            }`}
            aria-current={currentView === item.id ? 'page' : undefined}
            aria-label={item.label}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Emergency calm overlay */}
      <AnimatePresence>
        {showEmergencyCalm && <EmergencyCalmOverlay onClose={() => setShowEmergencyCalm(false)} />}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HELPER                                                             */
/* ------------------------------------------------------------------ */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Hey night owl';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}
