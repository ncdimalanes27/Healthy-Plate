import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { calculateBMI, calculateTargetCalories } from '../utils/calculations';
import type { Profile, DailyLog } from '../types';
import { TrendingUp, AlertTriangle, CheckCircle, Search, ArrowRight } from 'lucide-react';

interface PatientStats extends Profile {
  avgIntake: number;
  weightChange: number;
  status: 'On track' | 'Needs attention' | 'Stable';
}

export default function ProgressReport() {
  const [reportData, setReportData] = useState<PatientStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    const { data: patients } = await supabase.from('profiles').select('*').eq('role', 'patient');
    
    if (patients) {
      const fullStats = await Promise.all(patients.map(async (p) => {
        const { data: logs } = await supabase
          .from('daily_logs')
          .select('total_calories, weight')
          .eq('user_id', p.id)
          .order('date', { ascending: false })
          .limit(7);

        const avgIntake = logs && logs.length > 0 
          ? Math.round(logs.reduce((acc, curr) => acc + curr.total_calories, 0) / logs.length) 
          : 0;
        
        const target = calculateTargetCalories(p);
        const status = avgIntake === 0 ? 'Stable' : 
                       (Math.abs(avgIntake - target) > 300) ? 'Needs attention' : 'On track';

        return { ...p, avgIntake, weightChange: 0, status };
      }));
      setReportData(fullStats as PatientStats[]);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Patient Progress Reports</h1>
        <p className="text-gray-500">Weekly analytical summary of patient adherence</p>
      </header>

      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">BMI</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Target</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Avg. Intake</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reportData.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.email}</p>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {p.weight && p.height ? calculateBMI(p.weight, p.height) : '--'}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {calculateTargetCalories(p)} kcal
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${p.avgIntake > calculateTargetCalories(p) ? 'text-red-500' : 'text-green-600'}`}>
                      {p.avgIntake} kcal
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold w-fit ${
                      p.status === 'On track' ? 'bg-green-100 text-green-700' : 
                      p.status === 'Needs attention' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {p.status === 'On track' ? <CheckCircle size={14}/> : <AlertTriangle size={14}/>}
                      {p.status}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-primary hover:text-primary-dark font-bold text-sm flex items-center gap-1">
                      Details <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}