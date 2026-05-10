import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { calculateTargetCalories } from '../utils/calculations';
import { generate7DayMealPlan } from '../utils/mealPlanGenerator';
import type { Profile, Food } from '../types';
import { Sparkles, ChevronDown, ChevronUp, Save, Trash2, Printer, CheckCircle, AlertTriangle } from 'lucide-react';

interface MealPlanRow {
  id: string;
  name: string;
  target_calories: number;
  days: any[];
  created_at: string;
}

export default function MealPlans({ profile }: { profile: Profile }) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [currentPlan, setCurrentPlan] = useState<any[] | null>(null);
  const [savedPlans, setSavedPlans] = useState<MealPlanRow[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>('Monday');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const target = calculateTargetCalories(profile);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      const { data: foodData } = await supabase.from('foods').select('*');
      if (foodData) setFoods(foodData as Food[]);
      const { data: plans } = await supabase.from('meal_plans').select('*').eq('user_id', profile.id).order('created_at', { ascending: false });
      if (plans) setSavedPlans(plans as MealPlanRow[]);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newPlan = generate7DayMealPlan(target, foods);
      setCurrentPlan(newPlan);
      setIsGenerating(false);
      setExpandedDay('Monday');
    }, 1000);
  };

  const savePlan = async () => {
    if (!currentPlan) return;
    try {
      const { error } = await supabase.from('meal_plans').insert({
        user_id: profile.id,
        name: `7-Day Plan (${new Date().toLocaleDateString('en-PH')})`,
        target_calories: target,
        days: currentPlan,
      });
      if (error) throw error;
      showToast('Meal plan saved successfully!', 'success');
      fetchData();
    } catch (err: any) {
      showToast('Failed to save meal plan.', 'error');
      console.error(err);
    }
  };

  const deletePlan = async (id: string) => {
    const { error } = await supabase.from('meal_plans').delete().eq('id', id);
    if (!error) {
      setSavedPlans((prev) => prev.filter((p) => p.id !== id));
      showToast('Plan deleted.', 'success');
    }
    setConfirmDeleteId(null);
  };

  const printPlan = (plan: MealPlanRow) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${plan.name} — HealthyPlate</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', sans-serif; padding: 32px; color: #1e293b; }
          .header { border-bottom: 3px solid #10b981; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { font-size: 28px; font-weight: 900; color: #0f172a; }
          .header p { color: #64748b; font-size: 14px; margin-top: 4px; }
          .day { margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
          .day-header { background: #f8fafc; padding: 10px 16px; font-weight: 800; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; }
          .meals { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 14px; }
          .meal { background: #f8fafc; border-radius: 8px; padding: 10px 12px; }
          .meal-type { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 4px; }
          .meal-name { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
          .meal-cal { font-size: 12px; color: #10b981; font-weight: 700; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${plan.name}</h1>
          <p>Calorie Target: ${plan.target_calories} kcal/day &nbsp;•&nbsp; Generated: ${new Date(plan.created_at).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        ${(plan.days || []).map((dayData: any) => `
          <div class="day">
            <div class="day-header">${dayData.day}</div>
            <div class="meals">
              ${Object.entries(dayData.meals || {}).map(([type, food]: [string, any]) => `
                <div class="meal">
                  <div class="meal-type">${type}</div>
                  <div class="meal-name">${food?.name || 'N/A'}</div>
                  <div class="meal-cal">${food?.calories || 0} kcal</div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
        <div class="footer">HealthyPlate — Filipino-Focused Nutrition Capstone Project</div>
      </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.3em] mb-2">
            <Sparkles size={12} />
            <span>Nutrition Planning</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Personalized Meal Plans</h1>
          <p className="text-slate-500 font-medium">Filipino-focused nutrition based on your {target} kcal target</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || foods.length === 0}
          className="flex items-center justify-center gap-2 bg-primary text-white px-7 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:bg-emerald-600 transition-all disabled:opacity-50 active:scale-95"
        >
          <Sparkles size={18} />
          {isGenerating ? 'Generating...' : 'Generate New Plan'}
        </button>
      </header>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm shadow-sm ${
              toast.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Plan Preview */}
      {currentPlan && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-primary/5">
            <div>
              <h2 className="font-black text-slate-800">Generated Plan Preview</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Target: {target} kcal/day</p>
            </div>
            <button
              onClick={savePlan}
              className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-black text-sm hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              <Save size={16} />
              Save Plan
            </button>
          </div>

          <div className="divide-y divide-slate-50">
            {currentPlan.map((dayData: any) => (
              <div key={dayData.day}>
                <button
                  onClick={() => setExpandedDay(expandedDay === dayData.day ? null : dayData.day)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-all"
                >
                  <span className="font-black text-slate-700">{dayData.day}</span>
                  {expandedDay === dayData.day ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>
                <AnimatePresence>
                  {expandedDay === dayData.day && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50">
                        {Object.entries(dayData.meals || {}).map(([type, food]: [string, any]) => (
                          <div key={type} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] uppercase font-black text-slate-400 mb-2">{type}</p>
                            <p className="text-sm font-black text-slate-800 leading-snug mb-1">{food?.name || 'N/A'}</p>
                            <p className="text-xs text-primary font-bold">{food?.calories || 0} kcal</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Saved Plans */}
      <section className="space-y-4">
        <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Your Saved Plans</h3>
        {savedPlans.length === 0 ? (
          <div className="bg-white p-10 rounded-[2rem] border border-dashed border-slate-200 text-center">
            <Sparkles size={32} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 font-bold text-sm">No saved plans yet.</p>
            <p className="text-slate-300 text-xs font-medium mt-1">Generate and save a plan to see it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedPlans.map((plan) => (
              <motion.div
                key={plan.id}
                layout
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-slate-800">{plan.name}</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                      {new Date(plan.created_at).toLocaleDateString('en-PH')} • {plan.target_calories} kcal target
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => printPlan(plan)}
                      className="p-3 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                      title="Print Plan"
                    >
                      <Printer size={18} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(plan.id)}
                      className="p-3 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Delete Plan"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Inline Delete Confirm */}
                <AnimatePresence>
                  {confirmDeleteId === plan.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden bg-red-50 border-t border-red-100"
                    >
                      <div className="px-5 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertTriangle size={16} />
                          <p className="font-bold text-sm">Delete this plan? This cannot be undone.</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => deletePlan(plan.id)}
                            className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
