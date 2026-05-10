import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, Scale, Droplets, Zap, Heart, MessageSquare, ChevronRight, BookOpen } from 'lucide-react';
import { calculateBMI, calculateTargetCalories, getBMICategory } from '../utils/calculations';
import type { Profile, DieticianNote } from '../types';
import { supabase } from '../lib/supabase';
import { supabaseService } from '../lib/supabaseService';
import { useNavigate } from 'react-router-dom';

interface StatCardProps {
  label: string;
  value: string;
  subValue: string;
  icon: React.ElementType;
  color: string;
}

const CATEGORY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  Recommendation: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Recommendation' },
  Warning: { bg: 'bg-red-50', text: 'text-red-600', label: 'Warning' },
  Progress: { bg: 'bg-green-50', text: 'text-green-600', label: 'Progress' },
  General: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'General' },
};

export default function Dashboard({ profile }: { profile: Profile }) {
  const navigate = useNavigate();
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [totalFat, setTotalFat] = useState(0);
  const [notes, setNotes] = useState<DieticianNote[]>([]);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const target = calculateTargetCalories(profile);
  const proteinTarget = profile.weight ? Math.round(profile.weight * 1.6) : 150;
  const bmiValue = profile.weight && profile.height ? calculateBMI(profile.weight, profile.height) : 0;
  const bmiCategory = getBMICategory(bmiValue);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const [logsRes, notesRes, myPlanRes, assignedPlanRes] = await Promise.all([
        supabase.from('daily_logs').select('*').eq('user_id', profile.id).eq('date', today),
        supabaseService.getPatientNotes(profile.id),
        supabaseService.getMealPlan(profile.id),
        supabaseService.getAssignedPlan(profile.id),
      ]);

      if (logsRes.data) {
        const logs = logsRes.data;
        setTotalCalories(logs.reduce((s: number, r: any) => s + (r.total_calories || 0), 0));
        setTotalProtein(Math.round(logs.reduce((s: number, r: any) => s + (r.total_protein || 0), 0) * 10) / 10);
        setTotalCarbs(Math.round(logs.reduce((s: number, r: any) => s + (r.total_carbs || 0), 0) * 10) / 10);
        setTotalFat(Math.round(logs.reduce((s: number, r: any) => s + (r.total_fat || 0), 0) * 10) / 10);
      }
      if (notesRes.data) setNotes(notesRes.data);
      if (assignedPlanRes.data) setActivePlan(assignedPlanRes.data);
      else if (myPlanRes.data) setActivePlan(myPlanRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const percentage = Math.min(Math.round((totalCalories / target) * 100), 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 pb-20">
      <header>
        <p className="text-primary font-bold uppercase text-xs tracking-widest">Health Overview</p>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
          Kumusta, <span className="text-primary">{profile.name.split(' ')[0]}</span>! 👋
        </h1>
        <p className="text-gray-400 font-medium mt-1">
          {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calorie Ring */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest self-start mb-6">Today's Intake</h3>
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-50" />
              <circle
                cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent"
                strokeDasharray={452.4}
                strokeDashoffset={452.4 - (452.4 * percentage) / 100}
                strokeLinecap="round"
                className={`transition-all duration-1000 ease-out ${percentage > 100 ? 'text-orange-400' : 'text-primary'}`}
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-4xl font-black block text-gray-900">{totalCalories}</span>
              <span className="text-gray-400 text-[10px] font-bold uppercase">/ {target} kcal</span>
            </div>
          </div>
          <div className="mt-6 w-full space-y-3">
            {[
              { label: 'Protein', val: totalProtein, target: proteinTarget, color: 'bg-blue-500', unit: 'g' },
              { label: 'Carbs', val: totalCarbs, target: Math.round(target * 0.5 / 4), color: 'bg-amber-400', unit: 'g' },
              { label: 'Fat', val: totalFat, target: Math.round(target * 0.25 / 9), color: 'bg-rose-400', unit: 'g' },
            ].map((m) => (
              <div key={m.label} className="space-y-1">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                  <span className="text-gray-400">{m.label}</span>
                  <span className="text-gray-700">{m.val}{m.unit} / {m.target}{m.unit}</span>
                </div>
                <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                  <div
                    className={`h-full ${m.color} transition-all duration-700`}
                    style={{ width: `${Math.min((m.val / m.target) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard label="BMI Status" value={bmiValue > 0 ? bmiValue.toFixed(1) : '--'} subValue={bmiCategory} icon={Scale} color="bg-emerald-50 text-emerald-500" />
          <StatCard label="Daily Target" value={`${target}`} subValue="Kcal Goal" icon={Zap} color="bg-orange-50 text-orange-500" />
          <StatCard label="Calories Remaining" value={`${Math.max(0, target - totalCalories)}`} subValue="kcal left today" icon={Droplets} color="bg-purple-50 text-purple-500" />
          <StatCard label="Progress" value={`${percentage}%`} subValue="of daily goal" icon={Heart} color="bg-red-50 text-red-500" />
        </div>
      </div>

      {/* Active Meal Plan Card */}
      {activePlan && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-primary/20"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">
                <BookOpen size={12} />
                <span>Active Meal Plan</span>
              </div>
              <h3 className="text-xl font-black tracking-tight">{activePlan.name || activePlan.title || 'Weekly Meal Plan'}</h3>
              <p className="text-white/70 text-sm font-medium">
                Target: {activePlan.target_calories || activePlan.calories_target || '--'} kcal/day
                {activePlan.notes && ` • ${activePlan.notes}`}
              </p>
            </div>
            <button
              onClick={() => navigate('/meal-plans')}
              className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-2xl transition-all active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Health Conditions */}
      {profile.health_conditions && profile.health_conditions.length > 0 && (
        <div className="bg-orange-50/50 border border-orange-100 p-6 rounded-[2rem] flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="bg-orange-500 p-3 rounded-2xl text-white shadow-lg shadow-orange-100 w-fit">
            <Activity size={24} />
          </div>
          <div>
            <h4 className="text-orange-900 font-black text-xs uppercase tracking-widest mb-2">Medical Alerts & Conditions</h4>
            <div className="flex flex-wrap gap-2">
              {profile.health_conditions.map((c: string) => (
                <span key={c} className="bg-white/80 border border-orange-200 px-3 py-1 rounded-xl text-[10px] text-orange-700 font-black uppercase tracking-tight">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages from Dietitian */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-black uppercase text-xs tracking-widest">
            <MessageSquare size={16} className="text-primary" />
            <span>Messages from Your Dietitian</span>
          </div>
          {notes.length > 0 && (
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {notes.length} message{notes.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {notes.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-[2rem] p-10 text-center space-y-2">
            <MessageSquare size={32} className="mx-auto text-slate-200" />
            <p className="text-slate-400 font-bold text-sm">No messages yet from your dietitian.</p>
            <p className="text-slate-300 text-xs font-medium">Clinical notes and recommendations will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note, i) => {
              const style = CATEGORY_STYLE[note.category || 'General'] || CATEGORY_STYLE.General;
              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white border border-slate-100 rounded-[1.5rem] p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      {note.category && (
                        <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      )}
                      <p className="text-slate-700 font-medium text-sm leading-relaxed">{note.content}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                    {new Date(note.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow group">
      <div>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black mt-1 text-gray-900 tracking-tight group-hover:text-primary transition-colors">{value}</p>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-tighter mt-0.5">{subValue}</p>
      </div>
      <div className={`p-4 rounded-2xl shadow-inner transition-transform group-hover:scale-110 ${color}`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
    </div>
  );
}
