import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { storageService } from './services/storage';
import { AnimatedBackground } from './components/ui/AnimatedBackground';
import { Sparkles } from 'lucide-react';

const Auth = lazy(() => import('./pages/Auth'));
const Assessment = lazy(() => import('./pages/Assessment'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
    <div className="relative w-16 h-16 flex items-center justify-center">
      <div className="w-16 h-16 rounded-full border-4 border-slate-900 border-t-emerald-500 animate-spin" />
      <Sparkles className="w-6 h-6 text-emerald-400 absolute animate-pulse" />
    </div>
    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-6 animate-pulse">
      Calibrating Neuroplasticity...
    </span>
  </div>
);

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [checkingAssessment, setCheckingAssessment] = useState(true);
  const [hasAssessment, setHasAssessment] = useState(false);

  const checkUserAssessment = React.useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    checkUserAssessment();
  }, [checkUserAssessment]);

  if (loading || (user && checkingAssessment)) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Auth />
      </Suspense>
    );
  }

  if (!hasAssessment) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Assessment onComplete={() => setHasAssessment(true)} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Dashboard onResetAssessment={() => setHasAssessment(false)} />
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      {/* Animated neural network canvas */}
      <AnimatedBackground />
      {/* Drifting aurora orbs */}
      <div className="aurora-orb aurora-orb-1" aria-hidden="true" />
      <div className="aurora-orb aurora-orb-2" aria-hidden="true" />
      <div className="aurora-orb aurora-orb-3" aria-hidden="true" />
      <div className="aurora-orb aurora-orb-4" aria-hidden="true" />
      <AppContent />
    </AuthProvider>
  );
}

export default App;
