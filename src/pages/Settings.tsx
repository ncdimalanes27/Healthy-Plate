// Removed unused supabase import
import type { Profile } from '../types';
import { LogOut, Shield, Bell, Database, ArrowRight } from 'lucide-react';

export default function Settings({ profile, onLogout }: { profile: Profile | null, onLogout: () => void }) {
  const handleClearCache = () => {
    if (profile) {
      localStorage.removeItem(`hp_u_${profile.id}`);
      alert("Local cache cleared!");
      window.location.reload();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500">Manage your account and app preferences</p>
      </header>

      <div className="bg-white rounded-3xl border shadow-sm divide-y">
        <div className="p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase mb-4">Account Information</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-2xl font-bold">
              {profile?.name?.[0] || 'U'}
            </div>
            <div>
              <p className="text-lg font-bold">{profile?.name}</p>
              <p className="text-gray-500">{profile?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-primary-light text-primary text-[10px] font-bold rounded uppercase">
                {profile?.role}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
           <SettingItem icon={Bell} title="Notifications" description="Manage email and push alerts" />
           <SettingItem icon={Shield} title="Privacy & Security" description="Update password and data sharing" />
           <button 
             onClick={handleClearCache}
             className="w-full flex items-center justify-between hover:bg-gray-50 p-2 -m-2 rounded-xl transition-colors"
           >
             <div className="flex gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Database size={20} /></div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Clear Cache</p>
                  <p className="text-xs text-gray-500">Refresh locally stored profile data</p>
                </div>
             </div>
           </button>
        </div>

        <div className="p-6">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-all"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

// Fixed 'any' error by typing the icon correctly
function SettingItem({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-xl transition-colors">
      <div className="flex gap-3">
        <div className="p-2 bg-gray-100 text-gray-600 rounded-lg"><Icon size={20} /></div>
        <div>
          <p className="font-bold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <ArrowRight size={16} className="text-gray-300" />
    </div>
  );
}