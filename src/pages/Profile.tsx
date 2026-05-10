import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseService } from '../lib/supabaseService';
import type { Profile } from '../types';
import { Save, User as UserIcon, Ruler, Activity, Target, AlertCircle, ShieldAlert, CheckCircle } from 'lucide-react';

interface ProfilePageProps {
  profile: Profile;
  onProfileUpdate?: () => void;
}

export default function ProfilePage({ profile, onProfileUpdate }: ProfilePageProps) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    age: profile.age || '',
    gender: profile.gender || 'Male',
    height: profile.height || '',
    weight: profile.weight || '',
    activity_level: profile.activity_level || 'Sedentary',
    goal: profile.goal || 'Maintain',
    health_conditions: profile.health_conditions?.join(', ') || '',
    allergies: profile.allergies?.join(', ') || '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const updates = {
        ...formData,
        age: formData.age ? parseInt(formData.age.toString()) : undefined,
        height: formData.height ? parseInt(formData.height.toString()) : undefined,
        weight: formData.weight ? parseFloat(formData.weight.toString()) : undefined,
        health_conditions: formData.health_conditions
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s !== ''),
        allergies: formData.allergies
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s !== ''),
      };

      const { error } = await supabaseService.updateProfile(profile.id, updates);
      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
      if (onProfileUpdate) onProfileUpdate();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-20 px-4"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-10 border-b pb-6">
        <div className="bg-primary p-4 rounded-3xl text-white shadow-lg shadow-primary/20">
          <UserIcon size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Health Profile</h1>
          <p className="text-slate-400 font-medium">I-update ang iyong pisikal na impormasyon.</p>
        </div>
      </div>

      {/* Success / Error Toasts */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl font-bold shadow-sm"
          >
            <CheckCircle size={20} className="shrink-0" />
            Profile updated successfully! Your stats are now recalculated.
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl font-bold shadow-sm"
          >
            <AlertCircle size={20} className="shrink-0" />
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Physical Stats Card */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest">
              <Ruler size={16} />
              <span>Body Measurements</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Age</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:bg-white outline-none transition-all"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Gender</label>
                <select
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:bg-white outline-none transition-all appearance-none"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Height (cm)</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:bg-white outline-none transition-all"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:bg-white outline-none transition-all"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Lifestyle Card */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-blue-500 font-black uppercase text-xs tracking-widest">
              <Activity size={16} />
              <span>Lifestyle & Goals</span>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Activity Level</label>
                <select
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all appearance-none"
                  value={formData.activity_level}
                  onChange={(e) => setFormData({ ...formData, activity_level: e.target.value })}
                >
                  <option value="Sedentary">Sedentary (No exercise)</option>
                  <option value="Light">Lightly Active (1-3 days/week)</option>
                  <option value="Moderate">Moderately Active (3-5 days/week)</option>
                  <option value="Active">Very Active (6-7 days/week)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Your Main Goal</label>
                <select
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all appearance-none"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value as any })}
                >
                  <option value="Lose Weight">Lose Weight</option>
                  <option value="Maintain">Maintain Weight</option>
                  <option value="Gain Weight">Gain Weight</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Target</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                  <Target size={16} className="text-primary" />
                  <span className="font-bold text-slate-600 text-sm">
                    {formData.goal === 'Lose Weight' ? 'Calorie Deficit' : formData.goal === 'Gain Weight' ? 'Calorie Surplus' : 'Maintenance Calories'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Health Conditions & Allergies */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-orange-50/50 border border-orange-100 p-8 rounded-[2.5rem] space-y-4">
            <div className="flex items-center gap-2 text-orange-600 font-black uppercase text-xs tracking-widest">
              <AlertCircle size={16} />
              <span>Health Conditions</span>
            </div>
            <p className="text-xs text-orange-500/70 font-medium">Separate multiple entries with commas</p>
            <textarea
              className="w-full bg-white border border-orange-100 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all h-24"
              placeholder="Diabetes, Hypertension, High Cholesterol..."
              value={formData.health_conditions}
              onChange={(e) => setFormData({ ...formData, health_conditions: e.target.value })}
            />
          </div>
          <div className="bg-red-50/50 border border-red-100 p-8 rounded-[2.5rem] space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-black uppercase text-xs tracking-widest">
              <ShieldAlert size={16} />
              <span>Food Allergies</span>
            </div>
            <p className="text-xs text-red-500/70 font-medium">Separate multiple entries with commas</p>
            <textarea
              className="w-full bg-white border border-red-100 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:ring-4 focus:ring-red-500/10 outline-none transition-all h-24"
              placeholder="Peanuts, Shellfish, Dairy, Gluten..."
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
            />
          </div>
        </section>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-3 bg-primary hover:bg-primary-dark text-white font-black px-12 py-5 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
            ) : (
              <>
                <Save size={20} />
                <span>UPDATE HEALTH PROFILE</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
