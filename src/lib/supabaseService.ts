import { supabase } from './supabase';
import type { Profile, DailyLog, Food, DieticianNote, MealPlan, HealthMetric } from '../types';

export const supabaseService = {

  // --- Profile Operations ---
  async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return { data: data as Profile, error: null };
    } catch (error: any) {
      console.error('Error in getProfile:', error.message);
      return { data: null, error };
    }
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return { data: data as Profile, error: null };
    } catch (error: any) {
      console.error('Error in updateProfile:', error.message);
      return { data: null, error };
    }
  },

  // --- Food Operations ---
  async getFoods() {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return { data: data as Food[], error: null };
    } catch (error: any) {
      console.error('Error in getFoods:', error.message);
      return { data: [], error };
    }
  },

  // --- Daily Log Operations ---
  async getTodayLog(userId: string, date: string) {
    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*, foods(*)')
        .eq('user_id', userId)
        .eq('date', date)
        .order('id', { ascending: false });
      if (error) throw error;
      return { data: data as any[], error: null };
    } catch (error: any) {
      console.error('Error in getTodayLog:', error.message);
      return { data: [], error };
    }
  },

  async upsertDailyLog(log: Partial<DailyLog>) {
    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .upsert(log, { onConflict: 'user_id, date' })
        .select();
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error in upsertDailyLog:', error.message);
      return { data: null, error };
    }
  },

  async deleteLogEntry(id: string) {
    try {
      const { error } = await supabase.from('daily_logs').delete().eq('id', id);
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Error in deleteLogEntry:', error.message);
      return { error };
    }
  },

  // --- Health Metrics ---
  async addHealthMetric(metric: Partial<HealthMetric>) {
    try {
      const { data, error } = await supabase
        .from('health_metrics')
        .insert([metric])
        .select();
      if (error) throw error;
      return { data: data as HealthMetric[], error: null };
    } catch (error: any) {
      console.error('Error in addHealthMetric:', error.message);
      return { data: null, error };
    }
  },

  async getHealthMetrics(userId: string, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return { data: data as HealthMetric[], error: null };
    } catch (error: any) {
      console.error('Error in getHealthMetrics:', error.message);
      return { data: [], error };
    }
  },

  // --- Patient Notes ---
  async getPatientNotes(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('dietician_notes')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return { data: data as DieticianNote[], error: null };
    } catch (error: any) {
      console.error('Error in getPatientNotes:', error.message);
      return { data: [], error };
    }
  },

  // --- Dietitian Operations ---
  async getAllPatients() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient')
        .order('name', { ascending: true });
      if (error) throw error;
      return { data: data as Profile[], error: null };
    } catch (error: any) {
      console.error('Error in getAllPatients:', error.message);
      return { data: [], error };
    }
  },

  async sendNote(note: Partial<DieticianNote>) {
    try {
      const { data, error } = await supabase
        .from('dietician_notes')
        .insert([note])
        .select();
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error in sendNote:', error.message);
      return { data: null, error };
    }
  },

  async getDietitianSentNotes(dietitianId: string) {
    try {
      const { data, error } = await supabase
        .from('dietician_notes')
        .select('*')
        .eq('dietitian_id', dietitianId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return { data: data as DieticianNote[], error: null };
    } catch (error: any) {
      console.error('Error in getDietitianSentNotes:', error.message);
      return { data: [], error };
    }
  },

  // --- Meal Plan Operations ---
  async getMealPlan(userId: string) {
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('patient_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return { data: data as MealPlan, error: null };
    } catch (error: any) {
      console.error('Error in getMealPlan:', error.message);
      return { data: null, error };
    }
  },

  async assignMealPlan(plan: Partial<MealPlan>) {
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .insert([plan])
        .select();
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error in assignMealPlan:', error.message);
      return { data: null, error };
    }
  },
};
