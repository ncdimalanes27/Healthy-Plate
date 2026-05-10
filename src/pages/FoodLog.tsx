import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { supabaseService } from '../lib/supabaseService';
import type { Food, Profile } from '../types';
import { Search, Plus, Utensils, Sparkles, X, CheckCircle, Minus, Trash2, ClipboardList } from 'lucide-react';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_EMOJI: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

interface LogModalProps {
  food: Food;
  onClose: () => void;
  onConfirm: (food: Food, servings: number, mealType: MealType) => Promise<void>;
  logging: boolean;
}

function LogModal({ food, onClose, onConfirm, logging }: LogModalProps) {
  const [servings, setServings] = useState(1);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const calc = (val: number) => Math.round(val * servings * 10) / 10;

  const mealTypes: { id: MealType; label: string; emoji: string }[] = [
    { id: 'breakfast', label: 'Breakfast', emoji: '🌅' },
    { id: 'lunch', label: 'Lunch', emoji: '☀️' },
    { id: 'dinner', label: 'Dinner', emoji: '🌙' },
    { id: 'snack', label: 'Snack', emoji: '🍎' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, scale: 0.95 }}
        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        className="relative bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl shadow-slate-900/20 overflow-hidden"
      >
        <div className="p-7 border-b border-slate-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-black text-slate-900 leading-tight">{food.name}</h2>
                {food.is_filipino && (
                  <span className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter shrink-0">
                    <Sparkles size={10} /> Pinoy
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{food.serving_size} • {food.category}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-7 space-y-7">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Meal Type</p>
            <div className="grid grid-cols-4 gap-2">
              {mealTypes.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMealType(m.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl text-center transition-all ${
                    mealType === m.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-lg leading-none">{m.emoji}</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Servings</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setServings(Math.max(0.5, servings - 0.5))}
                className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-all font-bold active:scale-95"
              >
                <Minus size={18} strokeWidth={3} />
              </button>
              <div className="flex-1 text-center">
                <span className="text-4xl font-black text-slate-900 tracking-tighter">{servings}</span>
                <span className="text-sm text-slate-400 font-bold ml-2">{servings === 1 ? 'serving' : 'servings'}</span>
              </div>
              <button
                type="button"
                onClick={() => setServings(Math.min(10, servings + 0.5))}
                className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-all active:scale-95"
              >
                <Plus size={18} strokeWidth={3} />
              </button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-[1.5rem] p-5 space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nutrition for {servings} {servings === 1 ? 'serving' : 'servings'}</p>
            <div className="flex items-center justify-between">
              {[
                { label: 'Calories', val: calc(food.calories), color: 'text-orange-500', unit: '' },
                { label: 'Protein', val: calc(food.protein), color: 'text-blue-500', unit: 'g' },
                { label: 'Carbs', val: calc(food.carbs), color: 'text-amber-500', unit: 'g' },
                { label: 'Fat', val: calc(food.fat), color: 'text-rose-400', unit: 'g' },
              ].map((n, i) => (
                <div key={n.label} className="text-center flex-1">
                  {i > 0 && <div className="w-px h-10 bg-slate-200 float-left" />}
                  <p className={`text-2xl font-black ${n.color}`}>{n.val}<span className="text-xs text-slate-400 font-bold">{n.unit}</span></p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{n.label}</p>
                </div>
              ))}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onConfirm(food, servings, mealType)}
            disabled={logging}
            className="w-full bg-primary hover:bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/25 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase text-sm tracking-widest"
          >
            {logging ? (
              <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle size={20} />
                Log to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function FoodLog({ profile }: { profile: Profile }) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [toastFood, setToastFood] = useState<string | null>(null);
  const [todayEntries, setTodayEntries] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const fetchFoods = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('foods').select('*').order('name');
      if (data) setFoods(data as Food[]);
    } catch (error) {
      console.error('Error fetching foods:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTodayEntries = useCallback(async () => {
    const { data } = await supabaseService.getTodayLog(profile.id, today);
    if (data) setTodayEntries(data);
  }, [profile.id, today]);

  useEffect(() => {
    fetchFoods();
    fetchTodayEntries();
  }, [fetchFoods, fetchTodayEntries]);

  const addFoodToLog = async (food: Food, servings: number, mealType: MealType) => {
    setLogging(true);
    try {
      const { error } = await supabase.from('daily_logs').insert([{
        user_id: profile.id,
        food_id: food.id,
        meal_type: mealType,
        servings,
        total_calories: Math.round(food.calories * servings),
        total_protein: Math.round(food.protein * servings * 10) / 10,
        total_carbs: Math.round(food.carbs * servings * 10) / 10,
        total_fat: Math.round(food.fat * servings * 10) / 10,
        date: today,
      }]);
      if (error) throw error;
      setSelectedFood(null);
      setToastFood(food.name);
      setTimeout(() => setToastFood(null), 3000);
      fetchTodayEntries();
    } catch (err) {
      console.error(err);
    } finally {
      setLogging(false);
    }
  };

  const deleteEntry = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabaseService.deleteLogEntry(id);
    if (!error) {
      setTodayEntries((prev) => prev.filter((e) => e.id !== id));
    }
    setDeletingId(null);
  };

  const filteredFoods = foods.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || f.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalToday = {
    cal: todayEntries.reduce((s, e) => s + (e.total_calories || 0), 0),
    protein: Math.round(todayEntries.reduce((s, e) => s + (e.total_protein || 0), 0) * 10) / 10,
    carbs: Math.round(todayEntries.reduce((s, e) => s + (e.total_carbs || 0), 0) * 10) / 10,
    fat: Math.round(todayEntries.reduce((s, e) => s + (e.total_fat || 0), 0) * 10) / 10,
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8 max-w-6xl mx-auto pb-20"
      >
        {/* Header & Search */}
        <header className="space-y-6">
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
            <Utensils size={16} />
            <span>Nutrition Tracker</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            What did you <span className="gradient-text">eat today?</span>
          </h1>
          <div className="glass-card p-2 md:p-3 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search foods (e.g. Adobo, Sinigang, Rice)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-[1.5rem] bg-slate-50/50 border-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium text-slate-600"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto px-2">
              {['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Today's Log Summary */}
        {todayEntries.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-slate-800 text-sm uppercase tracking-widest">
                <ClipboardList size={18} className="text-primary" />
                Today's Log
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{todayEntries.length} item{todayEntries.length > 1 ? 's' : ''}</span>
            </div>

            {/* Totals Bar */}
            <div className="glass-card p-5 flex flex-wrap gap-6 items-center justify-between">
              {[
                { label: 'Calories', val: totalToday.cal, color: 'text-orange-500', unit: 'kcal' },
                { label: 'Protein', val: totalToday.protein, color: 'text-blue-500', unit: 'g' },
                { label: 'Carbs', val: totalToday.carbs, color: 'text-amber-500', unit: 'g' },
                { label: 'Fat', val: totalToday.fat, color: 'text-rose-400', unit: 'g' },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <p className={`text-2xl font-black ${m.color}`}>{m.val}<span className="text-xs text-slate-400 font-bold ml-0.5">{m.unit}</span></p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Entry List */}
            <div className="space-y-2">
              {todayEntries.map((entry) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{MEAL_EMOJI[entry.meal_type as MealType] || '🍽'}</span>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{entry.foods?.name || 'Food Item'}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        {entry.servings} serving{entry.servings !== 1 ? 's' : ''} • {entry.meal_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-black text-orange-500 text-sm">{entry.total_calories} kcal</p>
                      <p className="text-[10px] text-slate-400 font-bold">P: {entry.total_protein}g • C: {entry.total_carbs}g • F: {entry.total_fat}g</p>
                    </div>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      disabled={deletingId === entry.id}
                      className="p-2 rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all disabled:opacity-40"
                    >
                      {deletingId === entry.id ? (
                        <div className="h-4 w-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Food Grid */}
        <section className="space-y-4">
          <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest">Browse Foods</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-full flex flex-col items-center py-20 space-y-4">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
                <p className="text-slate-400 font-medium tracking-wide">Fetching food database...</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredFoods.map((food, index) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    key={food.id}
                    className="glass-card p-5 group flex justify-between items-center transition-all hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 cursor-pointer"
                    onClick={() => setSelectedFood(food)}
                  >
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary transition-colors">{food.name}</h3>
                          {food.is_filipino && (
                            <span className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter">
                              <Sparkles size={10} /> Pinoy
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                          {food.serving_size} • {food.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="bg-orange-50 px-3 py-1.5 rounded-xl">
                          <span className="text-sm font-black text-orange-600">{food.calories} kcal</span>
                        </div>
                        <div className="flex gap-3">
                          {[{ label: 'Prot', val: food.protein }, { label: 'Carb', val: food.carbs }, { label: 'Fat', val: food.fat }].map((n) => (
                            <div key={n.label} className="text-center">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">{n.label}</p>
                              <p className="text-xs font-bold text-slate-600">{n.val}g</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); setSelectedFood(food); }}
                      className="h-14 w-14 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200 group-hover:bg-primary group-hover:shadow-primary/30 transition-all shrink-0"
                    >
                      <Plus size={24} strokeWidth={3} />
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {!loading && filteredFoods.length === 0 && (
            <div className="text-center py-20 glass-card">
              <Search size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-xl font-bold text-slate-800">No results found</h3>
              <p className="text-slate-500">Subukan i-search ang ibang pagkain o i-check ang category.</p>
            </div>
          )}
        </section>
      </motion.div>

      {/* Log Modal */}
      <AnimatePresence>
        {selectedFood && (
          <LogModal
            food={selectedFood}
            onClose={() => setSelectedFood(null)}
            onConfirm={addFoodToLog}
            logging={logging}
          />
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {toastFood && (
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed bottom-28 md:bottom-8 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-slate-900/30 flex items-center gap-3 font-bold text-sm whitespace-nowrap"
          >
            <CheckCircle size={20} className="text-primary shrink-0" />
            <span><span className="text-primary">{toastFood}</span> added to your log!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
