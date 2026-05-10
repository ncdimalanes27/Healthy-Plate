import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, DailyLog } from '../types';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Activity, Scale, TrendingUp } from 'lucide-react';

export default function HealthMonitoring({ profile }: { profile: Profile }) {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', profile.id)
        .order('date', { ascending: true })
        .limit(7);

      if (error) throw error;
      if (data) setLogs(data as DailyLog[]);
    } catch (err) {
      console.error('Error fetching health logs:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (loading) {
    return <div className="p-10 text-center text-gray-400">Loading metrics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl"><Activity size={20} /></div>
            <h3 className="font-bold">Avg. Calories</h3>
          </div>
          <p className="text-2xl font-bold">
            {logs.length > 0 ? Math.round(logs.reduce((acc, curr) => acc + curr.total_calories, 0) / logs.length) : 0} 
            <span className="text-sm font-normal text-gray-400 ml-1">kcal</span>
          </p>
        </div>
        {/* ... Idagdag dito ang iba pang cards ... */}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-light text-primary rounded-xl"><TrendingUp size={20} /></div>
          <h3 className="font-bold">Calorie Intake (kcal)</h3>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={logs}>
              <defs>
                <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { weekday: 'short' })}
                tick={{fontSize: 12, fill: '#9ca3af'}}
              />
              <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="total_calories" stroke="#f97316" fill="url(#colorCal)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}