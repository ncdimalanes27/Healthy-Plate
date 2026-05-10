import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { calculateBMI, getBMICategory, calculateTargetCalories } from '../utils/calculations';
import type { Profile } from '../types';
import { Search, ChevronDown, ChevronUp, User, Activity, ClipboardList, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DieticianDashboard() {
  const [patients, setPatients] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'patient');
    if (data) setPatients(data);
    setLoading(false);
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-gray-900">Dietitian Portal</h1>
          <p className="text-gray-500">Manage and monitor patient nutritional progress</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm text-center">
            <p className="text-[10px] uppercase font-bold text-gray-400">Total Patients</p>
            <p className="text-xl font-bold text-primary">{patients.length}</p>
          </div>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search patients by name or email..."
          className="w-full pl-12 pr-4 py-3 bg-white border rounded-2xl focus:ring-2 focus:ring-primary outline-none shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading patients...</div>
        ) : filteredPatients.map(patient => {
          const bmi = patient.weight && patient.height ? calculateBMI(patient.weight, patient.height) : 0;
          const target = calculateTargetCalories(patient);
          const isExpanded = expandedId === patient.id;

          return (
            <div key={patient.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden transition-all">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedId(isExpanded ? null : patient.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold text-lg">
                    {patient.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{patient.name}</h3>
                    <p className="text-sm text-gray-500">{patient.email}</p>
                  </div>
                </div>
                
                <div className="hidden md:flex gap-8">
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-400">BMI</p>
                    <p className={`font-bold ${bmi > 25 ? 'text-orange-600' : 'text-green-600'}`}>{bmi || '--'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Goal</p>
                    <p className="font-bold text-gray-700">{patient.goal || 'Not Set'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                   <div className="flex gap-2">
                      <Link to="/dietitian/notes" className="p-2 text-gray-400 hover:text-primary transition-colors">
                        <MessageSquare size={20} />
                      </Link>
                      <Link to="/dietitian/assign" className="p-2 text-gray-400 hover:text-primary transition-colors">
                        <ClipboardList size={20} />
                      </Link>
                   </div>
                   {isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-6 pt-2 border-t bg-gray-50/50 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase">Profile Details</h4>
                      <p className="text-sm"><strong>Age/Gender:</strong> {patient.age || '--'} / {patient.gender || '--'}</p>
                      <p className="text-sm"><strong>Height/Weight:</strong> {patient.height}cm / {patient.weight}kg</p>
                      <p className="text-sm"><strong>Activity:</strong> {patient.activity_level}</p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase">Health Info</h4>
                      <p className="text-sm"><strong>Target:</strong> {target} kcal/day</p>
                      <div className="flex flex-wrap gap-1">
                        <strong>Conditions:</strong>
                        {patient.health_conditions.length > 0 ? patient.health_conditions.map(c => (
                          <span key={c} className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md font-medium">{c}</span>
                        )) : <span className="text-sm text-gray-400">None</span>}
                      </div>
                    </div>
                    <div className="flex flex-col justify-end">
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