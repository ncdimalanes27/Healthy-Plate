import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { Send, Utensils, Target, Calendar, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

export default function AssignMealPlan({ profile }: { profile?: Profile | null }) {
  const [patients, setPatients] = useState<Profile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [targetCalories, setTargetCalories] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'patient').then(({ data }) => {
      if (data) setPatients(data);
    });
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      showToast('Please select a patient first.', 'error');
      return;
    }
    if (!targetCalories || parseInt(targetCalories) < 800) {
      showToast('Please enter a valid calorie target (min 800 kcal).', 'error');
      return;
    }
    setLoading(true);
    try {
      const patient = patients.find(p => p.id === selectedPatient);
      const { error } = await supabase.from('assigned_plans').insert([{
        patient_id: selectedPatient,
        dietitian_id: profile?.id ?? null,
        dietitian_name: profile?.name ?? 'Dietitian',
        meal_plan_name: `Custom Plan for ${patient?.name ?? 'Patient'}`,
        target_calories: parseInt(targetCalories),
        note: notes || null,
      }]);
      if (error) throw error;
      showToast(`Meal plan assigned to ${patient?.name || 'patient'} successfully!`, 'success');
      setTargetCalories('');
      setNotes('');
      setSelectedPatient('');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to assign meal plan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto space-y-8 p-4 md:p-8"
    >
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
          <Sparkles size={16} />
          <span>Dietitian Tools</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          Assign <span className="gradient-text">Health Plan</span>
        </h1>
        <p className="text-slate-500 text-lg">I-personalize ang goals ng iyong mga pasyente.</p>
      </header>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm shadow-sm ${
              toast.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          <form onSubmit={handleAssign} className="relative space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Patient</label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white focus:ring-0 transition-all font-medium text-slate-600 outline-none appearance-none"
              >
                <option value="">Pumili ng pasyente...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Calorie Target (kcal)</label>
                <div className="relative">
                  <Target size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                  <input
                    type="number"
                    placeholder="e.g. 1800"
                    value={targetCalories}
                    min="800"
                    max="5000"
                    onChange={(e) => setTargetCalories(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Plan Period</label>
                <div className="relative">
                  <Calendar size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value="Weekly Plan"
                    disabled
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-100 font-medium text-slate-400 cursor-not-allowed border-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Instructions & Notes</label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Iwasan ang maaalat, uminom ng maraming tubig, kumain ng mas maraming gulay..."
                className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all font-medium resize-none"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <><Send size={20} /> I-send ang Plan sa Pasyente</>
              )}
            </motion.button>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-primary p-8 rounded-[2.5rem] text-white shadow-lg shadow-primary/20 relative overflow-hidden group"
          >
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Utensils size={120} />
            </div>
            <h3 className="font-bold text-xl mb-2 relative z-10">Pro Tip</h3>
            <p className="text-primary-light text-sm leading-relaxed relative z-10">
              Ang pagbibigay ng specific na calorie target ay nakakatulong sa pasyente na maging mas disiplinado sa pagkain at maabot ang kanilang health goals.
            </p>
          </motion.div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
            <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center">
              <Target size={24} />
            </div>
            <h3 className="font-black text-slate-900">Activity Multipliers</h3>
            <div className="space-y-3">
              {[
                { label: 'Sedentary', multi: '×1.2', desc: 'Little/no exercise' },
                { label: 'Light Active', multi: '×1.375', desc: '1–3 days/week' },
                { label: 'Moderate', multi: '×1.55', desc: '3–5 days/week' },
                { label: 'Very Active', multi: '×1.9', desc: '6–7 days/week' },
              ].map((a) => (
                <div key={a.label} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-bold text-slate-700">{a.label}</span>
                    <span className="text-slate-400 text-xs ml-2">{a.desc}</span>
                  </div>
                  <span className="font-black text-primary">{a.multi}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
