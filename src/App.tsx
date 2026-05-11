import { useEffect, useState, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { supabaseService } from './lib/supabaseService';
import type { Profile } from './types';

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

function loadCachedUser(): Profile | null {
  try {
    const key = Object.keys(localStorage).find(k => k.startsWith('hp_u_'));
    return key ? (JSON.parse(localStorage.getItem(key)!) as Profile) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const cached = loadCachedUser();
  const [user, setUser] = useState<Profile | null>(cached);
  const [loading, setLoading] = useState(cached === null);
  const isMounted = useRef(true);
  const signingOut = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabaseService.getProfile(userId);
      if (error) throw error;
      if (data && isMounted.current) {
        setUser(data);
        localStorage.setItem(`hp_u_${userId}`, JSON.stringify(data));
      }
    } catch (err) {
      console.error('Profile sync error:', err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    signingOut.current = false;

    const safetyTimer = setTimeout(() => {
      if (isMounted.current) setLoading(false);
    }, 6000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (signingOut.current) return;

        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            const rememberMe = localStorage.getItem('hp_rm');
            const tabActive = sessionStorage.getItem('hp_tab_active');
            if (!rememberMe && !tabActive) {
              signingOut.current = true;
              await supabase.auth.signOut();
              signingOut.current = false;
              if (isMounted.current) { setUser(null); setLoading(false); }
              return;
            }
            sessionStorage.setItem('hp_tab_active', '1');
            await fetchProfile(session.user.id);
          } else {
            if (isMounted.current) { setUser(null); setLoading(false); }
          }
          clearTimeout(safetyTimer);

        } else if (event === 'SIGNED_IN' && session?.user) {
          sessionStorage.setItem('hp_tab_active', '1');
          fetchProfile(session.user.id);

        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          fetchProfile(session.user.id);

        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          if (isMounted.current) { setUser(null); setLoading(false); }
        }
      }
    );

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, [fetchProfile]);

  const handleLogout = async () => {
    signingOut.current = true;
    setUser(null);
    localStorage.clear();
    sessionStorage.clear();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      signingOut.current = false;
      if (isMounted.current) setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary/20 border-t-primary"></div>
          <div className="absolute font-black text-xs text-primary">HP</div>
        </div>
        <p className="mt-4 text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse">
          Loading your experience
        </p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />

        <Route element={<Layout user={user} onLogout={handleLogout} />}>
          {user?.role === 'patient' ? (
            <>
              <Route path="/dashboard" element={<Dashboard profile={user} />} />
              <Route
                path="/profile"
                element={
                  <ProfilePage
                    profile={user}
                    onProfileUpdate={() => user && fetchProfile(user.id)}
                  />
                }
              />
              <Route path="/food-log" element={<FoodLog profile={user} />} />
              <Route path="/meal-plans" element={<MealPlans profile={user} />} />
              <Route path="/monitoring" element={<HealthMonitoring profile={user} />} />
            </>
          ) : user?.role === 'dietitian' ? (
            <>
              <Route path="/dietitian/dashboard" element={<DieticianDashboard />} />
              <Route path="/dietitian/notes" element={<DieticianNotes />} />
              <Route path="/dietitian/assign" element={<AssignMealPlan profile={user} />} />
              <Route path="/dietitian/progress" element={<ProgressReport />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
          <Route path="/settings" element={<Settings profile={user} onLogout={handleLogout} />} />
        </Route>

        <Route
          path="/"
          element={
            user ? (
              <Navigate to={user.role === 'dietitian' ? '/dietitian/dashboard' : '/dashboard'} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
