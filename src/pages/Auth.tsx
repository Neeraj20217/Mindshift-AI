import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../contexts/AuthContext';
import {
  Brain, Sparkles, AlertTriangle, KeyRound, Mail, User as UserIcon,
  Loader2, Eye, EyeOff, Zap, ShieldCheck, TrendingUp, Heart, ArrowRight,
} from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
});

type AuthFormValues = z.infer<typeof authSchema>;

// Feature highlights for the left panel
const FEATURES = [
  {
    icon: <Brain className="w-5 h-5 text-emerald-400" />,
    title: 'AI Habit Assessment',
    desc: 'Gemini AI maps your triggers and creates a personalised recovery blueprint.',
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-indigo-400" />,
    title: 'Relapse Risk Predictor',
    desc: 'Real-time risk scoring based on your sleep, stress, and streak data.',
  },
  {
    icon: <Heart className="w-5 h-5 text-rose-400" />,
    title: 'Dr. Shift — CBT Coach',
    desc: 'A compassionate AI therapist available 24/7 to guide you through cravings.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
    title: 'SOS Emergency Mode',
    desc: 'Instant grounding exercises and breathing drills when you need them most.',
  },
];

// Social proof ticker stats
const STATS = [
  { value: '10,000+', label: 'Habits Tracked' },
  { value: '94%', label: 'Feel Improved' },
  { value: '21 Days', label: 'Avg. Streak' },
];

export const Auth: React.FC = () => {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '', name: '' },
  });

  const onSubmit = async (data: AuthFormValues) => {
    setLoading(true);
    setAuthError(null);
    try {
      if (isSignUp) {
        await signup(data.email, data.password, data.name || 'User');
      } else {
        await login(data.email, data.password);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Authentication failed. Please verify credentials.';
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    setAuthError(null);
    try {
      await login('guest@mindshift.ai', 'password123');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Guest login failed.';
      setAuthError(msg);
    } finally {
      setGuestLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsSignUp((v) => !v);
    setAuthError(null);
    reset();
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* ── Ambient Background ── */}
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-rose-500/4 rounded-full blur-[100px] pointer-events-none" />

      {/* ═══════════════════════════════════════════
          LEFT PANEL — Feature Showcase (hidden on mobile)
      ═══════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-14 relative z-10 border-r border-slate-800/50">

        {/* Brand header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="font-black text-white text-lg tracking-tight text-glow-emerald">MindShift AI</span>
            <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-semibold -mt-0.5">Behavioral Change Platform</span>
          </div>
        </div>

        {/* Hero headline */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Powered by Google Gemini AI</span>
            </div>
            <h2 className="text-5xl font-black text-white leading-tight tracking-tight">
              Break the cycle.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                Rewire your brain.
              </span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-md">
              MindShift AI uses Cognitive Behavioral Therapy principles and Generative AI to help you
              identify triggers, build resilience, and sustain lasting habit change.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 gap-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/60 transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-800/80 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  {f.icon}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{f.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-8 pt-6 border-t border-slate-800/60">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-xl font-black text-white">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          RIGHT PANEL — Auth Form
      ═══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">

        {/* Mobile brand (shown only on small screens) */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="font-black text-white text-lg text-glow-emerald">MindShift AI</span>
        </div>

        <div className="w-full max-w-[400px] space-y-6">

          {/* Card header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-slate-400">
              {isSignUp
                ? 'Start your recovery journey in under 2 minutes.'
                : 'Sign in to continue your habit recovery program.'}
            </p>
          </div>

          {/* ── Guest / Demo Login ── */}
          <button
            onClick={handleGuestLogin}
            disabled={guestLoading || loading}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/25 hover:border-emerald-500/50 hover:from-emerald-500/15 hover:to-teal-500/15 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              {guestLoading
                ? <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                : <Sparkles className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              }
              <div className="text-left">
                <span className="block text-sm font-bold text-white">Try as Guest</span>
                <span className="block text-[10px] text-slate-400">Instant access — no account needed</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-500 font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Name field (sign up only) */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    id="auth-name"
                    type="text"
                    placeholder="e.g. Alex Johnson"
                    autoComplete="name"
                    className="glass-input pl-10 w-full text-sm"
                    {...register('name')}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete={isSignUp ? 'email' : 'username'}
                  className="glass-input pl-10 w-full text-sm"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <span className="text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {errors.email.message}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setAuthError('Password reset: use the "Forgot password" flow in Firebase or re-register.')}
                    className="text-[11px] text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  className="glass-input pl-10 pr-10 w-full text-sm"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
              {errors.password && (
                <span className="text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {errors.password.message}
                </span>
              )}
              {isSignUp && (
                <p className="text-[10px] text-slate-500">Minimum 6 characters.</p>
              )}
            </div>

            {/* Error banner */}
            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="auth-submit"
              type="submit"
              disabled={loading}
              className="w-full glass-button-primary py-3 text-sm font-bold tracking-wide flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white" />
                  {isSignUp ? 'Create Account & Begin' : 'Sign In to Dashboard'}
                </>
              )}
            </button>
          </form>

          {/* Toggle sign in / sign up */}
          <p className="text-center text-xs text-slate-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={handleToggleMode}
              className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors underline underline-offset-2"
            >
              {isSignUp ? 'Sign In' : 'Create a free account'}
            </button>
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-1.5 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">Private & Secure</span>
            </div>
            <div className="w-px h-3 bg-slate-800" />
            <div className="flex items-center gap-1.5 text-slate-600">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">No Credit Card</span>
            </div>
            <div className="w-px h-3 bg-slate-800" />
            <div className="flex items-center gap-1.5 text-slate-600">
              <Heart className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">Free Forever</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
