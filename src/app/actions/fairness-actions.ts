'use server';

import { supabase } from '@/lib/supabase';

type FairnessRow = {
  doctor_id: string;
  total_day_shifts?: number | null;
  holiday_count?: number | null;
  doctor?: {
    full_name?: string | null;
    group_type?: string | null;
    night_debt?: { total_night_shifts_year?: number | null }[] | { total_night_shifts_year?: number | null } | null;
  } | null;
  [key: string]: unknown;
};

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

  return (data || [])
    .map((row: FairnessRow) => {
      const nightDebt = Array.isArray(row.doctor?.night_debt)
        ? row.doctor.night_debt[0]
        : row.doctor?.night_debt;
      const totalDayShifts = Number(row.total_day_shifts || 0);
      const totalNightShifts = Number(nightDebt?.total_night_shifts_year || 0);
      const holidayShifts = Number(row.holiday_count || 0);

      return {
        ...row,
        total_day_shifts: totalDayShifts,
        total_night_shifts: totalNightShifts,
        holiday_shifts: holidayShifts,
        total_shifts: totalDayShifts + totalNightShifts,
      };
    })
    .sort((a, b) => b.total_shifts - a.total_shifts);
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
