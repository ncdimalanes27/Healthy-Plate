import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { Send, AlertCircle, Info, TrendingUp, CheckCircle } from 'lucide-react';

export default function DieticianNotes() {
  const [patients, setPatients] = useState<Profile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [category, setCategory] = useState('General');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  supabase.from('profiles')
    .select('*')
    .eq('role', 'patient')
    .then(({ data }: { data: Profile[] | null }) => { // Type the returned data
      if (data) setPatients(data);
    });
}, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !content) return;
    
    setLoading(true);
    const { error } = await supabase.from('dietician_notes').insert({
      patient_id: selectedPatient,
      content,
      category,
      dietitian_name: 'Dr. Santos (RD)' // In real app, get from current user profile
    });

    if (!error) {
      alert("Note sent to patient!");
      setContent('');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Clinical Notes & Recommendations</h1>
        <p className="text-gray-500">Send personalized feedback to your patients</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Select Patient</label>
          <select 
            className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            required
          >
            <option value="">Choose a patient...</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'Recommendation', icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
              { id: 'Warning', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
              { id: 'Progress', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
              { id: 'General', icon: CheckCircle, color: 'text-gray-600', bg: 'bg-gray-50' },
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  category === cat.id ? 'border-primary bg-primary-light/50' : 'border-gray-100'
                }`}
              >
                <cat.icon className={cat.color} size={20} />
                <span className="text-xs font-bold">{cat.id}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
          <textarea
            className="w-full px-4 py-3 border rounded-xl h-40 outline-none focus:ring-2 focus:ring-primary"
            placeholder="Write your advice here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-dark transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          <Send size={18} />
          {loading ? 'Sending...' : 'Send Note to Patient'}
        </button>
      </form>
    </div>
  );
}