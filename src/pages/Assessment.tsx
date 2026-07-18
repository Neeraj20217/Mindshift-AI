import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { storageService } from '../services/storage';
import { aiService } from '../services/ai';
import type { SeverityLevel } from '../types/habit';
import {
  Brain, Sparkles, AlertTriangle, ShieldCheck, ChevronRight, ChevronLeft,
  Loader, Check, Zap, Moon, Activity, Target,
} from 'lucide-react';

const assessmentSchema = z.object({
  habitType: z.string().min(2, 'Please select or specify a habit (at least 2 characters)'),
  customHabit: z.string().optional(),
  severity: z.enum(['low', 'moderate', 'severe'] as const),
  frequency: z.string().min(2, 'Please specify how often you engage in this habit'),
  triggers: z.array(z.string()).min(1, 'Please select at least one trigger'),
  customTrigger: z.string().optional(),
  environment: z.string().min(2, 'Please describe where this habit usually occurs'),
  motivationLevel: z.number().min(1).max(10),
  stressLevel: z.number().min(1).max(10),
  sleepHours: z.number().min(1, 'Hours of sleep must be greater than 0').max(24, 'Sleep hours cannot exceed 24'),
  notes: z.string().optional(),
});

type AssessmentFormValues = z.infer<typeof assessmentSchema>;

const HABIT_PRESETS = [
  { label: 'Doom scrolling', emoji: '📱' },
  { label: 'Social media addiction', emoji: '🌐' },
  { label: 'Screen addiction', emoji: '🖥️' },
  { label: 'Gaming addiction', emoji: '🎮' },
  { label: 'Procrastination', emoji: '⏳' },
  { label: 'Smoking / Vaping', emoji: '🚬' },
  { label: 'Alcohol consumption', emoji: '🍷' },
  { label: 'Sugar / Junk food', emoji: '🍩' },
  { label: 'Nail biting', emoji: '✂️' },
];

const TRIGGER_PRESETS = [
  { label: 'Stress / Anxiety', emoji: '😰' },
  { label: 'Boredom', emoji: '😑' },
  { label: 'Fatigue / Tiredness', emoji: '😴' },
  { label: 'Loneliness', emoji: '💔' },
  { label: 'Social situations', emoji: '👥' },
  { label: 'Late night routine', emoji: '🌙' },
  { label: 'Work / Study pressure', emoji: '📚' },
];

const SEVERITY_OPTIONS = [
  {
    value: 'low' as const,
    label: 'Low',
    desc: 'Minor nuisance',
    color: 'border-emerald-500 bg-emerald-500/15 text-emerald-300',
    idle: 'border-slate-700 bg-slate-900/50 text-slate-300 hover:border-emerald-500/50',
    dot: 'bg-emerald-500',
  },
  {
    value: 'moderate' as const,
    label: 'Moderate',
    desc: 'Affects daily routine',
    color: 'border-amber-500 bg-amber-500/15 text-amber-300',
    idle: 'border-slate-700 bg-slate-900/50 text-slate-300 hover:border-amber-500/50',
    dot: 'bg-amber-500',
  },
  {
    value: 'severe' as const,
    label: 'Severe',
    desc: 'Major negative impact',
    color: 'border-rose-500 bg-rose-500/15 text-rose-300',
    idle: 'border-slate-700 bg-slate-900/50 text-slate-300 hover:border-rose-500/50',
    dot: 'bg-rose-500',
  },
];

const STEP_LABELS = ['Identify Habit', 'Triggers & Context', 'Wellness Baseline'];

