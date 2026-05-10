import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Food, Profile } from '../types';
import { Search } from 'lucide-react';

export default function FoodLog({ profile }: { profile: Profile }) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);

  const fetchFoods = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('foods').select('*');
      if (data) setFoods(data as Food[]);
    } catch (error) {
      console.error('Error fetching foods:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  const addFoodToLog = async (food: Food) => {
    setLogging(true);
    try {
      const { error } = await supabase.from('daily_logs').insert([{
        user_id: profile.id,
        food_id: food.id,
        total_calories: food.calories,
        date: new Date().toISOString().split('T')[0]
      }]);
      if (error) throw error;
      alert(`Added ${food.name} to your log!`);
    } catch (err) {
      console.error(err);
    } finally {
      setLogging(false);
    }
  };

  const filteredFoods = foods.filter((f: Food) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || f.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-3xl border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search foods (e.g. Adobo, Rice)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {/* Category selector can go here */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-center text-gray-400 py-10 col-span-2">Loading database...</p>
        ) : filteredFoods.map((food: Food) => (
          <div key={food.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900">{food.name}</h3>
                {food.is_filipino && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase">Pinoy</span>}
              </div>
              <p className="text-xs text-gray-500">{food.serving_size} • {food.category}</p>
              <div className="flex gap-3 mt-2 text-xs font-medium">
                <span className="text-orange-600">{food.calories} kcal</span>
                <span className="text-gray-400">P: {food.protein}g C: {food.carbs}g F: {food.fat}g</span>
              </div>
            </div>
            <button
              onClick={() => addFoodToLog(food)}
              disabled={logging}
              className="p-2 bg-primary-light text-primary rounded-xl hover:bg-primary hover:text-white transition-colors"
            >
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}