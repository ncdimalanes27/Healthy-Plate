import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { calculateBMI, calculateTargetCalories } from '../utils/calculations';
import type { Profile } from '../types';
import { AlertTriangle, CheckCircle, ArrowRight, FileText, ClipboardCheck, Search, Printer } from 'lucide-react';

interface PatientStats extends Profile {
  avgIntake: number;
  status: 'On track' | 'Needs attention' | 'Stable';
}

export default function ProgressReport() {
  const [reportData, setReportData] = useState<PatientStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: patients, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient')
        .order('name', { ascending: true });

      if (pError) throw pError;

      if (patients) {
        const fullStats = await Promise.all(patients.map(async (p) => {
          try {
            const { data: logs } = await supabase
              .from('daily_logs')
              .select('date, total_calories')
              .eq('user_id', p.id)
              .order('date', { ascending: false });

            // Group by date, sum calories per day, take last 7 days
            const dailyTotals: Record<string, number> = {};
            (logs || []).forEach((row: any) => {
              dailyTotals[row.date] = (dailyTotals[row.date] || 0) + (row.total_calories || 0);
            });
            const last7 = Object.values(dailyTotals).slice(0, 7);
            const avgIntake = last7.length > 0
              ? Math.round(last7.reduce((a, b) => a + b, 0) / last7.length)
              : 0;

            const target = calculateTargetCalories(p);
            let status: 'On track' | 'Needs attention' | 'Stable' = 'Stable';
            if (avgIntake > 0) {
              status = avgIntake > target + 200 || avgIntake < target - 300 ? 'Needs attention' : 'On track';
            }
            return { ...p, avgIntake, status };
          } catch {
            return { ...p, avgIntake: 0, status: 'Stable' as const };
          }
        }));
        setReportData(fullStats as PatientStats[]);
      }
    } catch (err) {
      console.error('Error in ProgressReport:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReportData(); }, [fetchReportData]);

  const filteredPatients = reportData.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Progress Report — HealthyPlate</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', sans-serif; padding: 32px; color: #1e293b; }
          h1 { font-size: 26px; font-weight: 900; color: #0f172a; border-bottom: 3px solid #10b981; padding-bottom: 12px; margin-bottom: 24px; }
          .meta { color: #64748b; font-size: 13px; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; }
          thead tr { background: #f8fafc; }
          th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; }
          td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .badge { display: inline-block; padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
          .on-track { background: #d1fae5; color: #065f46; }
          .needs-attention { background: #ffedd5; color: #9a3412; }
          .stable { background: #f1f5f9; color: #475569; }
          .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          .summary { display: flex; gap: 24px; margin-bottom: 24px; }
          .summary-card { background: #f8fafc; border-radius: 10px; padding: 16px 24px; }
          .summary-card .val { font-size: 28px; font-weight: 900; color: #0f172a; }
          .summary-card .lbl { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }
        </style>
      </head>
      <body>
        <h1>Patient Progress Report</h1>
        <p class="meta">Generated: ${new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} &nbsp;•&nbsp; HealthyPlate Capstone</p>
        <div class="summary">
          <div class="summary-card"><div class="val">${reportData.length}</div><div class="lbl">Total Patients</div></div>
          <div class="summary-card"><div class="val">${reportData.filter((p) => p.status === 'On track').length}</div><div class="lbl">On Track</div></div>
          <div class="summary-card"><div class="val">${reportData.filter((p) => p.status === 'Needs attention').length}</div><div class="lbl">Need Attention</div></div>
          <div class="summary-card"><div class="val">${Math.round((reportData.filter((p) => p.status === 'On track').length / (reportData.length || 1)) * 100)}%</div><div class="lbl">Compliance Rate</div></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>BMI</th>
              <th>Goal</th>
              <th>Calorie Target</th>
              <th>7-Day Avg</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredPatients.map((p) => {
              const bmi = p.weight && p.height ? calculateBMI(p.weight, p.height) : '--';
              const target = calculateTargetCalories(p);
              const cls = p.status === 'On track' ? 'on-track' : p.status === 'Needs attention' ? 'needs-attention' : 'stable';
              return `
                <tr>
                  <td><strong>${p.name}</strong></td>
                  <td>${bmi}</td>
                  <td>${p.goal || '--'}</td>
                  <td>${target} kcal</td>
                  <td>${p.avgIntake || 0} kcal</td>
                  <td><span class="badge ${cls}">${p.status}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <div class="footer">HealthyPlate — Filipino-Focused Nutrition App &nbsp;•&nbsp; Capstone Project</div>
      </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="relative">
          <div className="animate-spin h-14 w-14 border-[5px] border-primary/10 border-t-primary rounded-full"></div>
          <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/30" size={20} />
        </div>
        <p className="text-slate-900 font-black text-sm uppercase tracking-widest">Generating Reports...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 pb-10"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em]">
            <ClipboardCheck size={14} />
            <span>Clinical Analytics</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Patient <span className="gradient-text">Progress</span>
          </h1>
          <p className="text-slate-500 font-medium">Real-time health monitoring and intervention tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3.5 bg-white border-none rounded-2xl text-sm font-bold shadow-xl shadow-slate-200/50 focus:ring-2 focus:ring-primary/20 w-full sm:w-64 transition-all outline-none"
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20 whitespace-nowrap"
          >
            <Printer size={18} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Patients', value: reportData.length, color: 'text-slate-800', bg: 'bg-slate-50' },
          { label: 'On Track', value: reportData.filter((p) => p.status === 'On track').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Need Attention', value: reportData.filter((p) => p.status === 'Needs attention').length, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Compliance', value: `${Math.round((reportData.filter((p) => p.status === 'On track').length / (reportData.length || 1)) * 100)}%`, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5 text-center`}>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card border-none shadow-2xl shadow-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-6">Patient</th>
                <th className="px-6 py-6">BMI</th>
                <th className="px-6 py-6 text-center">Target</th>
                <th className="px-6 py-6 text-center">7-Day Avg</th>
                <th className="px-6 py-6">Status</th>
                <th className="px-8 py-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPatients.map((p, index) => (
                <motion.tr
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={p.id}
                  className="hover:bg-slate-50/80 transition-all group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-black text-sm shadow-inner">
                        {p.name[0]}
                      </div>
                      <div>
                        <span className="font-black text-slate-800 group-hover:text-primary transition-colors tracking-tight block">{p.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{p.goal || 'No goal set'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    {p.weight && p.height ? (
                      <span className="text-sm font-black text-slate-700">{calculateBMI(p.weight, p.height)}</span>
                    ) : (
                      <span className="text-slate-300 italic text-xs font-bold uppercase">—</span>
                    )}
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                      {calculateTargetCalories(p)} <span className="text-[10px] opacity-60">kcal</span>
                    </span>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className={`text-sm font-black ${p.avgIntake > calculateTargetCalories(p) + 200 ? 'text-orange-500' : 'text-emerald-600'}`}>
                      {p.avgIntake || 0} <span className="text-[10px] opacity-50 font-bold">kcal</span>
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest w-fit ${
                      p.status === 'On track' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' :
                      p.status === 'Needs attention' ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {p.status === 'On track' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                      {p.status}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-100 text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-300">
                      <ArrowRight size={20} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPatients.length === 0 && (
          <div className="py-24 text-center space-y-4">
            <Search size={32} className="mx-auto text-slate-200" />
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No patients found</p>
          </div>
        )}
      </div>

      {/* Insight Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-primary/5 border border-primary/10 p-8 rounded-[2.5rem] flex items-start gap-5">
          <div className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20">
            <CheckCircle size={24} />
          </div>
          <div>
            <h4 className="text-slate-900 font-black text-lg tracking-tight">Compliance Rate</h4>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              {Math.round((reportData.filter((p) => p.status === 'On track').length / (reportData.length || 1)) * 100)}% ng iyong mga pasyente ay on-track sa kanilang calorie goals ngayong linggo.
            </p>
          </div>
        </div>
        <div className="bg-slate-900 p-8 rounded-[2.5rem] flex items-start gap-5 text-white">
          <div className="p-4 bg-orange-500 text-white rounded-2xl shadow-xl shadow-orange-500/20">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 className="font-black text-lg tracking-tight">Critical Interventions</h4>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Mayroong {reportData.filter((p) => p.status === 'Needs attention').length} pasyente na kailangang i-review ang meal plan dahil sa consistent calorie deviation.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
