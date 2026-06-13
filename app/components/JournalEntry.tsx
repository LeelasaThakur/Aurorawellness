'use client';

import { useState, useEffect, useCallback, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Clock, ChevronDown, ChevronUp } from 'lucide-react';

/* ─── Types ─── */
interface Signal {
  label: string;
  category: 'emotional' | 'academic' | 'environmental';
}

interface JournalRecord {
  id: string;
  text: string;
  date: string;
  signals: Signal[];
}

/* ─── Constants ─── */
const PROMPTS = [
  'How are you feeling about your preparation?',
  'What challenged you today?',
  'What are you grateful for?',
  'What would you tell a friend in your situation?',
];

const SIGNAL_KEYWORDS: Record<string, Signal> = {
  anxious: { label: 'Anxiety', category: 'emotional' },
  anxiety: { label: 'Anxiety', category: 'emotional' },
  worried: { label: 'Anxiety', category: 'emotional' },
  nervous: { label: 'Anxiety', category: 'emotional' },
  panic: { label: 'Anxiety', category: 'emotional' },
  burnout: { label: 'Burnout', category: 'emotional' },
  burnt: { label: 'Burnout', category: 'emotional' },
  exhausted: { label: 'Burnout', category: 'emotional' },
  drained: { label: 'Burnout', category: 'emotional' },
  tired: { label: 'Burnout', category: 'emotional' },
  frustrated: { label: 'Frustration', category: 'emotional' },
  frustration: { label: 'Frustration', category: 'emotional' },
  angry: { label: 'Frustration', category: 'emotional' },
  sad: { label: 'Sadness', category: 'emotional' },
  lonely: { label: 'Loneliness', category: 'emotional' },
  hopeless: { label: 'Hopelessness', category: 'emotional' },
  overwhelmed: { label: 'Overwhelm', category: 'emotional' },
  scared: { label: 'Fear', category: 'emotional' },
  happy: { label: 'Happiness', category: 'emotional' },
  grateful: { label: 'Gratitude', category: 'emotional' },
  confident: { label: 'Confidence', category: 'emotional' },
  proud: { label: 'Pride', category: 'emotional' },
  procrastinating: { label: 'Procrastination', category: 'academic' },
  procrastination: { label: 'Procrastination', category: 'academic' },
  distracted: { label: 'Distraction', category: 'academic' },
  productive: { label: 'Productivity', category: 'academic' },
  focused: { label: 'Focus', category: 'academic' },
  'can\'t study': { label: 'Study Block', category: 'academic' },
  revision: { label: 'Revision', category: 'academic' },
  syllabus: { label: 'Syllabus Pressure', category: 'academic' },
  backlog: { label: 'Backlog', category: 'academic' },
  exam: { label: 'Exam Pressure', category: 'academic' },
  family: { label: 'Family Pressure', category: 'environmental' },
  parents: { label: 'Family Pressure', category: 'environmental' },
  comparison: { label: 'Peer Comparison', category: 'environmental' },
  compare: { label: 'Peer Comparison', category: 'environmental' },
  peers: { label: 'Peer Comparison', category: 'environmental' },
  coaching: { label: 'Coaching Pressure', category: 'environmental' },
  hostel: { label: 'Living Situation', category: 'environmental' },
  friends: { label: 'Social Dynamics', category: 'environmental' },
  social: { label: 'Social Dynamics', category: 'environmental' },
  money: { label: 'Financial Stress', category: 'environmental' },
};

const SIGNAL_COLORS: Record<string, string> = {
  emotional: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  academic: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  environmental: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
};

const MAX_CHARS = 2000;
const STORAGE_KEY = 'aurora_journal';

/* ─── Helpers ─── */
function analyzeText(text: string): Signal[] {
  const lower = text.toLowerCase();
  const seen = new Set<string>();
  const results: Signal[] = [];

  for (const [keyword, signal] of Object.entries(SIGNAL_KEYWORDS)) {
    if (lower.includes(keyword) && !seen.has(signal.label)) {
      seen.add(signal.label);
      results.push(signal);
    }
  }
  return results;
}

