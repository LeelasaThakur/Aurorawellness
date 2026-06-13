'use client';

import { useState, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Check, SkipForward } from 'lucide-react';
import AuroraAvatar from './AuroraAvatar';

/* ─── Types ─── */
interface UserProfile {
  name: string;
  age: string;
  exam: string;
  targetScore: string;
  subjects: string[];
  prepStage: string;
  studyHours: string;
  breakPreference: string;
  proudAchievement: string;
  challengeOvercome: string;
  motivation: string;
}

const INITIAL_PROFILE: UserProfile = {
  name: '',
  age: '',
  exam: '',
  targetScore: '',
  subjects: [],
  prepStage: '',
  studyHours: '',
  breakPreference: '',
  proudAchievement: '',
  challengeOvercome: '',
  motivation: '',
};

const EXAMS = [
  'NEET',
  'JEE',
  'CUET',
  'CAT',
  'GATE',
  'UPSC',
  'Board Exams',
];

const SUBJECTS: Record<string, string[]> = {
  NEET: ['Physics', 'Chemistry', 'Biology'],
  JEE: ['Physics', 'Chemistry', 'Mathematics'],
  CUET: ['English', 'General Test', 'Domain Subjects'],
  CAT: ['Quantitative Aptitude', 'Verbal Ability', 'Data Interpretation', 'Logical Reasoning'],
  GATE: ['Core Subject', 'Engineering Mathematics', 'General Aptitude'],
  UPSC: ['General Studies', 'CSAT', 'Optional Subject', 'Essay'],
  'Board Exams': ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'],
};

const PREP_STAGES = [
  'Just started',
  '3-6 months in',
  '6-12 months in',
  'Final months',
  'Re-attempting',
];

const STUDY_HOURS = [
  '2-4 hours',
  '4-6 hours',
  '6-8 hours',
  '8-10 hours',
  '10+ hours',
];

const BREAK_PREFS = [
  'Short breaks every 25 min (Pomodoro)',
  'Medium breaks every 50 min',
  'Long study blocks with extended breaks',
  'Flexible / no fixed schedule',
];

const STEP_GRADIENTS = [
  'from-amber-900/30 to-slate-900',
  'from-blue-900/30 to-slate-900',
  'from-emerald-900/30 to-slate-900',
  'from-violet-900/30 to-slate-900',
];

const TOTAL_STEPS = 4;

/* ─── Sub-components ─── */
function ProgressBar({ step }: { step: number }) {
  return (
    <div
      className="flex items-center gap-1.5 mb-6"
      role="progressbar"
      aria-valuenow={step + 1}
      aria-valuemin={1}
      aria-valuemax={TOTAL_STEPS}
      aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}
    >
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
            i <= step
              ? 'bg-gradient-to-r from-amber-400 to-amber-500'
              : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-white/80 mb-1.5">
      {children}
    </label>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/20 transition-colors"
    />
  );
}

function SelectInput({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/20 transition-colors appearance-none cursor-pointer"
      aria-label={placeholder}
    >
      <option value="" disabled className="bg-slate-800">
        {placeholder || 'Select...'}
      </option>
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-slate-800">
          {opt}
        </option>
      ))}
    </select>
  );
}

function MultiSelect({
  options,
  selected,
  onChange,
  label,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  label: string;
}) {
  const toggle = (opt: string) => {
    onChange(
      selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt]
    );
  };

  return (
    <fieldset aria-label={label}>
      <legend className="text-sm font-medium text-white/80 mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              aria-pressed={active}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                active
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                  : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function TextareaInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white text-sm leading-relaxed placeholder:text-white/25 resize-y focus:outline-none focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/20 transition-colors"
    />
  );
}

