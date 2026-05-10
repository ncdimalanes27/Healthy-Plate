import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Profile } from '../types';
import { LogOut, Shield, Bell, Database, ArrowRight, Mail, Sparkles, Info, CheckCircle, X, Heart } from 'lucide-react';

interface SettingsProps {
  profile: Profile | null;
  onLogout: () => void;
}

export default function Settings({ profile, onLogout }: SettingsProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleClearCache = () => {
    if (profile) {
      localStorage.removeItem(`hp_u_${profile.id}`);
      showToast('Local cache cleared. Profile will re-sync on next page load.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8 pb-10"
    >
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-500 font-medium">Manage your account and app preferences</p>
        </div>
        <div className="bg-primary/10 p-3 rounded-2xl text-primary">
          <Sparkles size={24} />
        </div>
      </header>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl font-bold text-sm shadow-sm"
          >
            <CheckCircle size={18} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 bg-gradient-to-br from-primary/5 to-transparent border-b border-slate-50">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 bg-primary text-white rounded-[1.8rem] flex items-center justify-center text-3xl font-black shadow-lg shadow-primary/20">
                {profile?.name?.[0] || 'U'}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-sm border border-slate-50">
                <div className="bg-emerald-500 w-3 h-3 rounded-full border-2 border-white"></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 leading-tight">{profile?.name}</h2>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-tighter">
                  {profile?.role}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Mail size={14} />
                <p className="text-sm font-medium">{profile?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Items */}
        <div className="p-4 space-y-1">
          <div className="px-4 py-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">General Preferences</h3>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between hover:bg-slate-50 p-4 rounded-[1.5rem] transition-all group">
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform">
                <Bell size={22} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Push Notifications</p>
                <p className="text-xs text-slate-400 font-medium">Daily log reminders and health alerts</p>
              </div>
            </div>
            <button
              onClick={() => { setNotifEnabled(!notifEnabled); showToast(notifEnabled ? 'Push notifications disabled.' : 'Push notifications enabled.'); }}
              className={`relative w-14 h-7 rounded-full transition-all ${notifEnabled ? 'bg-primary' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${notifEnabled ? 'left-8' : 'left-1'}`} />
            </button>
          </div>

          {/* Email Digest */}
          <div className="flex items-center justify-between hover:bg-slate-50 p-4 rounded-[1.5rem] transition-all group">
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl group-hover:scale-110 transition-transform">
                <Mail size={22} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Weekly Email Digest</p>
                <p className="text-xs text-slate-400 font-medium">Summary of your nutrition progress</p>
              </div>
            </div>
            <button
              onClick={() => { setEmailDigest(!emailDigest); showToast(emailDigest ? 'Email digest disabled.' : 'Weekly email digest enabled.'); }}
              className={`relative w-14 h-7 rounded-full transition-all ${emailDigest ? 'bg-primary' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${emailDigest ? 'left-8' : 'left-1'}`} />
            </button>
          </div>

          {/* Privacy */}
          <button
            onClick={() => showToast('Password change will be sent to your registered email.')}
            className="w-full flex items-center justify-between hover:bg-slate-50 p-4 rounded-[1.5rem] transition-all group"
          >
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl group-hover:scale-110 transition-transform">
                <Shield size={22} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900">Privacy & Security</p>
                <p className="text-xs text-slate-400 font-medium">Change password and manage data sharing</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </button>

          {/* Clear Cache */}
          <button
            onClick={handleClearCache}
            className="w-full flex items-center justify-between hover:bg-slate-50 p-4 rounded-[1.5rem] transition-all group"
          >
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl group-hover:scale-110 transition-transform">
                <Database size={22} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900">Clear Local Cache</p>
                <p className="text-xs text-slate-400 font-medium">Refresh locally stored profile data</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </button>

          {/* About */}
          <button
            onClick={() => setShowAbout(true)}
            className="w-full flex items-center justify-between hover:bg-slate-50 p-4 rounded-[1.5rem] transition-all group"
          >
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Info size={22} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900">About HealthyPlate</p>
                <p className="text-xs text-slate-400 font-medium">Version info, credits, and capstone details</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        {/* Sign Out */}
        <div className="p-4 bg-slate-50/50">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-white text-red-500 border border-red-100 font-black py-4 rounded-[1.5rem] hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 shadow-sm"
          >
            <LogOut size={20} />
            Sign Out Account
          </button>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">HealthyPlate v1.0.0 • Capstone Project 2026</p>
      </div>

      {/* About Modal */}
      <AnimatePresence>
        {showAbout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAbout(false); }}
          >
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="bg-primary p-8 text-white relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <button onClick={() => setShowAbout(false)} className="absolute top-6 right-6 p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all">
                  <X size={18} />
                </button>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                    <span className="text-3xl font-black">HP</span>
                  </div>
                  <h2 className="text-2xl font-black">HealthyPlate</h2>
                  <p className="text-white/70 text-sm font-medium mt-1">Version 1.0.0 • Capstone Project 2026</p>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <p className="text-slate-600 text-sm font-medium leading-relaxed">
                    HealthyPlate is a Filipino-focused nutrition and health monitoring application designed to help patients track their dietary intake and maintain healthy eating habits under the guidance of a registered dietitian.
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Key Features</h3>
                  <div className="space-y-2">
                    {[
                      'Filipino food database with 100+ items',
                      'AI-powered 7-day meal plan generator',
                      'Real-time calorie & macro tracking',
                      'Vital signs monitoring (weight, BP, blood sugar)',
                      'Dietitian–patient communication system',
                      'Progress analytics and reporting',
                    ].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle size={14} className="text-primary shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest justify-center">
                  <span>Made with</span>
                  <Heart size={12} className="text-red-400 fill-red-400" />
                  <span>React + Vite + Supabase + Tailwind CSS</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
