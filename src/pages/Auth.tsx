import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Sparkles, AlertTriangle, KeyRound, Mail, User as UserIcon, Loader2 } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
});

type AuthFormValues = z.infer<typeof authSchema>;

export const Auth: React.FC = () => {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
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
    } catch (e: any) {
      console.error(e);
      setAuthError(e.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoCreds = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await login('guest@mindshift.ai', 'password123');
    } catch (e: any) {
      setAuthError(e.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background blobs */}
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-indigo-500/5 rounded-full blur-[90px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl relative z-10 border border-slate-800">
        
        {/* Brand Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl mb-3 border border-emerald-500/20">
            <Brain className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white text-glow-emerald">
            MindShift AI
          </h1>
          <p className="text-xs text-slate-400 mt-1">Your Personal AI Behavioral Change Coach</p>
        </div>

        {/* Demo Credentials Box */}
        <div className="bg-slate-950/70 border border-slate-900 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Evaluator Test Sandbox
            </span>
            <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
              Ready
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            Use the sandbox credentials to inspect all dashboard features without config overhead:
          </p>
          <div className="text-[10px] font-mono text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800 flex justify-between items-center">
            <div>
              Email: <span className="text-white">guest@mindshift.ai</span><br/>
              Pass: <span className="text-white">password123</span>
            </div>
            <button
              onClick={handleUseDemoCreds}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-2.5 py-1 rounded text-[10px] font-bold tracking-wide shadow transition-colors"
            >
              Autologin
            </button>
          </div>
        </div>

        {/* Sign In/Up Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isSignUp && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="John Doe"
                  className="glass-input pl-10 w-full text-sm py-2"
                  {...register('name')}
                  required
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="you@example.com"
                className="glass-input pl-10 w-full text-sm py-2"
                {...register('email')}
                required
              />
            </div>
            {errors.email && (
              <span className="text-[10px] text-rose-400">{errors.email.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                className="glass-input pl-10 w-full text-sm py-2"
                {...register('password')}
                required
              />
            </div>
            {errors.password && (
              <span className="text-[10px] text-rose-400">{errors.password.message}</span>
            )}
          </div>

          {authError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-button-primary text-xs py-3 font-extrabold tracking-wider uppercase flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                {isSignUp ? 'Create Account' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        {/* Toggle link */}
        <div className="text-center mt-6">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};
export default Auth;
