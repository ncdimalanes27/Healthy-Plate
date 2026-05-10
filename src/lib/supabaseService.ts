import { supabase } from './supabase';
import type { Profile, DailyLog, Food } from '../types';

export const supabaseService = {
  // Profile Operations
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data: data as Profile, error };
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    return { data, error };
  },

  // Food Operations
  async getFoods() {
    const { data, error } = await supabase.from('foods').select('*');
    return { data: data as Food[], error };
  },

  // Logging Operations
  async getTodayLog(userId: string, date: string) {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();
    return { data: data as DailyLog, error };
  },

  async upsertDailyLog(log: Partial<DailyLog>) {
    const { data, error } = await supabase
      .from('daily_logs')
      .upsert(log, { onConflict: 'user_id, date' });
    return { data, error };
  },

  // Dietitian Operations
  async getAllPatients() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'patient');
    return { data: data as Profile[], error };
  },

  async sendNote(note: any) {
    const { data, error } = await supabase
      .from('dietician_notes')
      .insert(note);
    return { data, error };
  }
};