export const Assessment: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [isCustomHabit, setIsCustomHabit] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    trigger,
  } = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      habitType: '',
      severity: 'moderate',
      frequency: '',
      triggers: [],
      environment: '',
      motivationLevel: 5,
      stressLevel: 5,
      sleepHours: 7,
      notes: '',
    },
  });

  const watchHabit = watch('habitType');
  const watchSeverity = watch('severity');
  const watchMotivation = watch('motivationLevel');
  const watchStress = watch('stressLevel');
  const watchSleep = watch('sleepHours');

  const handleTriggerToggle = (t: string) => {
    const updated = selectedTriggers.includes(t)
      ? selectedTriggers.filter((x) => x !== t)
      : [...selectedTriggers, t];
    setSelectedTriggers(updated);
    setValue('triggers', updated, { shouldValidate: true });
  };

  const handleAddCustomTrigger = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (!selectedTriggers.includes(val)) {
        const updated = [...selectedTriggers, val];
        setSelectedTriggers(updated);
        setValue('triggers', updated, { shouldValidate: true });
      }
      e.currentTarget.value = '';
    }
  };

  const onSubmit = async (data: AssessmentFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const plan = await aiService.generateAssessment(
        data.habitType, data.severity, data.frequency, data.triggers,
        data.environment, data.motivationLevel, data.stressLevel, data.sleepHours
      );
      await storageService.saveHabitAssessment({
        uid: user.uid,
        habitType: data.habitType,
        severity: data.severity as SeverityLevel,
        frequency: data.frequency,
        triggers: data.triggers,
        environment: data.environment,
        motivationLevel: data.motivationLevel,
        stressLevel: data.stressLevel,
        sleepHours: data.sleepHours,
        recoveryPlan: plan,
        startDate: new Date().toISOString(),
        currentStreak: 0,
        longestStreak: 0,
      });
      onComplete();
    } catch (e) {
      console.error('Error during assessment submit:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = async () => {
    if (step === 1) {
      const isValid = await trigger(['habitType', 'frequency', 'severity']);
      if (isValid) setStep(2);
    } else if (step === 2) {
      const isValid = await trigger(['triggers', 'environment']);
      if (isValid) setStep(3);
    }
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-2xl">

        {/* ── Card ── */}
        <div className="glass-panel rounded-2xl relative overflow-hidden border border-slate-800/60 shadow-2xl">

          {/* Top colour bar */}
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500" />

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl mb-4 shadow-lg shadow-emerald-500/10">
                <Brain className="w-7 h-7" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white mb-2 text-glow-emerald">
                AI Habit Assessment
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
                Let's understand your routine. MindShift AI will analyze your profile and design a
                personalised psychological recovery program.
              </p>
            </div>

            {/* ── Step Progress ── */}
            <div className="flex items-center mb-10 gap-0">
              {STEP_LABELS.map((label, i) => {
                const s = i + 1;
                const active = step === s;
                const done = step > s;
                return (
                  <React.Fragment key={s}>
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                          done
                            ? 'bg-emerald-500 text-slate-950 scale-100'
                            : active
                            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 scale-110 shadow-lg shadow-emerald-500/30'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {done ? <Check className="w-4 h-4" /> : s}
                      </div>
                      <span className={`text-[10px] font-semibold whitespace-nowrap hidden sm:block ${
                        active ? 'text-emerald-400' : done ? 'text-emerald-600' : 'text-slate-600'
                      }`}>
                        {label}
                      </span>
                    </div>
                    {s < 3 && (
                      <div className={`flex-1 h-0.5 mx-2 transition-all duration-500 rounded-full ${step > s ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                    <Target className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-lg font-bold text-white">Identify the Habit</h2>
                  </div>

                  {/* Habit presets */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-300">
                      What habit do you want to change?
                    </label>
                    {!isCustomHabit ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {HABIT_PRESETS.map(({ label, emoji }) => {
                          const selected = watchHabit === label;
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => setValue('habitType', label, { shouldValidate: true })}
                              className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-medium transition-all duration-200 text-left ${
                                selected
                                  ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-500/10 scale-[1.02]'
                                  : 'bg-slate-900/50 border-slate-700/60 text-slate-300 hover:border-emerald-500/40 hover:text-white hover:bg-slate-800/60'
                              }`}
                            >
                              <span className="text-lg leading-none">{emoji}</span>
                              <span className="leading-tight text-xs">{label}</span>
                              {selected && <Check className="w-3 h-3 text-emerald-400 ml-auto flex-shrink-0" />}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => { setIsCustomHabit(true); setValue('habitType', ''); }}
                          className="flex items-center gap-2 px-3 py-3 rounded-xl border border-dashed border-slate-700 text-sm text-slate-400 hover:border-indigo-400/60 hover:text-indigo-300 transition-all duration-200 bg-slate-900/30"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span className="text-xs">Custom habit...</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type your habit (e.g. caffeine, late eating)..."
                          className="glass-input flex-1"
                          {...register('habitType')}
                        />
                        <button
                          type="button"
                          onClick={() => { setIsCustomHabit(false); setValue('habitType', ''); }}
                          className="text-sm text-slate-400 hover:text-white px-3 py-2 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                        >
                          Presets
                        </button>
                      </div>
                    )}
                    {errors.habitType && (
                      <span className="text-xs text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> {errors.habitType.message}
                      </span>
                    )}
                  </div>

                  {/* Frequency + Severity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-indigo-400" /> Frequency
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 4 hours a day, 10 times daily"
                        className="glass-input w-full"
                        {...register('frequency')}
                      />
                      {errors.frequency && (
                        <span className="text-xs text-rose-400">{errors.frequency.message}</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">Severity Level</label>
                      <div className="flex gap-2">
                        {SEVERITY_OPTIONS.map((opt) => {
                          const sel = watchSeverity === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setValue('severity', opt.value)}
                              className={`flex-1 flex flex-col items-center py-2.5 px-1 rounded-xl border text-xs font-semibold transition-all duration-200 ${sel ? opt.color : opt.idle}`}
                            >
                              <span className={`w-2 h-2 rounded-full mb-1 ${sel ? opt.dot : 'bg-slate-600'}`} />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                    <Zap className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-lg font-bold text-white">Triggers & Environment</h2>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-300">
                      What sparks this habit? <span className="text-slate-500 font-normal">(select all that apply)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {TRIGGER_PRESETS.map(({ label, emoji }) => {
                        const sel = selectedTriggers.includes(label);
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => handleTriggerToggle(label)}
                            className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm transition-all duration-200 text-left ${
                              sel
                                ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10 scale-[1.02]'
                                : 'bg-slate-900/50 border-slate-700/60 text-slate-300 hover:border-indigo-400/40 hover:text-white hover:bg-slate-800/60'
                            }`}
                          >
                            <span className="text-base leading-none">{emoji}</span>
                            <span className="text-xs leading-tight">{label}</span>
                            {sel && <Check className="w-3 h-3 text-indigo-400 ml-auto flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom trigger input */}
                    <input
                      type="text"
                      placeholder="Add a custom trigger and press Enter..."
                      className="glass-input w-full text-sm"
                      onKeyDown={handleAddCustomTrigger}
                    />

                    {/* Trigger chips */}
                    {selectedTriggers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTriggers.map((t) => (
                          <span
                            key={t}
                            onClick={() => handleTriggerToggle(t)}
                            className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 transition-colors"
                          >
                            {t} ×
                          </span>
                        ))}
                      </div>
                    )}
                    {errors.triggers && (
                      <span className="text-xs text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> {errors.triggers.message}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Common Environment / Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Alone in my bedroom, at my desk at work, in bed"
                      className="glass-input w-full"
                      {...register('environment')}
                    />
                    {errors.environment && (
                      <span className="text-xs text-rose-400">{errors.environment.message}</span>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                    <Moon className="w-5 h-5 text-rose-400" />
                    <h2 className="text-lg font-bold text-white">Wellness Baseline</h2>
                  </div>

                  {/* Slider trio */}
                  <div className="space-y-5">
                    {/* Motivation */}
                    <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm font-semibold text-slate-200">Motivation Level</span>
                        </div>
                        <span className="text-xl font-black text-emerald-400">{watchMotivation}<span className="text-slate-500 text-sm font-normal">/10</span></span>
                      </div>
                      <input
                        type="range" min="1" max="10"
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        onChange={(e) => setValue('motivationLevel', Number(e.target.value))}
                        value={watchMotivation}
                      />
                      <p className="text-[11px] text-slate-500">How committed are you to breaking this habit?</p>
                    </div>

                    {/* Stress */}
                    <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-indigo-400" />
                          <span className="text-sm font-semibold text-slate-200">Average Stress Level</span>
                        </div>
                        <span className="text-xl font-black text-indigo-400">{watchStress}<span className="text-slate-500 text-sm font-normal">/10</span></span>
                      </div>
                      <input
                        type="range" min="1" max="10"
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        onChange={(e) => setValue('stressLevel', Number(e.target.value))}
                        value={watchStress}
                      />
                      <p className="text-[11px] text-slate-500">General day-to-day tension or anxiety</p>
                    </div>
                  </div>

                  {/* Sleep + Notes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                        <Moon className="w-4 h-4 text-rose-400" /> Sleep Hours
                      </label>
                      <input
                        type="number" step="0.5"
                        className="glass-input w-full"
                        onChange={(e) => setValue('sleepHours', Number(e.target.value), { shouldValidate: true })}
                        value={watchSleep}
                      />
                      {errors.sleepHours && (
                        <span className="text-xs text-rose-400">{errors.sleepHours.message}</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">Additional Context</label>
                      <textarea
                        rows={2}
                        placeholder="Any specific challenges or goals..."
                        className="glass-input resize-none py-2 w-full"
                        {...register('notes')}
                      />
                    </div>
                  </div>

                  {/* AI notice */}
                  <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/15 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Upon submission, your answers are securely analyzed by{' '}
                      <strong className="text-slate-200">Google Gemini AI</strong> to formulate a cognitive
                      behavioral blueprint including triggers, weekly targets, and replacement strategies.
                    </p>
                  </div>

                  {Object.keys(errors).length > 0 && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Please check previous steps — some required fields are missing or invalid.</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Navigation ── */}
              <div className="flex justify-between items-center border-t border-slate-800/60 pt-6 mt-6 gap-3">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={isSubmitting}
                    className="glass-button-secondary py-2.5 px-5 text-sm flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="glass-button-primary py-2.5 px-6 text-sm flex items-center gap-1.5"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="glass-button-primary py-2.5 px-6 text-sm flex items-center gap-2 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Generating AI Plan...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-white" />
                        Finalize Assessment
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Sub-text */}
        <p className="text-center text-[11px] text-slate-600 mt-4">
          🔒 Your data stays private. Never shared without consent.
        </p>
      </div>
    </div>
  );
};
export default Assessment;
