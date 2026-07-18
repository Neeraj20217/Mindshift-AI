import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { storageService } from '../../services/storage';
import { aiService } from '../../services/ai';
import type { JournalEntry } from '../../types/habit';
import { Calendar, PenTool, Sparkles, Smile, Compass, AlertCircle, Loader2, Check } from 'lucide-react';

interface DailyJournalProps {
  onJournalSaved: () => void;
}

export const DailyJournal: React.FC<DailyJournalProps> = ({ onJournalSaved }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<JournalEntry | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const history = await storageService.getJournalEntries(user.uid);
      setJournals(history);
      if (history.length > 0 && !activeAnalysis) {
        setActiveAnalysis(history[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setIsAnalyzing(true);
    try {
      // 1. Analyze reflection using Gemini
      const analysis = await aiService.analyzeJournal(content);

      const entry: JournalEntry = {
        id: `journal_${Date.now()}`,
        uid: user.uid,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        content,
        aiAnalysis: analysis
      };

      // 2. Save to storage
      await storageService.saveJournalEntry(entry);
      
      setContent('');
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      
      await fetchHistory();
      setActiveAnalysis(entry);
      onJournalSaved();
    } catch (err) {
      console.error('Error saving journal:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMoodColor = (mood: string) => {
    const lowercase = mood.toLowerCase();
    if (lowercase.includes('happy') || lowercase.includes('positive') || lowercase.includes('content') || lowercase.includes('motivated')) {
      return 'text-emerald-400 text-glow-emerald';
    }
    if (lowercase.includes('anxious') || lowercase.includes('stressed') || lowercase.includes('overwhelmed')) {
      return 'text-amber-400 text-glow-indigo';
    }
    return 'text-rose-400 text-glow-rose';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Editor & History (Col Span 7) */}
      <div className="md:col-span-7 space-y-6">
        {/* Editor Form */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <PenTool className="w-5 h-5 text-emerald-400" />
            AI Reflective Journal
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">
                How was your day? Write about triggers, feelings, cravings, or small wins.
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Today, I noticed a strong urge to open social media around 4 PM when I hit a wall at work..."
                rows={5}
                className="glass-input w-full resize-none"
                disabled={isAnalyzing}
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500">
                AI analyzes mood patterns & flags habit dependencies.
              </span>
              <button
                type="submit"
                disabled={isAnalyzing || !content.trim()}
                className="glass-button-primary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                    Analyzing Patterns...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                    Reflect with AI
                  </>
                )}
              </button>
            </div>
            {successMsg && (
              <div className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                <Check className="w-4 h-4" /> Reflection logged & analyzed successfully!
              </div>
            )}
          </form>
        </div>

        {/* History List */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-4">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Reflection Log History
          </h4>

          {journals.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4 text-center">
              No journal entries recorded. Write your first reflection above!
            </p>
          ) : (
            <div className="divide-y divide-slate-800 max-h-[250px] overflow-y-auto pr-1">
              {journals.map((j) => (
                <button
                  key={j.id}
                  onClick={() => setActiveAnalysis(j)}
                  className={`w-full text-left py-3 px-2 flex items-center justify-between rounded-lg transition-colors hover:bg-slate-800/30 ${
                    activeAnalysis?.id === j.id ? 'bg-slate-900/60 border border-slate-800' : 'border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-500/80" />
                    <span className="text-xs font-semibold text-slate-300">
                      {new Date(j.createdAt).toLocaleDateString(undefined, { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <span className={`text-[10px] border px-2 py-0.5 rounded-full font-medium ${
                    j.aiAnalysis ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    {j.aiAnalysis?.mood || 'Pending'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Analysis View (Col Span 5) */}
      <div className="md:col-span-5">
        <div className="glass-panel p-6 rounded-xl border border-slate-800 h-full flex flex-col justify-between relative overflow-hidden">
          {/* Background glow decoration */}
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none" />

          {activeAnalysis ? (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">
                  Gemini Behavioral Audit
                </span>
                <h3 className="text-base font-semibold text-white mt-0.5">
                  Analysis for {new Date(activeAnalysis.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                  })}
                </h3>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Core Emotion</span>
                  <span className={`text-sm font-bold block ${getMoodColor(activeAnalysis.aiAnalysis?.mood || 'Neutral')}`}>
                    {activeAnalysis.aiAnalysis?.mood || 'Neutral'}
                  </span>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Stress Indicator</span>
                  <span className="text-sm font-bold text-slate-200 block">
                    {activeAnalysis.aiAnalysis?.stressLevel || 5}/10
                  </span>
                </div>
              </div>

              {/* Triggers list */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
                  Identified Cue Triggers:
                </span>
                <div className="flex flex-wrap gap-1">
                  {activeAnalysis.aiAnalysis?.triggersIdentified.map((t, idx) => (
                    <span key={idx} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded-md font-semibold">
                      {t}
                    </span>
                  ))}
                  {(!activeAnalysis.aiAnalysis?.triggersIdentified || activeAnalysis.aiAnalysis.triggersIdentified.length === 0) && (
                    <span className="text-xs text-slate-500 italic">None flagged</span>
                  )}
                </div>
              </div>

              {/* Improvements details */}
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg space-y-1">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Smile className="w-3.5 h-3.5" />
                  AI Encouragement & Win:
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {activeAnalysis.aiAnalysis?.improvements || 'Writing down details helps identify cue triggers.'}
                </p>
              </div>

              {/* Habits details */}
              <div className="bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-lg space-y-1">
                <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5" />
                  Recurring Patterns:
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {activeAnalysis.aiAnalysis?.patterns || 'Habit cycle is connected with environment patterns.'}
                </p>
              </div>

              <div className="text-[10px] text-slate-500 border-t border-slate-900 pt-3 italic">
                "Writing is the first step toward self-directed awareness."
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Compass className="w-12 h-12 text-slate-700 animate-pulse mb-3" />
              <h4 className="text-sm font-semibold text-slate-400">No Journal Selected</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                Create a daily entry or select a past log from history to view cognitive analysis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
