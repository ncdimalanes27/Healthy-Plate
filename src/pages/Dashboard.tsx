import { useEffect, useState } from 'react';
import { Activity, Scale, Droplets, Zap } from 'lucide-react';
import { calculateBMI, calculateTargetCalories, getBMICategory } from '../utils/calculations';
import type { Profile, DailyLog } from '../types';
import { supabase } from '../lib/supabase';

// 1. Gagawa tayo ng Interface para sa StatCard para iwas error sa 'any'
interface StatCardProps {
  label: string;
  value: string;
  subValue: string;
  icon: React.ElementType; // Type para sa Lucide Icons
  color: string;
}

export default function Dashboard({ profile }: { profile: Profile }) {
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  
  const target = calculateTargetCalories(profile);
  const bmiValue = profile.weight && profile.height ? calculateBMI(profile.weight, profile.height) : 0;
  const bmiCategory = getBMICategory(bmiValue);
  
  // Kunin ang data para sa araw na ito mula sa Supabase
  useEffect(() => {
    const fetchTodayLog = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', profile.id)
          .eq('date', today)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no row found, which is okay
        if (data) setTodayLog(data);
      } catch (err) {
        console.error('Error fetching today\'s log:', err);
      }
    };

    fetchTodayLog();
  }, [profile.id]);

  const percentage = todayLog ? Math.min(Math.round((todayLog.total_calories / target) * 100), 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header>
        <p className="text-green-600 font-medium">Good afternoon 🥗</p>
        <h1 className="text-3xl font-bold font-serif text-gray-900">{profile.name}</h1>
        <p className="text-gray-500">
          {new Date().toLocaleDateString('en-PH', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calorie Ring Card */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col items-center">
          <h3 className="text-gray-500 text-sm font-medium self-start mb-4">Today's Calories</h3>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
              <circle 
                cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray={364.4} 
                strokeDashoffset={364.4 - (364.4 * percentage) / 100}
                className="text-green-500 transition-all duration-1000" 
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-bold">{todayLog?.total_calories || 0}</span>
              <span className="text-gray-400 text-xs block">/ {target}</span>
            </div>
          </div>
          <div className="mt-4 w-full space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Protein</span>
              <span className="font-bold">{todayLog?.total_protein || 0}g</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all" 
                style={{ width: todayLog ? `${Math.min((todayLog.total_protein / 100) * 100, 100)}%` : '0%' }}
              ></div>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard 
            label="BMI" 
            value={bmiValue.toFixed(1)} 
            subValue={bmiCategory} 
            icon={Scale} 
            color="bg-green-100 text-green-600" 
          />
          <StatCard 
            label="Target Calories" 
            value={`${target} kcal`} 
            subValue="Daily Goal" 
            icon={Zap} 
            color="bg-orange-100 text-orange-600" 
          />
          <StatCard 
            label="Blood Sugar" 
            value="-- mg/dL" 
            subValue="Last Logged" 
            icon={Droplets} 
            color="bg-purple-100 text-purple-600" 
          />
          <StatCard 
            label="Blood Pressure" 
            value="-- mmHg" 
            subValue="Last Logged" 
            icon={Activity} 
            color="bg-red-100 text-red-600" 
          />
        </div>
      </div>
      
      {/* Health Conditions Section */}
      {profile.health_conditions && profile.health_conditions.length > 0 && (
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
          <h4 className="text-orange-800 font-bold text-sm mb-2 uppercase tracking-wide">
            Health Conditions to Note
          </h4>
          <div className="flex flex-wrap gap-2">
            {profile.health_conditions.map((c: string) => (
              <span key={c} className="bg-white border border-orange-200 px-3 py-1 rounded-full text-xs text-orange-700 font-medium">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 2. Ginawa nating type-safe ang StatCard gamit ang StatCardProps
function StatCard({ label, value, subValue, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm flex justify-between items-start">
      <div>
        <p className="text-gray-500 text-xs font-medium uppercase">{label}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
        <p className="text-gray-400 text-xs">{subValue}</p>
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={20} />
      </div>
    </div>
  );
}