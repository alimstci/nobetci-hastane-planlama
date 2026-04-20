'use server';

import { supabase } from '@/lib/supabase';

export async function getFairnessStats(year: number) {
  const { data, error } = await supabase
    .from('yearly_fairness')
    .select(`
      *,
      doctor:doctors(
        *,
        night_debt(*)
      )
    `)
    .eq('year', year)
    .order('total_day_shifts', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getDoctorShiftHistory(doctorId: string, year: number) {
  const { data, error } = await supabase
    .from('shift_assignments')
    .select(`
      *,
      plan:monthly_plans(year_month)
    `)
    .eq('doctor_id', doctorId)
    .ilike('plan.year_month', `${year}-%`)
    .order('date', { ascending: true });

  if (error) throw error;
  return data;
}
