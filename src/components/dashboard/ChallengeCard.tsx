import React, { useState, useEffect } from 'react';
import type { HabitAssessment } from '../../types/habit';
import { CheckCircle2, Circle, Trophy, Award, Sparkles } from 'lucide-react';

interface ChallengeCardProps {
  assessment: HabitAssessment;
}

interface ChallengeDay {
  day: number;
  task: string;
  completed: boolean;
}

const DEFAULT_CHALLENGES: Record<string, string[]> = {
  'Doom scrolling': [
    'Put phone in another room during breakfast.',
    'Install a screen time tracker and set a 1-hour limit.',
    'Take a 10-minute walk after lunch without your phone.',
    'Establish a screen-free boundary 30 minutes before sleep.',
    'Replace scrolling with reading 5 pages of a physical book.',
    'Go offline for 3 consecutive hours in the afternoon.',
    'Journal your reflections on screen detox experience.'
  ],
  'Smoking / Vaping': [
    'Delay your first smoke/vape of the day by 1 hour.',
    'Throw away all accessible lighters and ash trays.',
    'Perform 10 box breaths when a craving occurs.',
    'Spend the entire evening in a smoke-free public venue.',
    'Replace a smoke break with a tall glass of ice water.',
    'Delay reacting to a smoking trigger by exactly 15 minutes.',
    'Celebrate 24 hours smoke-free and record emotional progress.'
  ]
};

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ assessment }) => {
  const [days, setDays] = useState<ChallengeDay[]>([]);
  const habit = assessment.habitType;

  useEffect(() => {
    // Check if challenge state is cached in local storage
    const cached = localStorage.getItem(`mindshift_challenge_${assessment.uid}`);
    if (cached) {
      setDays(JSON.parse(cached));
    } else {
      // Generate new 7-Day challenge tasks
      const presets = DEFAULT_CHALLENGES[habit] || [
        `Identify three key triggers causing your habit.`,
        `Introduce a 10-minute buffer when you feel triggered.`,
        `Replace habit with deep breathing or physical stretches.`,
        `Alter your physical environment to remove habit triggers.`,
        `Share your recovery intentions with a close support contact.`,
        `Achieve 24 consecutive hours of trigger control.`,
        `Evaluate your weekly behavior changes and set next targets.`
      ];

      const initialDays = presets.map((task, i) => ({
        day: i + 1,
        task,
        completed: false
      }));

      setDays(initialDays);
      localStorage.setItem(`mindshift_challenge_${assessment.uid}`, JSON.stringify(initialDays));
    }
  }, [habit, assessment.uid]);

  const toggleDay = (dayNum: number) => {
    const updated = days.map((d) => 
      d.day === dayNum ? { ...d, completed: !d.completed } : d
    );
    setDays(updated);
    localStorage.setItem(`mindshift_challenge_${assessment.uid}`, JSON.stringify(updated));
  };

  const completedCount = days.filter((d) => d.completed).length;
  const progressPercent = days.length > 0 ? Math.round((completedCount / days.length) * 100) : 0;
  const isFinished = progressPercent === 100;

  return (
    <div className="glass-panel p-6 rounded-xl border border-slate-800 relative overflow-hidden transition-all duration-300">
      {/* Glow backgrounds */}
      {isFinished && (
        <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none" />
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            7-Day Neuro-Rewiring Challenge
          </h3>
          <p className="text-xs text-slate-400">Complete daily tasks to rewrite trigger routines</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
          <span className="text-xs text-slate-400 font-semibold font-mono">
            {completedCount}/{days.length} Days
          </span>
        </div>
      </div>

      {/* Progress slider */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500 font-medium">Challenge Progress</span>
          <span className="text-emerald-400 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Days list grid */}
      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        {days.map((d) => (
          <button
            key={d.day}
            onClick={() => toggleDay(d.day)}
            className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all duration-200 ${
              d.completed
                ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-400'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-200'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {d.completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/10" />
              ) : (
                <Circle className="w-5 h-5 text-slate-600 hover:text-emerald-400" />
              )}
            </div>
            <div className="space-y-0.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${d.completed ? 'text-emerald-500/60' : 'text-emerald-400'}`}>
                Day {d.day}
              </span>
              <p className={`text-xs ${d.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                {d.task}
              </p>
            </div>
          </button>
        ))}
      </div>

      {isFinished && (
        <div className="mt-5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3 animate-fadeIn">
          <Award className="w-8 h-8 text-emerald-400 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" /> Challenge Completed!
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
              Your neural elasticity is locking in! Consider launching a 14-day detox to solidify your habit change.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
