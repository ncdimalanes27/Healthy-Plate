import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calculateBMI, getBMICategory, calculateTargetCalories } from '../utils/calculations';
import type { Profile } from '../types';
import { Search, ChevronDown, ChevronUp, ClipboardList, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DieticianDashboard() {
  const [patients, setPatients] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient');
      
      if (error) throw error;
      if (data) setPatients(data as Profile[]);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Directory</h1>
          <p className="text-gray-500">Monitor and manage your patients' progress</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full md:w-64"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {filteredPatients.map((patient) => {
          const bmi = patient.weight && patient.height ? calculateBMI(patient.weight, patient.height) : null;
          const bmiCategory = bmi ? getBMICategory(bmi) : null;
          const target = calculateTargetCalories(patient);
          const isExpanded = expandedId === patient.id;

          return (
            <div key={patient.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all hover:shadow-md">
              <button 
                onClick={() => setExpandedId(isExpanded ? null : patient.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-lg">
                    {patient.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{patient.name}</h3>
                    <p className="text-sm text-gray-500">{patient.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:block text-right mr-4">
                    <p className="text-xs text-gray-400 uppercase font-bold">Status</p>
                    <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">Active</span>
                  </div>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 border-t border-gray-50 bg-gray-50/30">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase">Body Metrics</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-gray-500">Weight</p>
                          <p className="font-bold">{patient.weight || '--'} kg</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Height</p>
                          <p className="font-bold">{patient.height || '--'} cm</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase">BMI Status</h4>
                      <p className="font-bold text-lg">{bmi || '--'}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        bmiCategory === 'Normal' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {bmiCategory || 'No Data'}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase">Health Info</h4>
                      <p className="text-sm"><strong>Target:</strong> {target} kcal/day</p>
                      <div className="flex flex-wrap gap-1">
                        <strong>Conditions:</strong>
                        {patient.health_conditions && (patient.health_conditions as string[]).length > 0 ? (
                          (patient.health_conditions as string[]).map((c: string) => (
                            <span key={c} className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md font-medium">{c}</span>
                          ))
                        ) : <span className="text-sm text-gray-400">None</span>}
                      </div>
                    </div>
                    <div className="flex flex-col justify-end gap-2">
                      <Link 
                        to="/dietitian/progress" 
                        className="w-full bg-white border border-primary text-primary hover:bg-primary hover:text-white font-bold py-2 rounded-xl text-center transition-all text-sm"
                      >
                        View Full Progress Report
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}