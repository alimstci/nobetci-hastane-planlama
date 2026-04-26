import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types based on the schema
export type GroupType = 'normal' | 'weekend' | 'night_only';
export type ShiftType = 'gunduz' | 'gece';
export type PlanStatus = 'draft' | 'published' | 'locked';

export interface Doctor {
  id: string;
  full_name: string;
  group_type: GroupType;
  ekuri_pair_id?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface NightDebt {
  doctor_id: string;
  debt_points: number;
  last_night_month: string | null;
  total_night_shifts_year: number;
}

export interface YearlyFairness {
  doctor_id: string;
  year: number;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  holiday_count: number;
  total_day_shifts: number;
}

export interface ShiftAssignment {
  id?: string;
  plan_id: string;
  date: string;
  shift_type: ShiftType;
  doctor_id: string;
  is_ekuri: boolean;
  partner_id?: string | null;
}
