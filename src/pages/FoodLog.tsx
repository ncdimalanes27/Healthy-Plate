import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { supabaseService } from '../lib/supabaseService';
import { foodCategories } from '../data/foods';
import type { Food, Profile } from '../types';
import { Search, Plus, Utensils, X } from 'lucide-react';

export default function FoodLog({ profile }: { profile: Profile }) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    const { data } = await supabase.from('foods').select('*');
    if (data) setFoods(data);
    setLoading(false);
  };

  const filteredFoods = foods.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || f.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const addFoodToLog = async (food: Food) => {
    setLogging(true);
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Get or Create Daily Log
    const { data: log } = await supabase
      .from('daily_logs')
      .upsert({ user_id: profile.id, date: today }, { onConflict: 'user_id, date' })
      .select()
      .single();

    if (log) {
      // 2. Insert Meal Entry
      await supabase.from('meal_entries').insert({
        user_id: profile.id,
        log_id: log.id,
        food_id: food.id,
        food_name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        meal_type: 'Lunch', // Default, can be improved with a selector
        servings: 1,
        date: today
      });

      // 3. Update Daily Totals (Simple increment)
      await supabase.rpc('increment_daily_totals', {
        log_id: log.id,
        cal: food.calories,
        pro: food.protein,
        carb: food.carbs,
        fat: food.fat
      });
      
      alert(`${food.name} added to your log!`);
    }
    setLogging(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Food Database</h1>
        <p className="text-gray-500">Log your Filipino meals and track your intake</p>
      </header>

      {/* Search and Filters */}
      <div className="space-y-4 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search foods (e.g. Adobo, Rice...)"
            className="w-full pl-12 pr-4 py-3 bg-white border rounded-2xl focus:ring-2 focus:ring-primary outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              selectedCategory === 'All' ? 'bg-primary text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {foodCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                selectedCategory === cat ? 'bg-primary text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Food List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <p>Loading database...</p>
        ) : filteredFoods.map(food => (
          <div key={food.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900">{food.name}</h3>
                {food.is_filipino && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase">Pinoy</span>}
              </div>
              <p className="text-xs text-gray-500">{food.serving_size} • {food.category}</p>
              <div className="flex gap-3 mt-2">
                <span className="text-xs font-medium text-orange-600">{food.calories} kcal</span>
                <span className="text-xs text-gray-400">P: {food.protein}g</span>
                <span className="text-xs text-gray-400">C: {food.carbs}g</span>
                <span className="text-xs text-gray-400">F: {food.fat}g</span>
              </div>
            </div>
            <button
              onClick={() => addFoodToLog(food)}
              disabled={logging}
              className="p-2 bg-primary-light text-primary rounded-xl hover:bg-primary hover:text-white transition-colors"
            >
              <Plus size={24} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}