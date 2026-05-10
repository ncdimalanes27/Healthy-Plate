import { useState, useEffect } from 'react'; // Added Missing Imports
import { supabase } from '../lib/supabase';
import type { Profile, Food, DailyLog } from '../types';
import { Plus, Search, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';

export default function FoodLog({ profile }: { profile: Profile }) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // FIX: Function defined BEFORE useEffect
  const fetchFoods = async () => {
    const { data, error } = await supabase.from('foods').select('*');
    if (data && !error) setFoods(data);
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const filteredFoods = foods.filter((f: any) => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Food Diary</h1>
          <p className="text-gray-500">Track your daily Filipino meals</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-dark transition-all"
        >
          <Plus size={20} /> Add Meal
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-light text-primary rounded-lg">
            <CalendarIcon size={20} />
          </div>
          <span className="font-bold text-gray-900">Today, {new Date().toLocaleDateString()}</span>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search Filipino foods (e.g. Adobo)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid gap-3">
            {filteredFoods.map((food: any) => (
              <div key={food.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer group">
                <div>
                  <h4 className="font-bold text-gray-900">{food.name}</h4>
                  <p className="text-xs text-gray-500">{food.calories} kcal • {food.serving_size}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary group-hover:translate-x-[-4px] transition-transform flex items-center gap-1">
                    Log <Plus size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}