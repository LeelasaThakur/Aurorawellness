'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import AuroraAvatar from './AuroraAvatar';

/* 4-7-8 breathing pattern */
const PHASES = [
  { label: 'Breathe In', duration: 4, scale: 1.5 },
  { label: 'Hold', duration: 7, scale: 1.5 },
  { label: 'Breathe Out', duration: 8, scale: 1 },
] as const;

const TOTAL_CYCLE = PHASES.reduce((s, p) => s + p.duration, 0); // 19s

interface TimerState {
  phaseIndex: number;
  countdown: number;
  cycles: number;
}

export default function EmergencyCalmButton({
  className = '',
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [timerState, setTimerState] = useState<TimerState>({
    phaseIndex: 0,
    countdown: PHASES[0].duration,
    cycles: 0,
  });

  const phase = PHASES[timerState.phaseIndex];

  /* Timer logic */
  useEffect(() => {
    if (!open) return;

    const intervalId = setInterval(() => {
      setTimerState((prev) => {
        if (prev.countdown <= 1) {
          const nextPhaseIndex = (prev.phaseIndex + 1) % PHASES.length;
          const nextCycles = nextPhaseIndex === 0 ? prev.cycles + 1 : prev.cycles;
          return {
            phaseIndex: nextPhaseIndex,
            countdown: PHASES[nextPhaseIndex].duration,
            cycles: nextCycles,
          };
        }
        return {
          ...prev,
          countdown: prev.countdown - 1,
        };
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [open]);

  const handleOpen = useCallback(() => {
    setTimerState({
      phaseIndex: 0,
      countdown: PHASES[0].duration,
      cycles: 0,
    });
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  /* Trap focus when overlay is open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Trigger button */}
      <motion.button
        onClick={handleOpen}
        className={`fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 px-5 py-3 rounded-full font-semibold text-sm bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${className}`}
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(244,63,94,0.4)',
            '0 0 0 12px rgba(244,63,94,0)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        aria-label="Open Emergency Calm breathing exercise"
      >
        🫧 Emergency Calm
      </motion.button>

      {/* Full-screen overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Emergency Calm breathing exercise"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close breathing exercise"
            >
              <X size={24} />
            </button>

            {/* Aurora avatar */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <AuroraAvatar state="encouraging" />
            </motion.div>

            {/* Breathing circle */}
            <div className="relative flex items-center justify-center my-8">
              <motion.div
                className="w-40 h-40 md:w-52 md:h-52 rounded-full border-2 border-amber-400/30 flex items-center justify-center"
                style={{
                  background:
                    'radial-gradient(circle, rgba(245,158,11,0.15), transparent 70%)',
                }}
                animate={{ scale: phase.scale }}
                transition={{ duration: phase.duration, ease: 'easeInOut' }}
              >
                <div className="flex flex-col items-center gap-1">
                  <motion.span
                    key={phase.label}
                    className="text-xl md:text-2xl font-bold text-white"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {phase.label}
                  </motion.span>
                  <span
                    className="text-4xl font-bold text-amber-400 tabular-nums"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {timerState.countdown}
                  </span>
                </div>
              </motion.div>

              {/* Outer pulsing ring */}
              <motion.div
                className="absolute rounded-full border border-amber-400/20"
                style={{ width: '120%', height: '120%' }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.1, 0.3],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                aria-hidden="true"
              />
            </div>

            {/* Cycle count */}
            <p className="text-white/40 text-sm">
              Cycle {timerState.cycles + 1} &middot; {TOTAL_CYCLE}s per cycle
            </p>
            <p className="text-white/60 text-sm mt-2 max-w-xs text-center">
              Follow the circle. Breathe in through your nose, hold gently, then
              exhale slowly through your mouth.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
