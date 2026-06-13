'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useMemo } from 'react';

type AvatarState = 'idle' | 'listening' | 'speaking' | 'encouraging';

interface AuroraAvatarProps {
  state?: AvatarState;
  className?: string;
}

const stateConfig: Record<
  AvatarState,
  {
    scale: number;
    glowColor: string;
    glowIntensity: number;
    ringCount: number;
    label: string;
  }
> = {
  idle: {
    scale: 1,
    glowColor: 'rgba(245,158,11,0.35)',
    glowIntensity: 1,
    ringCount: 3,
    label: 'Aurora is resting',
  },
  listening: {
    scale: 1.08,
    glowColor: 'rgba(245,158,11,0.5)',
    glowIntensity: 1.4,
    ringCount: 4,
    label: 'Aurora is listening',
  },
  speaking: {
    scale: 1.05,
    glowColor: 'rgba(252,211,77,0.5)',
    glowIntensity: 1.6,
    ringCount: 5,
    label: 'Aurora is speaking',
  },
  encouraging: {
    scale: 1.1,
    glowColor: 'rgba(217,119,6,0.55)',
    glowIntensity: 1.8,
    ringCount: 4,
    label: 'Aurora is encouraging you',
  },
};

/* ─── Particle ─── */
function Particle({ index, total }: { index: number; total: number }) {
  const angle = (360 / total) * index;
  const delay = (index / total) * 4;
  const size = 2 + Math.random() * 3;

  return (
    <motion.span
      aria-hidden="true"
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle, #FCD34D, transparent)',
        left: '50%',
        top: '50%',
        transformOrigin: '0 0',
      }}
      initial={{ opacity: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 0.9, 0],
        x: [0, Math.cos((angle * Math.PI) / 180) * 110],
        y: [0, Math.sin((angle * Math.PI) / 180) * 110 - 40],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

/* ─── Ring ─── */
function Ring({
  index,
  avatarState,
}: {
  index: number;
  avatarState: AvatarState;
}) {
  const baseSize = 110 + index * 28;
  const isPulsing = avatarState === 'listening' || avatarState === 'speaking';

  return (
    <motion.span
      aria-hidden="true"
      className="absolute rounded-full border"
      style={{
        width: baseSize,
        height: baseSize,
        left: '50%',
        top: '50%',
        marginLeft: -baseSize / 2,
        marginTop: -baseSize / 2,
        borderColor: `rgba(245,158,11,${0.25 - index * 0.05})`,
      }}
      animate={{
        scale: isPulsing ? [1, 1.08 + index * 0.03, 1] : [1, 1.03, 1],
        opacity: isPulsing ? [0.6, 0.2, 0.6] : [0.3, 0.15, 0.3],
      }}
      transition={{
        duration: isPulsing ? 1.5 : 3 + index * 0.5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: index * 0.3,
      }}
    />
  );
}

/* ─── Main Component ─── */
export default function AuroraAvatar({
  state = 'idle',
  className = '',
}: AuroraAvatarProps) {
  const config = stateConfig[state];
  const particles = useMemo(() => Array.from({ length: 14 }), []);

  return (
    <div
      role="img"
      aria-label={config.label}
      className={`relative flex items-center justify-center w-[150px] h-[150px] md:w-[200px] md:h-[200px] ${className}`}
    >
      {/* CSS keyframe styles */}
      <style>{`
        @keyframes aurora-breathe {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.04) translateY(-4px); }
        }
        @keyframes aurora-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes aurora-wave {
          0% { transform: scale(1); }
          25% { transform: scale(1.07); }
          50% { transform: scale(0.95); }
          75% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        @keyframes aurora-spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Animated rings */}
      {Array.from({ length: config.ringCount }).map((_, i) => (
        <Ring key={i} index={i} avatarState={state} />
      ))}

      {/* Particles */}
      {particles.map((_, i) => (
        <Particle key={i} index={i} total={particles.length} />
      ))}

      {/* Outer glow halo */}
      <motion.div
        aria-hidden="true"
        className="absolute rounded-full"
        style={{
          width: '130%',
          height: '130%',
          background: `radial-gradient(circle, ${config.glowColor}, transparent 70%)`,
        }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Main sphere */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          className="relative rounded-full"
          style={{
            width: '60%',
            height: '60%',
            background: `
              radial-gradient(circle at 35% 35%, #FCD34D 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, #F59E0B 0%, #D97706 60%, #92400E 100%)
            `,
            boxShadow: `
              0 0 ${20 * config.glowIntensity}px ${config.glowColor},
              0 0 ${40 * config.glowIntensity}px ${config.glowColor},
              inset 0 0 20px rgba(252,211,77,0.3)
            `,
            animation:
              state === 'speaking'
                ? 'aurora-wave 1.2s ease-in-out infinite'
                : state === 'idle'
                  ? 'aurora-breathe 4s ease-in-out infinite'
                  : undefined,
          }}
          initial={{ scale: 0.9, opacity: 0.6 }}
          animate={{ scale: config.scale, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0.6 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          {/* Highlight reflection */}
          <span
            aria-hidden="true"
            className="absolute rounded-full"
            style={{
              width: '35%',
              height: '25%',
              top: '15%',
              left: '22%',
              background:
                'radial-gradient(ellipse, rgba(255,255,255,0.45) 0%, transparent 70%)',
              filter: 'blur(2px)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Rotating accent ring (encouraging state) */}
      {state === 'encouraging' && (
        <motion.span
          aria-hidden="true"
          className="absolute rounded-full border-2 border-dashed border-amber-400/40"
          style={{
            width: '85%',
            height: '85%',
            animation: 'aurora-spin-slow 8s linear infinite',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </div>
  );
}
