import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storageService } from '../services/storage';
import type { HabitAssessment, JournalEntry } from '../types/habit';
import { RiskPredictor } from '../components/dashboard/RiskPredictor';
import { Nudges } from '../components/dashboard/Nudges';
import { ChallengeCard } from '../components/dashboard/ChallengeCard';
import { ReplacementSuggestions } from '../components/dashboard/ReplacementSuggestions';
import { BehavioralCoach } from '../components/coach/BehavioralCoach';
import { DailyJournal } from '../components/journal/DailyJournal';
import { WeeklyReportTab } from '../components/dashboard/WeeklyReportTab';
import { EmergencySOS } from '../components/emergency/EmergencySOS';
import { LogRelapseModal } from '../components/emergency/LogRelapseModal';
import { ChatBot } from '../components/coach/ChatBot';
import { 
  LayoutDashboard, 
  Bot, 
  PenTool, 
  BarChart3, 
  ShieldAlert, 
  LogOut, 
  Flame, 
  Sparkles, 
  Award,
  Menu,
  X,
  AlertCircle
} from 'lucide-react';

export const Dashboard: React.FC<{ onResetAssessment: () => void }> = ({ onResetAssessment }) => {
  const { user, logout, isFirebaseMode } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'coach' | 'journal' | 'reports'>('dashboard');
  const [assessment, setAssessment] = useState<HabitAssessment | null>(null);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  
  // Modals state
  const [showSOS, setShowSOS] = useState(false);
  const [showRelapseModal, setShowRelapseModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchUserData = React.useCallback(async () => {
    if (!user) return;
    try {
      const assessData = await storageService.getHabitAssessment(user.uid);
      setAssessment(assessData);
      
      const journalList = await storageService.getJournalEntries(user.uid);
      setJournals(journalList);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    }
  }, [user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleAssessmentReset = async () => {
    if (window.confirm("Are you sure you want to reset your habit profile and start the assessment over?")) {
      if (user) {
        await storageService.clearAllData(user.uid);
      }
      onResetAssessment();
    }
  };

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'coach', label: 'Cognitive Coach', icon: <Bot className="w-5 h-5" /> },
    { id: 'journal', label: 'Daily Reflection', icon: <PenTool className="w-5 h-5" /> },
    { id: 'reports', label: 'Weekly Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative bg-transparent">
      {/* Background radial highlights */}
      {/* Large radial cyan glow behind the hero/dashboard */}
      <div className="absolute top-[-10%] left-[30%] w-[650px] h-[650px] bg-sky-500/8 rounded-full blur-[140px] pointer-events-none z-0" />
      {/* Emerald green accent lighting */}
      <div className="absolute top-[20%] left-[-10%] w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      {/* Soft purple ambient glow */}
      <div className="absolute bottom-[10%] right-[-10%] w-[550px] h-[550px] bg-violet-500/6 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* MOBILE HEADER */}
      <header className="md:hidden border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4 fill-emerald-400" />
          </div>
          <span className="font-extrabold text-white tracking-wide text-sm text-glow-emerald">
            MindShift AI
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-300 hover:text-white p-1"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* SIDEBAR NAVIGATION (Desktop) */}
      <aside className={`w-64 bg-slate-950/60 border-r border-slate-900 flex-shrink-0 flex flex-col justify-between p-6 z-30 md:relative fixed inset-y-0 left-0 transform md:transform-none transition-transform duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="space-y-8 mt-12 md:mt-0">
          {/* Logo brand */}
          <div className="hidden md:flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5 fill-emerald-400 text-glow-emerald" />
            </div>
            <div>
              <h1 className="font-black text-white text-base tracking-wide text-glow-emerald">
                MindShift AI
              </h1>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block -mt-0.5">
                AI Behavior Change
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold shadow-inner'
                    : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-white'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* User profile & actions */}
        <div className="space-y-4 pt-6 border-t border-slate-900">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-sm uppercase">
              {user?.name.charAt(0) || 'G'}
            </div>
            <div className="truncate">
              <h4 className="text-xs font-semibold text-slate-200 truncate">{user?.name}</h4>
              <span className="text-[9px] text-slate-500 truncate block">
                {isFirebaseMode ? 'Cloud Firestore' : 'LocalStorage Guest'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <button
              onClick={handleAssessmentReset}
              className="w-full text-left px-4 py-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-200 text-xs flex items-center gap-2"
            >
              Reset Program Profile
            </button>
            <button
              onClick={() => logout()}
              className="w-full text-left px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200 text-xs font-semibold flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto z-10 max-h-screen">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* HEADER HERO WIDGET */}
          <div className="glass-panel p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
            {/* Ambient shine inside hero */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  Habit: {assessment.habitType}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                  Severity: {assessment.severity}
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white mt-1.5">
                Welcome back, {user?.name.split(' ')[0]}
              </h2>
              <p className="text-xs text-slate-400">
                "Small daily modifications construct bulletproof neural redirection pathways."
              </p>
            </div>

            {/* Streak & Emergency Counters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-900 px-4 py-2.5 rounded-xl">
                <Flame className="w-6 h-6 text-orange-500 fill-orange-500 animate-pulse" />
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-medium">Streak</span>
                  <span className="text-base font-extrabold text-white leading-none font-mono">
                    {assessment.currentStreak} Days
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-900 px-4 py-2.5 rounded-xl">
                <Award className="w-6 h-6 text-amber-500" />
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-medium">Best Streak</span>
                  <span className="text-base font-extrabold text-white leading-none font-mono">
                    {assessment.longestStreak} Days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TAB CONTENTS */}
          <div className="animate-fadeIn">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Diagnostics and Nudges */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Risk Predictor widget (Span 2) */}
                  <div className="md:col-span-2">
                    <RiskPredictor 
                      assessment={assessment} 
                      recentJournals={journals}
                      streak={assessment.currentStreak}
                    />
                  </div>
                  {/* Nudges list widget (Span 1) */}
                  <div className="md:col-span-1">
                    <Nudges assessment={assessment} />
                  </div>
                </div>

                {/* Challenges & Relapse Triggers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ChallengeCard assessment={assessment} />
                  
                  {/* Quick Relapse Log call to action */}
                  <div className="glass-panel p-6 rounded-xl border border-slate-800 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-slate-900/40 to-slate-950/40">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                        Slip Recovery Assistant
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        If you relapsed, do not feel guilty or ashamed. The recovery process is non-linear. Log the event below to analyze the environmental trigger and build a compassionate rescue plan.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowRelapseModal(true)}
                      className="mt-6 w-full text-xs font-bold py-3 border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5"
                    >
                      <AlertCircle className="w-4 h-4 text-rose-300" /> Log Slip & Reboot Baseline
                    </button>
                  </div>
                </div>

                {/* Replacement Suggestions */}
                <ReplacementSuggestions habitType={assessment.habitType} />
              </div>
            )}

            {activeTab === 'coach' && (
              <BehavioralCoach assessment={assessment} />
            )}

            {activeTab === 'journal' && (
              <DailyJournal onJournalSaved={fetchUserData} />
            )}

            {activeTab === 'reports' && (
              <WeeklyReportTab />
            )}
          </div>
        </div>
      </main>

      {/* GLOBAL FLOATING SOS TRIGGER BUTTON */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowSOS(true)}
          className="bg-gradient-to-r from-rose-600 to-red-700 text-white font-extrabold text-sm uppercase px-5 py-3.5 rounded-full shadow-2xl hover:shadow-rose-600/30 border border-rose-500/40 active:scale-95 hover:scale-105 transition-all duration-200 flex items-center gap-2 group tracking-wider"
        >
          <ShieldAlert className="w-5 h-5 text-white animate-bounce group-hover:animate-none" />
          SOS Emergency
        </button>
      </div>

      {/* SOS EMERGENCY MODAL OVERLAY */}
      {showSOS && (
        <EmergencySOS
          onClose={() => setShowSOS(false)}
          onSuccess={fetchUserData}
        />
      )}

      {/* RELAPSE LOGGER MODAL OVERLAY */}
      {showRelapseModal && (
        <LogRelapseModal
          onClose={() => setShowRelapseModal(false)}
          onLogged={() => {
            fetchUserData();
          }}
        />
      )}

      {/* GLOBAL FLOATING AI CHATBOT ASSISTANT */}
      <ChatBot assessment={assessment} />
    </div>
  );
};
export default Dashboard;
