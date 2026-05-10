import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculateTargetCalories } from '../utils/calculations';
import { generate7DayMealPlan } from '../utils/mealPlanGenerator';
import type { Profile, Food } from '../types';
import { Sparkles, ChevronDown, ChevronUp, Save, Trash2, Printer } from 'lucide-react';

export default function MealPlans({ profile }: { profile: Profile }) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [currentPlan, setCurrentPlan] = useState<any[] | null>(null);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>('Monday');
  const [isGenerating, setIsGenerating] = useState(false);

  const target = calculateTargetCalories(profile);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: foodData } = await supabase.from('foods').select('*');
    if (foodData) setFoods(foodData);

    const { data: plans } = await supabase
      .from('meal_plans')
      .select('*')
      .order('created_at', { ascending: false });
    if (plans) setSavedPlans(plans);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => { // Simulate AI "thinking"
      const newPlan = generate7DayMealPlan(target, foods);
      setCurrentPlan(newPlan);
      setIsGenerating(false);
    }, 1000);
  };

  const savePlan = async () => {
    if (!currentPlan) return;
    const { error } = await supabase.from('meal_plans').insert({
      user_id: profile.id,
      name: `7-Day Plan (${new Date().toLocaleDateString()})`,
      target_calories: target,
      days: currentPlan
    });
    if (!error) {
      alert("Meal plan saved!");
      fetchData();
    }
  };

  const deletePlan = async (id: string) => {
    if (confirm("Delete this meal plan?")) {
      await supabase.from('meal_plans').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Personalized Meal Plans</h1>
          <p className="text-gray-500">Filipino-focused nutrition based on your {target} kcal target</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isGenerating || foods.length === 0}
          className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50"
        >
          <Sparkles size={20} />
          {isGenerating ? 'Generating...' : 'Generate New Plan'}
        </button>
      </header>

      {currentPlan && (
        <section className="bg-white rounded-3xl border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-6 border-b flex justify-between items-center bg-primary-light/30">
            <h2 className="font-bold text-primary-dark">Current Preview</h2>
            <button onClick={savePlan} className="flex items-center gap-2 text-sm font-bold text-primary hover:underline">
              <Save size={18} /> Save Plan
            </button>
          </div>
          
          <div className="divide-y">
            {currentPlan.map((dayData) => (
              <div key={dayData.day}>
                <button 
                  onClick={() => setExpandedDay(expandedDay === dayData.day ? null : dayData.day)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <span className="font-bold">{dayData.day}</span>
                  {expandedDay === dayData.day ? <ChevronUp /> : <ChevronDown />}
                </button>
                
                {expandedDay === dayData.day && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50/50">
                    {Object.entries(dayData.meals).map(([type, food]: [string, any]) => (
                      <div key={type} className="bg-white p-3 rounded-xl border border-gray-100">
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">{type}</p>
                        <p className="text-sm font-bold leading-tight mb-1">{food.name}</p>
                        <p className="text-xs text-primary font-medium">{food.calories} kcal</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Saved Plans List */}
      <section>
        <h3 className="font-bold text-gray-900 mb-4">Your Saved Plans</h3>
        <div className="grid grid-cols-1 gap-4">
          {savedPlans.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-dashed text-center text-gray-400">
              No saved plans yet. Generate one above!
            </div>
          ) : (
            savedPlans.map(plan => (
              <div key={plan.id} className="bg-white p-4 rounded-2xl border flex items-center justify-between">
                <div>
                  <h4 className="font-bold">{plan.name}</h4>
                  <p className="text-xs text-gray-500">{new Date(plan.created_at).toLocaleDateString()} • {plan.target_calories} kcal</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-primary"><Printer size={20} /></button>
                  <button onClick={() => deletePlan(plan.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={20} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}