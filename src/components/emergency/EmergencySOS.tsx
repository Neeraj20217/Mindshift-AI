import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { storageService } from '../../services/storage';
import { aiService } from '../../services/ai';
import type { RelapseAdvice } from '../../types/habit';
import { Heart, Compass, ShieldAlert, CheckCircle, RefreshCw, X } from 'lucide-react';

interface EmergencySOSProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const EmergencySOS: React.FC<EmergencySOSProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [advice, setAdvice] = useState<RelapseAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCount, setBreathCount] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [survivalLogged, setSurvivalLogged] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const res = await aiService.getEmergencyAdvice();
      setAdvice(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, []);

  // Breathing trainer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setBreathCount((c) => {
        if (c <= 1) {
          // Switch phase
          if (breathPhase === 'inhale') {
            setBreathPhase('hold');
            return 4; // Hold for 4
          } else if (breathPhase === 'hold') {
            setBreathPhase('exhale');
            return 6; // Exhale for 6
          } else {
            setBreathPhase('inhale');
            setCompletedCycles((cycles) => cycles + 1);
            return 4; // Inhale for 4
          }
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [breathPhase]);

  const handleSurvival = async () => {
    if (!user) return;
    setSurvivalLogged(true);
    try {
      const assessment = await storageService.getHabitAssessment(user.uid);
      if (assessment) {
        // Increment streak as a reward for surviving the emergency!
        assessment.currentStreak += 1;
        if (assessment.currentStreak > assessment.longestStreak) {
          assessment.longestStreak = assessment.currentStreak;
        }
        await storageService.saveHabitAssessment(assessment);
      }
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const getBreathInstructions = () => {
    switch (breathPhase) {
      case 'inhale': return { text: 'Breathe In slowly...', color: 'text-emerald-400 text-glow-emerald', sizeClass: 'scale-100' };
      case 'hold': return { text: 'Hold your breath...', color: 'text-indigo-400 text-glow-indigo', sizeClass: 'scale-105' };
      case 'exhale': return { text: 'Exhale fully...', color: 'text-rose-400 text-glow-rose', sizeClass: 'scale-90' };
    }
  };

  const currentBreath = getBreathInstructions();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      {/* High contrast close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-2xl text-center space-y-8 animate-fadeIn">
        {/* Urgent Shield */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-4 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-white text-glow-rose tracking-tight">
            Emergency Grounding Mode
          </h2>
          <p className="text-slate-400 text-sm max-w-md mt-2">
            Do not react. Your amygdala is firing. Follow the rhythm below to sever the neurological cue loop.
          </p>
        </div>

        {/* Breathing Circle Trainer */}
        <div className="flex flex-col items-center justify-center my-6">
          <div 
            className={`w-44 h-44 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out breathing-ring ${
              breathPhase === 'inhale' ? 'border-emerald-500/60' : breathPhase === 'hold' ? 'border-indigo-500/60' : 'border-rose-500/60'
            }`}
          >
            <span className={`text-sm font-semibold tracking-wider transition-all duration-300 uppercase ${currentBreath.color}`}>
              {breathPhase}
            </span>
            <span className="text-4xl font-extrabold text-white font-mono mt-1">
              {breathCount}s
            </span>
            <span className="text-[10px] text-slate-500 mt-2 font-medium">
              Cycle {completedCycles + 1}
            </span>
          </div>
          <span className="text-base font-semibold text-slate-200 mt-4 h-6">
            {currentBreath.text}
          </span>
        </div>

        {/* Gemini Advice Cards */}
        {loading ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
            <span className="text-xs text-slate-400">Loading custom cognitive shield...</span>
          </div>
        ) : advice ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-xl mx-auto">
            {/* Core calming statement */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
                <Heart className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                CBT Calming Shield
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">{advice.encouragement}</p>
            </div>

            {/* Tactical immediate action */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase">
                <Compass className="w-4 h-4 text-indigo-400" />
                Immediate Redirection
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-white">Action:</strong> {advice.immediateAction}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-900/50 rounded-lg text-slate-400 text-xs">
            Offline grounding instructions active. Drink cold water and walk away from devices.
          </div>
        )}

        {/* SOS Survival Button */}
        <div className="pt-4 max-w-sm mx-auto flex flex-col gap-2">
          {survivalLogged ? (
            <div className="flex items-center justify-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl animate-fadeIn">
              <CheckCircle className="w-5 h-5 fill-emerald-400 text-slate-950" />
              <span className="font-semibold text-sm">Crisis averted! Streak incremented.</span>
            </div>
          ) : (
            <>
              <button
                onClick={handleSurvival}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-emerald-500/20 hover:brightness-105 active:scale-98 text-slate-950 text-sm font-bold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5 text-slate-950 fill-slate-950" />
                The Craving Has Passed
              </button>
              <button
                onClick={onClose}
                className="w-full text-xs text-slate-400 hover:text-slate-300 py-2 border border-transparent"
              >
                Close Grounding Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default EmergencySOS;
