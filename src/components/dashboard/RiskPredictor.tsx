import React, { useState, useEffect } from 'react';
import { aiService } from '../../services/ai';
import type { HabitAssessment, JournalEntry } from '../../types/habit';
import { ShieldCheck, Loader2, Sparkles, RefreshCw } from 'lucide-react';

interface RiskPredictorProps {
  assessment: HabitAssessment;
  recentJournals: JournalEntry[];
  streak: number;
}

export const RiskPredictor: React.FC<RiskPredictorProps> = ({ assessment, recentJournals, streak }) => {
  const [loading, setLoading] = useState(false);
  const [riskData, setRiskData] = useState<{
    riskLevel: 'low' | 'medium' | 'high';
    percentageScore: number;
    explanation: string;
    preventiveActions: string[];
  } | null>(null);

  const fetchRisk = async () => {
    setLoading(true);
    try {
      const moods = recentJournals.slice(0, 3).map(j => j.aiAnalysis?.mood || 'Neutral');
      const response = await aiService.predictRelapseRisk(
        streak,
        assessment.triggers,
        assessment.stressLevel,
        assessment.sleepHours,
        moods
      );
      setRiskData(response);
    } catch (e) {
      console.error('Failed to predict risk:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisk();
  }, [streak, assessment.stressLevel, assessment.sleepHours]);

  if (loading && !riskData) {
    return (
      <div className="glass-panel p-6 rounded-xl flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
        <span className="text-slate-400 text-sm">Evaluating biological vulnerability...</span>
      </div>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return { text: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', stroke: '#10b981' };
      case 'medium': return { text: 'text-indigo-400', border: 'border-indigo-500/20', bg: 'bg-indigo-500/10', stroke: '#6366f1' };
      case 'high': return { text: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/10', stroke: '#f43f5e' };
      default: return { text: 'text-slate-400', border: 'border-slate-800', bg: 'bg-slate-900', stroke: '#64748b' };
    }
  };

  const risk = riskData || { riskLevel: 'low' as const, percentageScore: 20, explanation: 'Establishing default baselines...', preventiveActions: ['Maintain routine'] };
  const colors = getRiskColor(risk.riskLevel);
  
  // SVG Stroke parameters
  const radius = 60;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (risk.percentageScore / 100) * circumference;

  return (
    <div className="glass-panel p-6 rounded-xl relative overflow-hidden transition-all duration-300">
      {/* Background glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full blur-[40px] pointer-events-none`} />

      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            AI Relapse Risk Predictor
          </h3>
          <p className="text-xs text-slate-400">Forecasting relapse probability based on stress, sleep, and triggers</p>
        </div>
        <button 
          onClick={fetchRisk}
          disabled={loading}
          className="text-slate-400 hover:text-emerald-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800/50"
          title="Refresh Analysis"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SVG Ring Graph */}
        <div className="md:col-span-4 flex justify-center relative">
          <svg className="w-36 h-36 transform -rotate-90">
            {/* Background Ring */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke="#1e293b"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Fill Ring */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke={colors.stroke}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{risk.percentageScore}%</span>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${colors.text}`}>
              {risk.riskLevel} Risk
            </span>
          </div>
        </div>

        {/* Explainers */}
        <div className="md:col-span-8 space-y-4">
          <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-lg">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              AI Vulnerability Diagnostics
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">{risk.explanation}</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
              Recommended Protective Shield
            </h4>
            <ul className="space-y-1.5">
              {risk.preventiveActions.map((action, i) => (
                <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
