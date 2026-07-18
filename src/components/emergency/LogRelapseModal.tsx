import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { storageService } from '../../services/storage';
import { aiService } from '../../services/ai';
import type { RelapseAdvice } from '../../types/habit';
import { AlertCircle, Loader2, Sparkles, CheckCircle, RefreshCw, X } from 'lucide-react';

interface LogRelapseModalProps {
  onClose: () => void;
  onLogged: () => void;
}

const EMOTIONAL_STATES = [
  'Stressed / Anxious',
  'Bored / Under-stimulated',
  'Fatigued / Tired',
  'Lonely / Isolated',
  'Angry / Frustrated',
  'Habitual / Autopilot',
];

export const LogRelapseModal: React.FC<LogRelapseModalProps> = ({ onClose, onLogged }) => {
  const { user } = useAuth();
  const [trigger, setTrigger] = useState('');
  const [emotionalState, setEmotionalState] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [advice, setAdvice] = useState<RelapseAdvice | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !trigger || !emotionalState) return;

    setIsSubmitting(true);
    try {
      // 1. Get recovery advice from Gemini
      const resAdvice = await aiService.analyzeRelapse(trigger, emotionalState, notes);

      // 2. Save relapse entry to DB
      const relapseId = `relapse_${Date.now()}`;
      await storageService.saveRelapseLog({
        id: relapseId,
        uid: user.uid,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        timeOfDay: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        trigger,
        emotionalState,
        notes,
        aiRecoveryAdvice: resAdvice,
      });

      // 3. Reset assessment streak count to 0
      const assessment = await storageService.getHabitAssessment(user.uid);
      if (assessment) {
        assessment.currentStreak = 0;
        await storageService.saveHabitAssessment(assessment);
      }

      setAdvice(resAdvice);
      onLogged();
    } catch (err) {
      console.error('Error logging relapse:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg glass-panel p-6 rounded-xl border border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {!advice ? (
          // Form View
          <form onSubmit={handleSubmit} className="space-y-5 animate-fadeIn">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                Log a Slip / Relapse
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Be honest with yourself. This is a judgment-free zone. Slipping is a normal part of behavioral conditioning.
              </p>
            </div>

            <div className="space-y-4">
              {/* Trigger */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-300 font-semibold">What was the cue/trigger?</label>
                <input
                  type="text"
                  placeholder="e.g. Bored at midnight, work stress spike, phone notification"
                  className="glass-input text-sm"
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  required
                />
              </div>

              {/* Emotional State */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-300 font-semibold">How did you feel right before?</label>
                <div className="grid grid-cols-2 gap-2">
                  {EMOTIONAL_STATES.map((state) => (
                    <button
                      key={state}
                      type="button"
                      onClick={() => setEmotionalState(state)}
                      className={`text-left px-3 py-2 rounded-lg border text-xs transition-all duration-200 ${
                        emotionalState === state
                          ? 'bg-rose-500/20 border-rose-500 text-white font-medium'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-300 font-semibold">Context / Notes (What happened?)</label>
                <textarea
                  placeholder="Explain briefly. Did you lose control? How long did it last? E.g., I scrolled Instagram for 45 minutes after checking a work message."
                  className="glass-input text-sm resize-none"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-800/80 pt-4">
              <span className="text-[10px] text-slate-500">Streak resets to 0. We refocus immediately.</span>
              <button
                type="submit"
                disabled={isSubmitting || !trigger || !emotionalState}
                className="glass-button-danger text-xs py-2.5 px-4 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    Analyzing Slip...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    Log & Refocus
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          // AI Advice & Encourgement View
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Slip Successfully Logged</h3>
              <p className="text-xs text-slate-400 mt-1">Refocusing cycle initiated.</p>
            </div>

            {/* AI Encouragement */}
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg space-y-1.5">
              <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">
                AI Coach Insight
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {advice.encouragement}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Immediate action */}
              <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-lg space-y-1">
                <span className="text-[10px] text-rose-400 uppercase font-semibold">Immediate Shield</span>
                <p className="text-xs text-slate-300 leading-relaxed">{advice.immediateAction}</p>
              </div>

              {/* Micro-goal */}
              <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-lg space-y-1">
                <span className="text-[10px] text-indigo-400 uppercase font-semibold">Next Micro-Goal</span>
                <p className="text-xs text-slate-300 leading-relaxed">{advice.microGoal}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full glass-button-primary text-xs py-3 font-bold text-slate-950 flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-950" />
              Reset Baseline & Begin Fresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default LogRelapseModal;
