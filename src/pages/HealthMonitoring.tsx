import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, DailyLog } from '../types';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { Activity, Scale, Droplets, Heart, Save } from 'lucide-react';

export default function HealthMonitoring({ profile }: { profile: Profile }) {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    weight: profile.weight || '',
    blood_sugar: '',
    systolic: '',
    diastolic: ''
  });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', profile.id)
      .order('date', { ascending: true });
    if (data) setLogs(data);
    setLoading(false);
  };

  const handleSaveMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('daily_logs')
      .upsert({
        user_id: profile.id,
        date: today,
        weight: formData.weight ? parseFloat(formData.weight.toString()) : null,
        blood_sugar: formData.blood_sugar ? parseInt(formData.blood_sugar.toString()) : null,
        blood_pressure_systolic: formData.systolic ? parseInt(formData.systolic.toString()) : null,
        blood_pressure_diastolic: formData.diastolic ? parseInt(formData.diastolic.toString()) : null,
      }, { onConflict: 'user_id, date' });

    if (!error) {
      alert("Metrics saved successfully!");
      fetchLogs();
    }
  };

  // Format data for charts: only show last 7 entries
  const chartData = logs.slice(-7).map(log => ({
    name: new Date(log.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
    weight: log.weight,
    sugar: log.blood_sugar,
    bp: log.blood_pressure_systolic,
    calories: log.total_calories
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <header>
        <h1 className="text-2xl font-bold">Health Monitoring</h1>
        <p className="text-gray-500">Track your vitals and health progress over time</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Log Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSaveMetrics} className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Activity className="text-primary" size={20} /> Today's Vitals
            </h2>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weight (kg)</label>
              <input 
                type="number" step="0.1" className="w-full px-4 py-2 border rounded-xl"
                value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Blood Sugar (mg/dL)</label>
              <input 
                type="number" className="w-full px-4 py-2 border rounded-xl"
                value={formData.blood_sugar} onChange={e => setFormData({...formData, blood_sugar: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">BP Systolic</label>
                <input 
                  type="number" placeholder="120" className="w-full px-4 py-2 border rounded-xl"
                  value={formData.systolic} onChange={e => setFormData({...formData, systolic: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">BP Diastolic</label>
                <input 
                  type="number" placeholder="80" className="w-full px-4 py-2 border rounded-xl"
                  value={formData.diastolic} onChange={e => setFormData({...formData, diastolic: e.target.value})}
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-dark transition-all">
              <Save size={18} /> Update Today's Log
            </button>
          </form>
        </div>

        {/* Charts Section */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weight Trend */}
          <div className="bg-white p-4 rounded-3xl border shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-gray-700">
              <Scale size={18} /> <span className="font-bold">Weight Trend</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Blood Sugar Area */}
          <div className="bg-white p-4 rounded-3xl border shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-gray-700">
              <Droplets size={18} className="text-red-500" /> <span className="font-bold">Blood Sugar</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSugar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Area type="monotone" dataKey="sugar" stroke="#ef4444" fillOpacity={1} fill="url(#colorSugar)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Calorie Intake Bar */}
          <div className="bg-white p-4 rounded-3xl border shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 mb-4 text-gray-700">
              <Activity size={18} className="text-orange-500" /> <span className="font-bold">Weekly Calorie History</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip cursor={{fill: '#f9fafb'}} />
                  <Bar dataKey="calories" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}