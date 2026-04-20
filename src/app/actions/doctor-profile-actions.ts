'use server';

import { supabase } from '@/lib/supabase';

export async function getDoctorProfile(doctorId: string) {
  try {
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('*, ekuri_pairs!ekuri_pair_id(*)')
      .eq('id', doctorId)
      .maybeSingle();

    if (doctorError) throw doctorError;
    if (!doctor) throw new Error('Doktor bulunamadı');

    return doctor;
  } catch (error) {
    console.error('Get doctor profile error:', error);
    throw error;
  }
}

export async function getDoctorStats(doctorId: string, year: number) {
  try {
    const { data: fairness, error: fairnessError } = await supabase
      .from('yearly_fairness')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('year', year)
      .maybeSingle();

    if (fairnessError) throw fairnessError;

    const { data: nightDebt, error: debtError } = await supabase
      .from('night_debt')
      .select('*')
      .eq('doctor_id', doctorId)
      .maybeSingle();

    if (debtError) throw debtError;

    return {
      fairness: fairness || {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
        holiday_count: 0,
        total_day_shifts: 0,
      },
      nightDebt: nightDebt || {
        debt_points: 0,
        last_night_month: null,
        total_night_shifts_year: 0,
      },
    };
  } catch (error) {
    console.error('Get doctor stats error:', error);
    throw error;
  }
}

export async function getDoctorShiftHistory(doctorId: string, limit: number = 20) {
  try {
    const { data: shifts, error } = await supabase
      .from('shift_assignments')
      .select('*, plan:monthly_plans(year_month), doctor:doctors!doctor_id(full_name)')
      .eq('doctor_id', doctorId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return shifts || [];
  } catch (error) {
    console.error('Get doctor shift history error:', error);
    throw error;
  }
}

export async function getDoctorLeaveHistory(doctorId: string) {
  try {
    const { data: leaves, error } = await supabase
      .from('doctor_leaves')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('start_date', { ascending: false });

    if (error) throw error;

    return leaves || [];
  } catch (error) {
    console.error('Get doctor leave history error:', error);
    throw error;
  }
}

export async function getEkuriPartner(ekuriPairId: string, currentDoctorId: string) {
  try {
    const { data: pair, error: pairError } = await supabase
      .from('ekuri_pairs')
      .select('*, doctor1:doctors!doctor1_id(*), doctor2:doctors!doctor2_id(*)')
      .eq('id', ekuriPairId)
      .maybeSingle();

    if (pairError) throw pairError;

    if (!pair) return null;

    // Return the other doctor
    const partner = pair.doctor1.id === currentDoctorId ? pair.doctor2 : pair.doctor1;
    return partner;
  } catch (error) {
    console.error('Get ekuri partner error:', error);
    throw error;
  }
}
