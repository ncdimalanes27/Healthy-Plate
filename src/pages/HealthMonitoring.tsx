import { useState, useEffect } from 'react'; // Added Missing Imports
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Scale, Droplets, Save } from 'lucide-react';

export default function HealthMonitoring({ profile }: { profile: any }) {
  const [logs, setLogs] = useState<any[]>([]);

  // FIX: Function defined BEFORE useEffect
  const fetchLogs = async () => {
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', profile.id)
      .order('date', { ascending: true })
      .limit(7);
    if (data) setLogs(data);
  };

  useEffect(() => {
    fetchLogs();
  }, [profile.id]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Health Monitoring</h1>
        <p className="text-gray-500">Track your vitals and progress over time</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <Scale className="text-blue-500" /> Weight Trend (kg)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={logs}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <Activity className="text-orange-500" /> Calorie Intake Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={logs}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total_calories" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}