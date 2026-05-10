import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calculateBMI, calculateTargetCalories } from '../utils/calculations';
import type { Profile } from '../types';
import { AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

interface PatientStats extends Profile {
  avgIntake: number;
  status: 'On track' | 'Needs attention' | 'Stable';
}

export default function ProgressReport() {
  const [reportData, setReportData] = useState<PatientStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: patients } = await supabase.from('profiles').select('*').eq('role', 'patient');
      
      if (patients) {
        const fullStats = await Promise.all(patients.map(async (p) => {
          const { data: logs } = await supabase
            .from('daily_logs')
            .select('total_calories')
            .eq('user_id', p.id)
            .order('date', { ascending: false })
            .limit(7);

          const avgIntake = logs && logs.length > 0 
            ? Math.round(logs.reduce((acc, curr) => acc + (curr.total_calories || 0), 0) / logs.length) 
            : 0;
          
          const target = calculateTargetCalories(p);
          let status: 'On track' | 'Needs attention' | 'Stable' = 'Stable';
          
          if (avgIntake > 0) {
            status = avgIntake > target + 200 || avgIntake < target - 500 ? 'Needs attention' : 'On track';
          }

          return { ...p, avgIntake, status };
        }));
        setReportData(fullStats as PatientStats[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-gray-50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Weekly Progress Report</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
            <tr>
              <th className="px-6 py-4">Patient</th>
              <th className="px-6 py-4">BMI</th>
              <th className="px-6 py-4">Target</th>
              <th className="px-6 py-4">Avg. Intake</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {reportData.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900">{p.name}</td>
                <td className="px-6 py-4">
                  {p.weight && p.height ? calculateBMI(p.weight, p.height) : '--'}
                </td>
                <td className="px-6 py-4 text-gray-600 font-medium">
                  {calculateTargetCalories(p)} kcal
                </td>
                <td className="px-6 py-4">
                  <span className={`font-bold ${p.avgIntake > calculateTargetCalories(p) + 200 ? 'text-red-500' : 'text-green-600'}`}>
                    {p.avgIntake || 'No data'} {p.avgIntake > 0 ? 'kcal' : ''}
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
  );
}