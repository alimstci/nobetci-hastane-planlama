'use server';

import { supabase } from '@/lib/supabase';

export async function getAnalyticsData(year: number, month?: number) {
  try {
    // 1. Day of week distribution
    const { data: fairness, error: fairnessError } = await supabase
      .from('yearly_fairness')
      .select('*')
      .eq('year', year);

    if (fairnessError) throw fairnessError;

    const dayDistribution = {
      monday: fairness?.reduce((sum, f) => sum + f.monday, 0) || 0,
      tuesday: fairness?.reduce((sum, f) => sum + f.tuesday, 0) || 0,
      wednesday: fairness?.reduce((sum, f) => sum + f.wednesday, 0) || 0,
      thursday: fairness?.reduce((sum, f) => sum + f.thursday, 0) || 0,
      friday: fairness?.reduce((sum, f) => sum + f.friday, 0) || 0,
      saturday: fairness?.reduce((sum, f) => sum + f.saturday, 0) || 0,
      sunday: fairness?.reduce((sum, f) => sum + f.sunday, 0) || 0,
    };

    // 2. Doctor workload
    const { data: doctorWorkload, error: workloadError } = await supabase
      .from('yearly_fairness')
      .select('*, doctor:doctors(full_name)')
      .eq('year', year)
      .order('total_day_shifts', { ascending: false })
      .limit(15);

    if (workloadError) throw workloadError;

    // 3. Night shift distribution
    const { data: nightDebts, error: nightError } = await supabase
      .from('night_debt')
      .select('*, doctor:doctors(full_name)')
      .order('total_night_shifts_year', { ascending: false })
      .limit(15);

    if (nightError) throw nightError;

    // 4. Holiday distribution
    const { data: holidays, error: holidayError } = await supabase
      .from('yearly_fairness')
      .select('*, doctor:doctors(full_name)')
      .eq('year', year)
      .order('holiday_count', { ascending: false })
      .limit(10);

    if (holidayError) throw holidayError;

    return {
      dayDistribution,
      doctorWorkload: doctorWorkload || [],
      nightShifts: nightDebts || [],
      holidays: holidays || [],
    };
  } catch (error) {
    console.error('Analytics data error:', error);
    return {
      dayDistribution: {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
      },
      doctorWorkload: [],
      nightShifts: [],
      holidays: [],
    };
  }
}

export async function getMonthlyAnalytics(year: number) {
  try {
    const months = [];

    for (let month = 1; month <= 12; month++) {
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`;

      const { data: plan, error: planError } = await supabase
        .from('monthly_plans')
        .select('id')
        .eq('year_month', yearMonth)
        .maybeSingle();

      if (planError) throw planError;

      let shiftsCount = 0;
      if (plan) {
        const { data: shifts, error: shiftsError } = await supabase
          .from('shift_assignments')
          .select('id')
          .eq('plan_id', plan.id);

        if (shiftsError) throw shiftsError;
        shiftsCount = shifts?.length || 0;
      }

      months.push({
        month: yearMonth,
        shifts: shiftsCount,
      });
    }

    return months;
  } catch (error) {
    console.error('Monthly analytics error:', error);
    return [];
  }
}
