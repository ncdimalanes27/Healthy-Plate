import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { supabaseService } from './lib/supabaseService';
import type { Profile } from './types';

// Layout & Pages
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/Profile';
import FoodLog from './pages/FoodLog';
import MealPlans from './pages/MealPlans';
import HealthMonitoring from './pages/HealthMonitoring';
import Settings from './pages/Settings';
import DieticianDashboard from './pages/DieticianDashboard';
import DieticianNotes from './pages/DieticianNotes';
import AssignMealPlan from './pages/AssignMealPlan';
import ProgressReport from './pages/ProgressReport';

export default function App() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // FIX: Move function definition ABOVE useEffect to avoid hoisting errors
  const fetchProfile = async (userId: string) => {
    const cached = localStorage.getItem(`hp_u_${userId}`);
    if (cached) setUser(JSON.parse(cached));

    const { data, error } = await supabaseService.getProfile(userId);
    if (data && !error) {
      setUser(data);
      localStorage.setItem(`hp_u_${userId}`, JSON.stringify(data));
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  useEffect(() => {
    // 1. Check current session with proper result typing
    supabase.auth.getSession().then((result) => {
      const session = result.data?.session;
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'dietitian' ? '/dietitian/dashboard' : '/dashboard'} />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === 'dietitian' ? '/dietitian/dashboard' : '/dashboard'} />} />

        <Route element={<Layout user={user} onLogout={handleLogout} />}>
          {user?.role === 'patient' ? (
            <>
              <Route path="/dashboard" element={<Dashboard profile={user} />} />
              <Route path="/profile" element={<ProfilePage profile={user} />} />
              <Route path="/food-log" element={<FoodLog profile={user} />} />
              <Route path="/meal-plans" element={<MealPlans profile={user} />} />
              <Route path="/monitoring" element={<HealthMonitoring profile={user} />} />
            </>
          ) : (
            <>
              <Route path="/dietitian/dashboard" element={<DieticianDashboard />} />
              <Route path="/dietitian/notes" element={<DieticianNotes />} />
              <Route path="/dietitian/assign" element={<AssignMealPlan />} />
              <Route path="/dietitian/progress" element={<ProgressReport />} />
            </>
          )}
          <Route path="/settings" element={<Settings profile={user} onLogout={handleLogout} />} />
        </Route>

        <Route path="*" element={<Navigate to={user ? (user.role === 'dietitian' ? '/dietitian/dashboard' : '/dashboard') : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}