import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { storageService } from './services/storage';
import { Auth } from './pages/Auth';
import { Assessment } from './pages/Assessment';
import { Dashboard } from './pages/Dashboard';
import { Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [checkingAssessment, setCheckingAssessment] = useState(true);
  const [hasAssessment, setHasAssessment] = useState(false);

  const checkUserAssessment = async () => {
    if (!user) {
      setHasAssessment(false);
      setCheckingAssessment(false);
      return;
    }
    setCheckingAssessment(true);
    try {
      const assessment = await storageService.getHabitAssessment(user.uid);
      setHasAssessment(!!assessment);
    } catch (e) {
      console.error(e);
      setHasAssessment(false);
    } finally {
      setCheckingAssessment(false);
    }
  };

  useEffect(() => {
    checkUserAssessment();
  }, [user]);

  if (loading || (user && checkingAssessment)) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        {/* Simple elegant glass loader */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-slate-900 border-t-emerald-500 animate-spin" />
          <Sparkles className="w-6 h-6 text-emerald-400 absolute animate-pulse" />
        </div>
        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-6 animate-pulse">
          Calibrating Neuroplasticity...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!hasAssessment) {
    return <Assessment onComplete={() => setHasAssessment(true)} />;
  }

  return <Dashboard onResetAssessment={() => setHasAssessment(false)} />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
