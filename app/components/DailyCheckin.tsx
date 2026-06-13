'use client';

import { useState, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SliderMetric {
  key: string;
  label: string;
  emojis: string[];
}

const METRICS: SliderMetric[] = [
  { key: 'mood', label: 'Mood', emojis: ['😢', '😔', '😐', '🙂', '😊', '😄', '🤩'] },
  { key: 'energy', label: 'Energy', emojis: ['🪫', '😴', '🥱', '😐', '🙂', '💪', '⚡'] },
  { key: 'stress', label: 'Stress', emojis: ['😌', '🙂', '😐', '😟', '😰', '😫', '🤯'] },
  { key: 'confidence', label: 'Confidence', emojis: ['😞', '😕', '😐', '🙂', '😊', '💪', '🔥'] },
  { key: 'sleepQuality', label: 'Sleep Quality', emojis: ['😵', '😫', '😴', '😐', '😊', '😌', '🌟'] },
  { key: 'studySatisfaction', label: 'Study Satisfaction', emojis: ['😭', '😣', '😕', '😐', '🙂', '😊', '🎯'] },
];

const GRADIENT_TRACKS: Record<string, string> = {
  mood: 'linear-gradient(to right, #F43F5E, #F59E0B, #10B981)',
  energy: 'linear-gradient(to right, #6366F1, #F59E0B, #10B981)',
  stress: 'linear-gradient(to right, #10B981, #F59E0B, #EF4444)',
  confidence: 'linear-gradient(to right, #F43F5E, #F59E0B, #10B981)',
  sleepQuality: 'linear-gradient(to right, #EF4444, #F59E0B, #8B5CF6)',
  studySatisfaction: 'linear-gradient(to right, #F43F5E, #F59E0B, #10B981)',
};

const ENCOURAGEMENTS = [
  "Thanks for checking in! Remember, every day is a fresh start. 🌅",
  "Your self-awareness is a superpower. Keep going! 💛",
  "Checking in takes courage. I'm proud of you! ✨",
  "You're building great self-awareness habits. That matters! 🌟",
  "Thank you for sharing. You're not alone in this journey. 🤗",
];

function getEmoji(emojis: string[], value: number): string {
  const index = Math.min(
    emojis.length - 1,
    Math.floor(((value - 1) / 9) * (emojis.length - 1))
  );
  return emojis[Math.max(0, index)];
}

function Slider({
  metric,
  value,
  onChange,
}: {
  metric: SliderMetric;
  value: number;
  onChange: (key: string, v: number) => void;
}) {
  const id = useId();
  const emoji = getEmoji(metric.emojis, value);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-sm font-medium text-white/80"
        >
          {metric.label}
        </label>
        <div className="flex items-center gap-2">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={emoji}
              className="text-xl"
              initial={{ scale: 0.4, opacity: 0, y: -8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.4, opacity: 0, y: 8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              aria-hidden="true"
            >
              {emoji}
            </motion.span>
          </AnimatePresence>
          <span className="text-sm font-bold text-amber-400 w-5 text-right tabular-nums">
            {value}
          </span>
        </div>
      </div>

      {/* Custom range input */}
      <div className="relative h-8 flex items-center">
        <div
          className="absolute inset-x-0 h-2 rounded-full"
          style={{ background: GRADIENT_TRACKS[metric.key] }}
          aria-hidden="true"
        />
        <div
          className="absolute h-2 rounded-full bg-white/10"
          style={{ left: `${((value - 1) / 9) * 100}%`, right: 0 }}
          aria-hidden="true"
        />
        <input
          id={id}
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(metric.key, Number(e.target.value))}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={value}
          aria-label={`${metric.label}: ${value} out of 10`}
          className="relative w-full h-2 appearance-none bg-transparent cursor-pointer z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(245,158,11,0.6)]
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-amber-400
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(245,158,11,0.6)]
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-amber-400
            [&::-moz-range-thumb]:cursor-grab
            [&::-moz-range-track]:bg-transparent
            [&::-moz-range-track]:h-2
          "
        />
      </div>
    </div>
  );
}

export default function DailyCheckin({ className = '' }: { className?: string }) {
  const [values, setValues] = useState<Record<string, number>>({
    mood: 5,
    energy: 5,
    stress: 5,
    confidence: 5,
    sleepQuality: 5,
    studySatisfaction: 5,
  });
  const [submitted, setSubmitted] = useState(false);
  const [encouragement, setEncouragement] = useState('');

  const handleChange = useCallback((key: string, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    const entry = { ...values, timestamp: Date.now() };

    try {
      const existing = JSON.parse(localStorage.getItem('aurora_checkins') || '{}');
      existing[today] = entry;
      localStorage.setItem('aurora_checkins', JSON.stringify(existing));
    } catch {
      // silently fail in SSR / unsupported environments
    }

    setEncouragement(
      ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
    );
    setSubmitted(true);
  }, [values]);

  const handleReset = useCallback(() => {
    setSubmitted(false);
    setValues({
      mood: 5,
      energy: 5,
      stress: 5,
      confidence: 5,
      sleepQuality: 5,
      studySatisfaction: 5,
    });
  }, []);

  return (
    <section
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-7 max-w-lg w-full ${className}`}
      aria-label="Daily Wellness Check-in"
    >
      <h2 className="text-xl font-bold text-white mb-1">Daily Check-in</h2>
      <p className="text-sm text-white/50 mb-5">
        How are you feeling today? Move the sliders.
      </p>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-4 py-8"
          >
            <motion.span
              className="text-5xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 12 }}
            >
              ✅
            </motion.span>
            <p className="text-white text-center font-medium">{encouragement}</p>
            <button
              onClick={handleReset}
              className="mt-2 px-5 py-2 rounded-xl text-sm font-medium text-amber-400 border border-amber-400/30 hover:bg-amber-400/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              Check in again
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-5 overflow-y-auto max-h-[60vh] pr-1"
          >
            {METRICS.map((m) => (
              <Slider
                key={m.key}
                metric={m}
                value={values[m.key]}
                onChange={handleChange}
              />
            ))}

            <motion.button
              onClick={handleSubmit}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-2 w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              aria-label="Submit daily check-in"
            >
              Submit Check-in
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
