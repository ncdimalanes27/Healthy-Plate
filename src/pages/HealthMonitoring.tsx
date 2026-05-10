import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { supabaseService } from '../lib/supabaseService';
import type { Profile, HealthMetric } from '../types';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Activity, Scale, TrendingUp, Calendar, Zap, Plus, CheckCircle, Droplets, Heart, ClipboardList } from 'lucide-react';

const METRIC_CONFIG = {
  weight: { label: 'Weight', unit: 'kg', icon: Scale, color: 'text-blue-500', bg: 'bg-blue-50', placeholder: '65.5' },
  blood_sugar: { label: 'Blood Sugar', unit: 'mg/dL', icon: Droplets, color: 'text-purple-500', bg: 'bg-purple-50', placeholder: '95' },
  blood_pressure: { label: 'Blood Pressure', unit: 'mmHg', icon: Heart, color: 'text-red-500', bg: 'bg-red-50', placeholder: '120' },
};

export default function HealthMonitoring({ profile }: { profile: Profile | null }) {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);

  // Vital sign form state
  const [metricType, setMetricType] = useState<'weight' | 'blood_sugar' | 'blood_pressure'>('weight');
  const [valuePrimary, setValuePrimary] = useState('');
  const [valueSecondary, setValueSecondary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savedMetric, setSavedMetric] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!profile?.id) { setLoading(false); return; }
    try {
      setLoading(true);
      const { data } = await supabase
        .from('daily_logs')
        .select('date, total_calories')
        .eq('user_id', profile.id)
        .order('date', { ascending: true });

      if (data) {
        // Group by date and sum calories
        const grouped: Record<string, number> = {};
        data.forEach((row: any) => {
          grouped[row.date] = (grouped[row.date] || 0) + (row.total_calories || 0);
        });
        const chartData = Object.entries(grouped)
          .slice(-7)
          .map(([date, total_calories]) => ({ date, total_calories }));
        setLogs(chartData);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  const fetchMetrics = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabaseService.getHealthMetrics(profile.id, 10);
    if (data) setMetrics(data);
  }, [profile?.id]);

  useEffect(() => {
    fetchLogs();
    fetchMetrics();
  }, [fetchLogs, fetchMetrics]);

  const handleLogMetric = async () => {
    if (!profile?.id || !valuePrimary) return;
    setSubmitting(true);
    try {
      const config = METRIC_CONFIG[metricType];
      const payload: Partial<HealthMetric> = {
        user_id: profile.id,
        type: metricType,
        value_primary: parseFloat(valuePrimary),
        unit: config.unit,
        recorded_at: new Date().toISOString(),
      };
      if (metricType === 'blood_pressure' && valueSecondary) {
        payload.value_secondary = parseFloat(valueSecondary);
      }
      const { error } = await supabaseService.addHealthMetric(payload);
      if (error) throw error;
      setValuePrimary('');
      setValueSecondary('');
      setSavedMetric(true);
      setTimeout(() => setSavedMetric(false), 3000);
      fetchMetrics();
    } catch (err) {
      console.error('Error logging metric:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="relative">
          <div className="animate-spin h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full"></div>
          <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/40" size={16} />
        </div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Analyzing health trends...</p>
      </div>
    );
  }

  if (!profile) return null;

  const avgCalories = logs.length > 0
    ? Math.round(logs.reduce((acc, curr) => acc + (curr.total_calories || 0), 0) / logs.length)
    : 0;

  const latestWeight = metrics.find((m) => m.type === 'weight')?.value_primary;
  const latestBP = metrics.find((m) => m.type === 'blood_pressure');
  const latestBS = metrics.find((m) => m.type === 'blood_sugar')?.value_primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8 max-w-6xl mx-auto pb-10"
    >
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.3em]">
          <Zap size={14} className="fill-primary" />
          <span>Health Insights</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          Your <span className="gradient-text">Progress</span> Dashboard
        </h1>
        <p className="text-slate-500 font-medium">Visual breakdown ng iyong nutrition at vital sign trends.</p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Avg. Calories', value: avgCalories, unit: 'kcal', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-50' },
          { title: 'Weight', value: latestWeight ?? (profile.weight ?? '--'), unit: 'kg', icon: Scale, color: 'text-blue-500', bg: 'bg-blue-50' },
          { title: 'Blood Sugar', value: latestBS ?? '--', unit: 'mg/dL', icon: Droplets, color: 'text-purple-500', bg: 'bg-purple-50' },
          { title: 'Logs This Week', value: logs.length, unit: 'days', icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-6 border-none shadow-xl shadow-slate-200/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${stat.bg} ${stat.color} rounded-2xl`}>
                <stat.icon size={20} />
              </div>
              <h3 className="font-black text-slate-300 uppercase text-[10px] tracking-widest text-right">{stat.title}</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{stat.unit}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Calorie Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-8 border-none shadow-2xl shadow-slate-200/60"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg tracking-tight">Calorie Intake Trend</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Last 7 recorded days</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Syncing</span>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center text-slate-300 space-y-3">
            <TrendingUp size={48} />
            <p className="font-bold text-sm uppercase tracking-widest">No log data yet</p>
            <p className="text-xs font-medium text-slate-400">Start logging food to see your trends here.</p>
          </div>
        ) : (
          <div className="h-80 w-full overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={logs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false} tickLine={false}
                  tickFormatter={(str) => new Date(str + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                  tick={{ fontSize: 10, fill: '#cbd5e1', fontWeight: 800 }} dy={15}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1', fontWeight: 800 }} />
                <Tooltip
                  cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5' }}
                  contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '1.25rem', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="total_calories" stroke="#10b981" strokeWidth={5} fill="url(#colorCal)"
                  animationDuration={2500} dot={{ r: 6, fill: '#10b981', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Log Vital Signs Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="glass-card p-8 border-none shadow-xl shadow-slate-200/50 space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <Plus size={22} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 tracking-tight">Log Vital Signs</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Record your health metrics</p>
          </div>
        </div>

        {/* Metric Type Selector */}
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(METRIC_CONFIG) as [typeof metricType, typeof METRIC_CONFIG[typeof metricType]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setMetricType(key)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                metricType === key ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 text-slate-400 hover:border-slate-200'
              }`}
            >
              <cfg.icon size={22} />
              <span className="text-xs font-black uppercase tracking-tight text-center leading-tight">{cfg.label}</span>
            </button>
          ))}
        </div>

        {/* Value Inputs */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {METRIC_CONFIG[metricType].label} ({METRIC_CONFIG[metricType].unit})
              {metricType === 'blood_pressure' && ' — Systolic'}
            </label>
            <input
              type="number"
              step="0.1"
              value={valuePrimary}
              onChange={(e) => setValuePrimary(e.target.value)}
              placeholder={METRIC_CONFIG[metricType].placeholder}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-2xl text-slate-800 focus:ring-4 focus:ring-primary/10 focus:bg-white outline-none transition-all"
            />
          </div>
          {metricType === 'blood_pressure' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diastolic (mmHg)</label>
              <input
                type="number"
                value={valueSecondary}
                onChange={(e) => setValueSecondary(e.target.value)}
                placeholder="80"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-2xl text-slate-800 focus:ring-4 focus:ring-primary/10 focus:bg-white outline-none transition-all"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogMetric}
            disabled={submitting || !valuePrimary}
            className="flex items-center gap-2 bg-primary hover:bg-emerald-600 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all disabled:opacity-50"
          >
            {submitting ? <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Plus size={18} />}
            Save Vital Sign
          </motion.button>
          <AnimatePresence>
            {savedMetric && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-emerald-600 font-bold text-sm"
              >
                <CheckCircle size={18} /> Recorded successfully!
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Recent Vital Signs History */}
      {metrics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="glass-card p-8 border-none shadow-xl shadow-slate-200/50 space-y-5"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl">
              <ClipboardList size={22} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 tracking-tight">Recent Readings</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Last 10 entries</p>
            </div>
          </div>
          <div className="space-y-3">
            {metrics.map((m, i) => {
              const cfg = METRIC_CONFIG[m.type];
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between bg-slate-50 rounded-2xl px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${cfg.bg} ${cfg.color} rounded-xl`}>
                      <cfg.icon size={16} />
                    </div>
                    <div>
                      <p className="font-black text-slate-700 text-sm">{cfg.label}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        {new Date(m.recorded_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-lg ${cfg.color}`}>
                      {m.value_primary}
                      {m.value_secondary ? `/${m.value_secondary}` : ''}
                      <span className="text-xs text-slate-400 font-bold ml-1">{m.unit}</span>
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Footer Banner */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <h3 className="text-2xl font-black tracking-tight">Keep it up, {profile.name?.split(' ')[0]}! 🥗</h3>
            <p className="text-slate-400 text-sm font-medium max-w-md leading-relaxed">
              Ang pag-monitor ng iyong kalusugan ay ang unang hakbang sa mas malusog na pamumuhay. Balikan ang iyong meal plan para sa gabay.
            </p>
          </div>
          <button
            onClick={() => navigate('/meal-plans')}
            className="bg-primary hover:bg-emerald-400 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-2xl shadow-primary/40 whitespace-nowrap"
          >
            View Meal Plan
          </button>
        </div>
      </div>
    </motion.div>
  );
}
