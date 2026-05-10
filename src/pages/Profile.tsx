import React, { useState } from 'react';
import { supabaseService } from '../lib/supabaseService';
import type { Profile } from '../types';
import { Save, User as UserIcon } from 'lucide-react';

export default function ProfilePage({ profile }: { profile: Profile }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    age: profile.age || '',
    gender: profile.gender || 'Male',
    height: profile.height || '',
    weight: profile.weight || '',
    activity_level: profile.activity_level || 'Sedentary',
    goal: profile.goal || 'Maintain',
    health_conditions: profile.health_conditions.join(', '),
    allergies: profile.allergies.join(', ')
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const updates = {
      ...formData,
      age: parseInt(formData.age.toString()),
      height: parseInt(formData.height.toString()),
      weight: parseFloat(formData.weight.toString()),
      health_conditions: formData.health_conditions.split(',').map(s => s.trim()).filter(s => s !== ''),
      allergies: formData.allergies.split(',').map(s => s.trim()).filter(s => s !== '')
    };

    const { error } = await supabaseService.updateProfile(profile.id, updates);
    if (!error) {
      alert("Profile updated successfully!");
      window.location.reload(); // Refresh to update local storage/context
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary-light p-2 rounded-lg">
          <UserIcon className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Health Profile</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6 bg-white p-8 rounded-3xl border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded-xl"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select 
              className="w-full px-4 py-2 border rounded-xl"
              value={formData.gender}
              onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded-xl"
              value={formData.height}
              onChange={(e) => setFormData({...formData, height: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              className="w-full px-4 py-2 border rounded-xl"
              value={formData.weight}
              onChange={(e) => setFormData({...formData, weight: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
            <select 
              className="w-full px-4 py-2 border rounded-xl"
              value={formData.activity_level}
              onChange={(e) => setFormData({...formData, activity_level: e.target.value})}
            >
              <option value="Sedentary">Sedentary (Little/no exercise)</option>
              <option value="Light">Lightly Active (1-3 days/week)</option>
              <option value="Moderate">Moderately Active (3-5 days/week)</option>
              <option value="Active">Very Active (6-7 days/week)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Goal</label>
            <select 
              className="w-full px-4 py-2 border rounded-xl"
              value={formData.goal}
              onChange={(e) => setFormData({...formData, goal: e.target.value as any})}
            >
              <option value="Lose Weight">Lose Weight</option>
              <option value="Maintain">Maintain Weight</option>
              <option value="Gain Weight">Gain Weight</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Health Conditions (comma separated)</label>
          <textarea
            className="w-full px-4 py-2 border rounded-xl h-20"
            placeholder="Diabetes, Hypertension..."
            value={formData.health_conditions}
            onChange={(e) => setFormData({...formData, health_conditions: e.target.value})}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50"
        >
          <Save size={20} />
          {loading ? 'Saving...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
}