/* ─── Main Component ─── */
export default function OnboardingWizard({
  onComplete,
  className = '',
}: {
  onComplete?: () => void;
  className?: string;
}) {
  const formId = useId();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [direction, setDirection] = useState<1 | -1>(1);

  const update = useCallback(
    <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
      setProfile((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const next = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }, [step]);

  const prev = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  const complete = useCallback(() => {
    try {
      localStorage.setItem('aurora_user_profile', JSON.stringify(profile));
      localStorage.setItem('aurora_onboarding_done', 'true');
    } catch {
      // ignore
    }
    onComplete?.();
  }, [profile, onComplete]);

  const availableSubjects = profile.exam ? SUBJECTS[profile.exam] || [] : [];

  /* Slide animation variants */
  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 bg-gradient-to-br ${STEP_GRADIENTS[step]} transition-all duration-700 ${className}`}
    >
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 max-w-lg w-full">
        <ProgressBar step={step} />

        <div className="overflow-hidden relative min-h-[380px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-full"
            >
              {/* ── Step 0: Welcome ── */}
              {step === 0 && (
                <div className="flex flex-col items-center gap-5">
                  <AuroraAvatar state="encouraging" />
                  <h2 className="text-2xl font-bold text-white text-center">
                    Welcome to Aurora
                  </h2>
                  <p className="text-white/50 text-sm text-center max-w-sm">
                    I&apos;m your AI wellness companion. Let&apos;s get to know each other so I can support you better.
                  </p>
                  <div className="w-full flex flex-col gap-3 mt-2">
                    <div>
                      <FieldLabel htmlFor={`${formId}-name`}>Your Name</FieldLabel>
                      <TextInput
                        id={`${formId}-name`}
                        value={profile.name}
                        onChange={(v) => update('name', v)}
                        placeholder="What should I call you?"
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor={`${formId}-age`}>Age</FieldLabel>
                      <TextInput
                        id={`${formId}-age`}
                        value={profile.age}
                        onChange={(v) => update('age', v)}
                        placeholder="Your age"
                        type="number"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 1: Academic Profile ── */}
              {step === 1 && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-xl font-bold text-white">Academic Profile</h2>
                  <p className="text-sm text-white/50">
                    Tell me about your preparation so I can tailor my support.
                  </p>

                  <div>
                    <FieldLabel htmlFor={`${formId}-exam`}>Exam</FieldLabel>
                    <SelectInput
                      id={`${formId}-exam`}
                      value={profile.exam}
                      onChange={(v) => {
                        update('exam', v);
                        update('subjects', []);
                      }}
                      options={EXAMS}
                      placeholder="Select your exam"
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor={`${formId}-target`}>Target Score</FieldLabel>
                    <TextInput
                      id={`${formId}-target`}
                      value={profile.targetScore}
                      onChange={(v) => update('targetScore', v)}
                      placeholder="e.g., 650+, 99 percentile"
                    />
                  </div>

                  {availableSubjects.length > 0 && (
                    <MultiSelect
                      label="Subjects"
                      options={availableSubjects}
                      selected={profile.subjects}
                      onChange={(v) => update('subjects', v)}
                    />
                  )}

                  <div>
                    <FieldLabel htmlFor={`${formId}-stage`}>
                      Preparation Stage
                    </FieldLabel>
                    <SelectInput
                      id={`${formId}-stage`}
                      value={profile.prepStage}
                      onChange={(v) => update('prepStage', v)}
                      options={PREP_STAGES}
                      placeholder="Where are you in your journey?"
                    />
                  </div>
                </div>
              )}

              {/* ── Step 2: Study Schedule ── */}
              {step === 2 && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-xl font-bold text-white">Study Schedule</h2>
                  <p className="text-sm text-white/50">
                    Help me understand your routine so I can suggest healthy breaks.
                  </p>

                  <div>
                    <FieldLabel htmlFor={`${formId}-hours`}>
                      Preferred Study Hours
                    </FieldLabel>
                    <SelectInput
                      id={`${formId}-hours`}
                      value={profile.studyHours}
                      onChange={(v) => update('studyHours', v)}
                      options={STUDY_HOURS}
                      placeholder="Daily study hours"
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor={`${formId}-breaks`}>
                      Break Preference
                    </FieldLabel>
                    <SelectInput
                      id={`${formId}-breaks`}
                      value={profile.breakPreference}
                      onChange={(v) => update('breakPreference', v)}
                      options={BREAK_PREFS}
                      placeholder="How do you like to take breaks?"
                    />
                  </div>
                </div>
              )}

              {/* ── Step 3: Strength Discovery ── */}
              {step === 3 && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-xl font-bold text-white">
                    Strength Discovery
                  </h2>
                  <p className="text-sm text-white/50">
                    I&apos;ll use these to remind you of your strengths when things get tough.
                  </p>

                  <div>
                    <FieldLabel htmlFor={`${formId}-proud`}>
                      What achievement are you most proud of?
                    </FieldLabel>
                    <TextareaInput
                      id={`${formId}-proud`}
                      value={profile.proudAchievement}
                      onChange={(v) => update('proudAchievement', v)}
                      placeholder="It can be anything – big or small..."
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor={`${formId}-challenge`}>
                      What challenge have you overcome?
                    </FieldLabel>
                    <TextareaInput
                      id={`${formId}-challenge`}
                      value={profile.challengeOvercome}
                      onChange={(v) => update('challengeOvercome', v)}
                      placeholder="A time you pushed through..."
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor={`${formId}-motivation`}>
                      What motivates you to succeed?
                    </FieldLabel>
                    <TextareaInput
                      id={`${formId}-motivation`}
                      value={profile.motivation}
                      onChange={(v) => update('motivation', v)}
                      placeholder="Your deepest why..."
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
          {step > 0 ? (
            <button
              onClick={prev}
              className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg px-3 py-2"
              aria-label="Go to previous step"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            {/* Skip (non-critical fields) */}
            {step > 0 && step < TOTAL_STEPS - 1 && (
              <button
                onClick={next}
                className="flex items-center gap-1 text-sm text-white/30 hover:text-white/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg px-3 py-2"
                aria-label="Skip this step"
              >
                Skip
                <SkipForward size={14} />
              </button>
            )}

            {step < TOTAL_STEPS - 1 ? (
              <motion.button
                onClick={next}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                aria-label="Go to next step"
              >
                Next
                <ChevronRight size={16} />
              </motion.button>
            ) : (
              <motion.button
                onClick={complete}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="Complete onboarding"
              >
                <Check size={16} />
                Complete
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
