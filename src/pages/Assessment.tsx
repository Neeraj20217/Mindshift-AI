import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { storageService } from '../services/storage';
import { aiService } from '../services/ai';
import type { SeverityLevel } from '../types/habit';
import { Brain, Sparkles, AlertTriangle, ShieldCheck, ChevronRight, ChevronLeft, Loader } from 'lucide-react';

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
  'Doom scrolling',
  'Social media addiction',
  'Screen addiction',
  'Gaming addiction',
  'Procrastination',
  'Smoking / Vaping',
  'Alcohol consumption',
  'Sugar / Junk food',
  'Nail biting',
];

const TRIGGER_PRESETS = [
  'Stress / Anxiety',
  'Boredom',
  'Fatigue / Tiredness',
  'Loneliness',
  'Social situations',
  'Late night routine',
  'Work / Study pressure',
];

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
  const watchMotivation = watch('motivationLevel');
  const watchStress = watch('stressLevel');
  const watchSleep = watch('sleepHours');

  const handleTriggerToggle = (trigger: string) => {
    let updated: string[];
    if (selectedTriggers.includes(trigger)) {
      updated = selectedTriggers.filter((t) => t !== trigger);
    } else {
      updated = [...selectedTriggers, trigger];
    }
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
      // 1. Call Gemini to analyze habits and generate plan
      const plan = await aiService.generateAssessment(
        data.habitType,
        data.severity,
        data.frequency,
        data.triggers,
        data.environment,
        data.motivationLevel,
        data.stressLevel,
        data.sleepHours
      );

      // 2. Save Assessment structure to DB
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
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-2xl glass-panel p-8 rounded-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 text-emerald-400 rounded-xl mb-4">
            <Brain className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 text-glow-emerald">
            AI Habit Assessment
          </h1>
          <p className="text-slate-400">
            Let's understand your routine. MindShift AI will analyze your profile and design a psychological recovery program.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center justify-between mb-8 px-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-all duration-300 ${
                  step >= s
                    ? 'bg-emerald-500 text-slate-950 font-bold scale-110 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${
                    step > s ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* STEP 1: Habit Identification */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-xl font-semibold text-slate-200 border-b border-slate-800 pb-2">
                1. Identify the Habit
              </h2>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">What habit do you want to change?</label>
                {!isCustomHabit ? (
                  <div className="grid grid-cols-2 gap-2">
                    {HABIT_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setValue('habitType', preset, { shouldValidate: true })}
                        className={`text-left p-3 rounded-lg border text-sm transition-all duration-200 ${
                          watchHabit === preset
                            ? 'bg-emerald-500/20 border-emerald-500 text-white font-medium shadow-md shadow-emerald-500/10'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomHabit(true);
                        setValue('habitType', '');
                      }}
                      className="text-left p-3 rounded-lg border border-slate-800 text-sm bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
                    >
                      + Custom Habit...
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type custom habit (e.g. caffeine, late eating)..."
                      className="glass-input flex-1"
                      {...register('habitType')}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomHabit(false);
                        setValue('habitType', '');
                      }}
                      className="text-sm text-slate-400 hover:text-white px-2"
                    >
                      Use Presets
                    </button>
                  </div>
                )}
                {errors.habitType && (
                  <span className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {errors.habitType.message}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-300">Frequency</label>
                  <input
                    type="text"
                    placeholder="e.g. 4 hours a day, 10 times daily"
                    className="glass-input"
                    {...register('frequency')}
                  />
                  {errors.frequency && (
                    <span className="text-xs text-rose-400">{errors.frequency.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-300">Addiction Severity</label>
                  <select className="glass-input" {...register('severity')}>
                    <option value="low">Low - Minor nuisance</option>
                    <option value="moderate">Moderate - Affects daily routine</option>
                    <option value="severe">Severe - Major negative impact</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Triggers & Context */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-xl font-semibold text-slate-200 border-b border-slate-800 pb-2">
                2. Triggers & Environment
              </h2>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                  Select your triggers (Cue factors that spark the habit)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TRIGGER_PRESETS.map((trigger) => (
                    <button
                      key={trigger}
                      type="button"
                      onClick={() => handleTriggerToggle(trigger)}
                      className={`text-left p-3 rounded-lg border text-sm transition-all duration-200 ${
                        selectedTriggers.includes(trigger)
                          ? 'bg-emerald-500/20 border-emerald-500 text-white font-medium shadow-md shadow-emerald-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {trigger}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Add custom trigger and press Enter..."
                    className="glass-input w-full"
                    onKeyDown={handleAddCustomTrigger}
                  />
                </div>
                {selectedTriggers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedTriggers.map((t) => (
                      <span
                        key={t}
                        className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 transition-colors"
                        onClick={() => handleTriggerToggle(t)}
                      >
                        {t} &times;
                      </span>
                    ))}
                  </div>
                )}
                {errors.triggers && (
                  <span className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {errors.triggers.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">Common Environment / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Alone in my bedroom, in bed, at my desk at work"
                  className="glass-input"
                  {...register('environment')}
                />
                {errors.environment && (
                  <span className="text-xs text-rose-400">{errors.environment.message}</span>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Wellbeing Metrics */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-semibold text-slate-200 border-b border-slate-800 pb-2">
                3. Wellness Baseline
              </h2>

              <div className="grid grid-cols-2 gap-6">
                {/* Motivation Level */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm font-medium text-slate-300">
                    <span>Motivation Level</span>
                    <span className="text-emerald-400 font-bold">{watchMotivation}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    onChange={(e) => setValue('motivationLevel', Number(e.target.value))}
                    value={watchMotivation}
                  />
                  <span className="text-[10px] text-slate-500">How committed are you to breaking this habit?</span>
                </div>

                {/* Stress Level */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm font-medium text-slate-300">
                    <span>Average Stress Level</span>
                    <span className="text-indigo-400 font-bold">{watchStress}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    onChange={(e) => setValue('stressLevel', Number(e.target.value))}
                    value={watchStress}
                  />
                  <span className="text-[10px] text-slate-500">General day-to-day tension or anxiety</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-300">Sleep Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="glass-input"
                    onChange={(e) => setValue('sleepHours', Number(e.target.value), { shouldValidate: true })}
                    value={watchSleep}
                  />
                  {errors.sleepHours && (
                    <span className="text-xs text-rose-400">{errors.sleepHours.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-300">Additional Context (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Any specific challenges or goals we should know..."
                    className="glass-input resize-none py-2"
                    {...register('notes')}
                  />
                </div>
              </div>

              <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upon submission, your answers are securely analyzed by <strong className="text-slate-200">Google Gemini AI</strong> to formulate a cognitive behavioral blueprint including triggers, weekly targets, and replacement strategies.
                </p>
              </div>

              {Object.keys(errors).length > 0 && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2 mt-4 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>Please check previous steps. Some required fields (e.g. Habit, Frequency, Triggers, Environment) are missing or invalid.</span>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center border-t border-slate-800/80 pt-6 mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                disabled={isSubmitting}
                className="glass-button-secondary py-2 px-4 text-sm"
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
                className="glass-button-primary py-2 px-5 text-sm"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="glass-button-primary py-2 px-6 text-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin text-slate-950" /> Generating Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" /> Finalize Assessment
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
export default Assessment;
