import { useState, useEffect } from 'react'; // Added Missing Imports
import { supabase } from '../lib/supabase';
import { calculateBMI, getBMICategory } from '../utils/calculations';
import type { Profile } from '../types';
import { Search, Filter, MessageSquare, Calendar } from 'lucide-react';

export default function DieticianDashboard() {
  const [patients, setPatients] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // FIX: Function defined BEFORE useEffect
  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'patient');
    
    if (data && !error) setPatients(data);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dietitian Portal</h1>
          <p className="text-gray-500">Manage and monitor your patients' nutritional progress</p>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search patients by name..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient: any) => (
          <div key={patient.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center text-primary font-bold text-xl">
                {patient.name[0]}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                getBMICategory(calculateBMI(patient.weight, patient.height)) === 'Normal' 
                ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {getBMICategory(calculateBMI(patient.weight, patient.height))}
              </span>
            </div>
            <h3 className="font-bold text-lg">{patient.name}</h3>
            <p className="text-gray-500 text-sm mb-4">{patient.email}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-2xl text-center">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">BMI</p>
                <p className="font-bold text-gray-900">{calculateBMI(patient.weight, patient.height)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl text-center">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Weight</p>
                <p className="font-bold text-gray-900">{patient.weight}kg</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-primary text-white py-2 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
                <Calendar size={16} /> Monitor
              </button>
              <button className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">
                <MessageSquare size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}