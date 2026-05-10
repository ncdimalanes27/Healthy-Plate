import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Utensils, Lock, Mail, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('hp_rm_email');
    if (saved) setEmail(saved);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        if (rememberMe) {
          localStorage.setItem('hp_rm', '1');
          localStorage.setItem('hp_rm_email', email);
        } else {
          localStorage.removeItem('hp_rm');
          localStorage.removeItem('hp_rm_email');
        }
        sessionStorage.setItem('hp_tab_active', '1');

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profile) {
          navigate('/dashboard');
          return;
        }

        if (profile.role === 'dietitian') {
          navigate('/dietitian/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message === 'Invalid login credentials') {
        setError('Maling email o password. Pakisuri muli.');
      } else {
        setError(err.message || 'May error sa pag-login. Subukan ulit mamaya.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8fafc] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-10 border border-white">
          <div className="flex flex-col items-center mb-10">
            <div className="bg-primary p-4 rounded-2xl mb-6 shadow-xl shadow-primary/30 rotate-3 group-hover:rotate-0 transition-transform">
              <Utensils className="text-white w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 text-center">
              Welcome <span className="text-primary">Back</span>
            </h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
              HealthyPlate Portal
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold mb-8 border border-red-100 flex items-center gap-3"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    rememberMe
                      ? 'bg-primary border-primary'
                      : 'bg-white border-slate-300 group-hover:border-primary/50'
                  }`}
                >
                  {rememberMe && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">
                  Remember Me
                </span>
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">
                {rememberMe ? 'Stay signed in' : 'Sign out on close'}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-emerald-600 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/30 disabled:opacity-50 active:scale-[0.98] uppercase text-xs tracking-widest mt-2"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </div>
              ) : 'Access Account'}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-400 font-bold text-xs">
              Don't have an account yet?{' '}
              <Link to="/register" className="text-primary hover:text-emerald-600 transition-colors ml-1">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
