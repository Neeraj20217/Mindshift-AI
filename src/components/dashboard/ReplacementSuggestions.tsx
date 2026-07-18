import React, { useState, useEffect } from 'react';
import { aiService } from '../../services/ai';
import { Sparkles, Play, Square, Check, Loader2 } from 'lucide-react';

interface ReplacementSuggestionsProps {
  habitType: string;
}

interface Suggestion {
  suggestion: string;
  difficulty: string;
  whyText: string;
}

export const ReplacementSuggestions: React.FC<ReplacementSuggestionsProps> = ({ habitType }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeTimerIdx, setActiveTimerIdx] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [timerRunning, setTimerRunning] = useState(false);
  const [completedActions, setCompletedActions] = useState<number[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const res = await aiService.getReplacementSuggestions(habitType);
        setSuggestions(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, [habitType]);

  // Timer tick effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && activeTimerIdx !== null) {
      setTimerRunning(false);
      setCompletedActions((prev) => {
        if (!prev.includes(activeTimerIdx)) {
          return [...prev, activeTimerIdx];
        }
        return prev;
      });
      setActiveTimerIdx(null);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timeLeft, activeTimerIdx]);

  const startTimer = (idx: number) => {
    setTimeLeft(300); // Reset to 5m
    setActiveTimerIdx(idx);
    setTimerRunning(true);
  };

  const stopTimer = () => {
    setTimerRunning(false);
    setActiveTimerIdx(null);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-xl flex items-center justify-center min-h-[220px]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  const getDiffColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            Smart Replacement Suggestions
          </h3>
          <p className="text-xs text-slate-400">Rewire triggers by exchanging cues for micro-accomplishments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suggestions.map((s, idx) => {
          const isTimerActive = activeTimerIdx === idx;
          const isCompleted = completedActions.includes(idx);

          return (
            <div
              key={idx}
              className={`glass-panel p-5 rounded-xl border flex flex-col justify-between transition-all duration-300 relative ${
                isTimerActive ? 'border-emerald-500 bg-emerald-950/10 ring-1 ring-emerald-500/20' : 'border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${getDiffColor(s.difficulty)}`}>
                    {s.difficulty}
                  </span>
                  {isCompleted && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                      <Check className="w-3 h-3" /> Done
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                    {s.suggestion}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.whyText}</p>
                </div>
              </div>

              {/* Timer interface overlay or actions */}
              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                {isTimerActive ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-sm text-emerald-400 font-bold bg-emerald-950/30 border border-emerald-500/30 px-3 py-1 rounded-lg">
                      {formatTime(timeLeft)}
                    </span>
                    <button
                      onClick={stopTimer}
                      className="text-xs flex items-center gap-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      <Square className="w-3 h-3 fill-rose-300" /> Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-[10px] text-slate-500 font-medium">5-min rewiring drill</span>
                    <button
                      onClick={() => startTimer(idx)}
                      disabled={activeTimerIdx !== null}
                      className="text-xs font-semibold flex items-center gap-1 text-slate-200 hover:text-emerald-400 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 px-3 py-1.5 rounded-lg transition-all duration-200"
                    >
                      <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" /> Start Drill
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