function loadEntries(): JournalRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/* ─── Sub-components ─── */
function SignalTag({ signal }: { signal: Signal }) {
  return (
    <motion.span
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${SIGNAL_COLORS[signal.category]}`}
    >
      {signal.label}
    </motion.span>
  );
}

function HistoryItem({ entry }: { entry: JournalRecord }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(entry.date);
  const formatted = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="border border-white/5 rounded-xl p-3.5 bg-white/[0.02]">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Clock size={14} className="text-white/30 shrink-0" />
          <span className="text-xs text-white/40">{formatted}</span>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-white/30" />
        ) : (
          <ChevronDown size={16} className="text-white/30" />
        )}
      </button>

      {/* Signal preview always visible */}
      {entry.signals.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {entry.signals.map((s) => (
            <span
              key={s.label}
              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${SIGNAL_COLORS[s.category]}`}
            >
              {s.label}
            </span>
          ))}
        </div>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="text-sm text-white/60 mt-2 leading-relaxed overflow-hidden"
          >
            {entry.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Component ─── */
export default function JournalEntry({ className = '' }: { className?: string }) {
  const textareaId = useId();
  const [text, setText] = useState('');
  const [signals, setSignals] = useState<Signal[]>([]);
  const [showSignals, setShowSignals] = useState(false);
  const [entries, setEntries] = useState<JournalRecord[]>([]);
  const [promptIndex, setPromptIndex] = useState(0);
  const promptTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rotate prompts
  useEffect(() => {
    promptTimer.current = setInterval(() => {
      setPromptIndex((p) => (p + 1) % PROMPTS.length);
    }, 6000);
    return () => {
      if (promptTimer.current) clearInterval(promptTimer.current);
    };
  }, []);

  // Load history
  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  const handleSubmit = useCallback(() => {
    if (!text.trim()) return;

    const detected = analyzeText(text);
    setSignals(detected);
    setShowSignals(true);

    const record: JournalRecord = {
      id: crypto.randomUUID(),
      text: text.trim(),
      date: new Date().toISOString(),
      signals: detected,
    };

    const updated = [record, ...entries];
    setEntries(updated);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    setText('');
  }, [text, entries]);

  const charCount = text.length;
  const isOverLimit = charCount > MAX_CHARS;

  return (
    <section
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-7 max-w-2xl w-full ${className}`}
      aria-label="Journal Entry"
    >
      <h2 className="text-xl font-bold text-white mb-1">Journal</h2>
      <p className="text-sm text-white/50 mb-5">
        Write freely. Aurora will help you understand your feelings.
      </p>

      {/* Textarea */}
      <div className="relative">
        <label htmlFor={textareaId} className="sr-only">
          Journal entry
        </label>
        <textarea
          id={textareaId}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setShowSignals(false);
          }}
          rows={6}
          maxLength={MAX_CHARS + 100}
          aria-label="Write your journal entry"
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm leading-relaxed resize-y placeholder:text-white/25 focus:outline-none focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/20 transition-colors"
          placeholder={PROMPTS[promptIndex]}
        />
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span
            className={`text-xs ${isOverLimit ? 'text-rose-400' : 'text-white/30'}`}
          >
            {charCount} / {MAX_CHARS}
          </span>
        </div>
      </div>

      {/* Submit */}
      <motion.button
        onClick={handleSubmit}
        disabled={!text.trim() || isOverLimit}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        aria-label="Analyze journal entry"
      >
        <Send size={16} />
        Analyze Entry
      </motion.button>

      {/* Detected signals */}
      <AnimatePresence>
        {showSignals && signals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-5 p-4 bg-white/[0.03] border border-white/10 rounded-xl"
          >
            <p className="text-xs text-white/40 mb-2.5 uppercase tracking-wider font-medium">
              Detected Signals
            </p>
            <div className="flex flex-wrap gap-2">
              {signals.map((s) => (
                <SignalTag key={s.label} signal={s} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Journal history */}
      {entries.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-white/60 mb-3">
            Past Entries ({entries.length})
          </h3>
          <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-1">
            {entries.map((entry) => (
              <HistoryItem key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
