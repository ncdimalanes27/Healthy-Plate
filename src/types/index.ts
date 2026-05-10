export type UserRole = 'patient' | 'dietitian';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  age?: number;
  gender?: 'Male' | 'Female';
  height?: number;
  weight?: number;
  activity_level?: string;
  health_conditions: string[];
  allergies: string[];
  goal?: 'Lose Weight' | 'Maintain' | 'Gain Weight';
  created_at: string;
}

export interface Food {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  serving_size: string;
  is_filipino: boolean;
}

export interface DailyLog {
  id: string;
  user_id: string;
  food_id?: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings?: number;
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  weight?: number;
  blood_sugar?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
}

export interface DieticianNote {
  id: string;
  dietitian_id: string;
  patient_id: string;
  content: string;
  category?: string;
  created_at: string;
  dietitian_name?: string;
}

export interface MealPlan {
  id: string;
  patient_id: string;
  dietitian_id?: string;
  name?: string;
  title?: string;
  description?: string;
  notes?: string;
  target_calories?: number;
  calories_target?: number;
  carbs_target?: number;
  protein_target?: number;
  fat_target?: number;
  days?: any[];
  status?: 'active' | 'archived';
  created_at: string;
  assigned_at?: string;
}

export interface FoodLogEntry {
  id: string;
  user_id: string;
  food_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings: number;
  logged_at: string;
  food?: Food;
}

export interface HealthMetric {
  id: string;
  user_id: string;
  type: 'weight' | 'blood_sugar' | 'blood_pressure';
  value_primary: number;
  value_secondary?: number;
  unit: string;
  recorded_at: string;
}
