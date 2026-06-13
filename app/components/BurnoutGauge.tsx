'use client';

import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { useEffect, useRef } from 'react';

interface BurnoutGaugeProps {
  score: number;
  riskLevel: 'Low Risk' | 'Medium Risk' | 'High Risk';
  explanation: string;
  className?: string;
}

function getColor(score: number): string {
  if (score <= 33) return '#10B981';
  if (score <= 66) return '#F59E0B';
  return '#EF4444';
}

function getRiskColor(riskLevel: string): string {
  if (riskLevel === 'Low Risk') return 'text-emerald-400';
  if (riskLevel === 'Medium Risk') return 'text-amber-400';
  return 'text-rose-400';
}

export default function BurnoutGauge({
  score,
  riskLevel,
  explanation,
  className = '',
}: BurnoutGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const radius = 90;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degrees
  const filledLength = (clampedScore / 100) * arcLength;

  const motionScore = useMotionValue(0);
  const displayScore = useTransform(motionScore, (v) => Math.round(v));
  const scoreRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionScore, clampedScore, {
      duration: 1.2,
      ease: 'easeOut',
    });
    return () => controls.stop();
  }, [clampedScore, motionScore]);

  /* keep displayed number in sync */
  useEffect(() => {
    const unsub = displayScore.on('change', (v) => {
      if (scoreRef.current) scoreRef.current.textContent = String(v);
    });
    return unsub;
  }, [displayScore]);

  const color = getColor(clampedScore);

  return (
    <div
      className={`flex flex-col items-center gap-3 ${className}`}
      role="meter"
      aria-valuenow={clampedScore}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Burnout risk score: ${clampedScore} out of 100, ${riskLevel}`}
    >
      <div className="relative w-[220px] h-[220px] md:w-[260px] md:h-[260px]">
        <svg
          viewBox="0 0 220 220"
          className="w-full h-full -rotate-[225deg]"
          aria-hidden="true"
        >
          {/* Background track */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Filled arc */}
          <motion.circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset: arcLength - filledLength }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>

        {/* Score number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            ref={scoreRef}
            className="text-5xl md:text-6xl font-bold text-white"
            aria-hidden="true"
          >
            0
          </span>
          <span className="text-xs text-white/50 mt-1 uppercase tracking-wider">
            / 100
          </span>
        </div>
      </div>

      {/* Risk label */}
      <motion.span
        key={riskLevel}
        className={`text-lg font-semibold ${getRiskColor(riskLevel)}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {riskLevel}
      </motion.span>

      {/* Explanation */}
      <motion.p
        key={explanation}
        className="text-sm text-white/60 text-center max-w-xs leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {explanation}
      </motion.p>
    </div>
  );
}
