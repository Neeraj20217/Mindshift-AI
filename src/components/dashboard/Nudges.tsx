import React from 'react';
import type { HabitAssessment } from '../../types/habit';
import { AlertCircle, Clock, Zap, Target, BookOpen } from 'lucide-react';

interface NudgesProps {
  assessment: HabitAssessment;
}

export const Nudges: React.FC<NudgesProps> = ({ assessment }) => {
  const getContextualNudges = () => {
    const nudges = [];
    const hours = new Date().getHours();
    
    // Nudge 1: Time of Day Nudge
    if (hours >= 20 || hours <= 4) {
      nudges.push({
        id: 'time',
        icon: <Clock className="w-4.5 h-4.5 text-indigo-400" />,
        title: 'Late Night High-Risk Period',
        description: `It is currently late. Relapses for ${assessment.habitType} are 60% more common after 9 PM. Consider turning off devices.`,
        bg: 'border-indigo-500/20 bg-indigo-500/5',
      });
    } else {
      nudges.push({
        id: 'time',
        icon: <Clock className="w-4.5 h-4.5 text-emerald-400" />,
        title: 'Mid-Day Focus Check',
        description: `You are in a productive window. Ensure you take a brief offline stretch to release eye strain and reset tension.`,
        bg: 'border-emerald-500/20 bg-emerald-500/5',
      });
    }

    // Nudge 2: Stress / Trigger Nudge
    if (assessment.stressLevel > 6) {
      nudges.push({
        id: 'stress',
        icon: <AlertCircle className="w-4.5 h-4.5 text-rose-400" />,
        title: 'Elevated Stress Vulnerability',
        description: `Your stress level is recorded at ${assessment.stressLevel}/10. Stress is your primary trigger. Take a 3-minute breath break.`,
        bg: 'border-rose-500/20 bg-rose-500/5',
      });
    } else {
      nudges.push({
        id: 'trigger',
        icon: <Zap className="w-4.5 h-4.5 text-amber-400" />,
        title: 'Trigger Defense Active',
        description: `Your top trigger is "${assessment.triggers[0] || 'Stress'}". When cue triggers appear, remember the 5-second pause rule.`,
        bg: 'border-amber-500/20 bg-amber-500/5',
      });
    }

    // Nudge 3: Progress Nudge
    if (assessment.currentStreak > 0) {
      nudges.push({
        id: 'streak',
        icon: <Target className="w-4.5 h-4.5 text-emerald-400" />,
        title: `${assessment.currentStreak}-Day Streak Shield`,
        description: `Your neural pathways are rewiring. Every day you avoid ${assessment.habitType}, your brain adapts. Protect this shield!`,
        bg: 'border-emerald-500/20 bg-emerald-500/5',
      });
    } else {
      nudges.push({
        id: 'start',
        icon: <BookOpen className="w-4.5 h-4.5 text-cyan-400" />,
        title: 'Beginner Reward Active',
        description: 'You are taking the first steps of neuroplasticity. Focus on today\'s micro-mission to lock in your first streak day.',
        bg: 'border-cyan-500/20 bg-cyan-500/5',
      });
    }

    return nudges;
  };

  const activeNudges = getContextualNudges();

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-300 px-1 uppercase tracking-wider">
        Contextual AI Nudges
      </h4>
      <div className="grid grid-cols-1 gap-3">
        {activeNudges.map((nudge) => (
          <div
            key={nudge.id}
            className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01] ${nudge.bg}`}
          >
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              {nudge.icon}
            </div>
            <div className="space-y-0.5">
              <h5 className="text-sm font-medium text-white">{nudge.title}</h5>
              <p className="text-xs text-slate-400 leading-relaxed">{nudge.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Nudges;
