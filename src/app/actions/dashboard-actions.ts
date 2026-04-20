'use server';

import { supabase } from '@/lib/supabase';

export async function getDashboardStats() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const yearMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  try {
    // 1. Total doctors
    const { data: doctors, error: doctorError } = await supabase
      .from('doctors')
      .select('id')
      .eq('is_active', true);

    if (doctorError) throw doctorError;

    // 2. Get plan ID for this month
    const { data: plan, error: planError } = await supabase
      .from('monthly_plans')
      .select('id')
      .eq('year_month', yearMonth)
      .maybeSingle();

    if (planError) throw planError;

    // 3. This month's shifts
    let shiftsCount = 0;
    if (plan) {
      const { data: shifts, error: shiftsError } = await supabase
        .from('shift_assignments')
        .select('id')
        .eq('plan_id', plan.id);

      if (shiftsError) throw shiftsError;
      shiftsCount = shifts?.length || 0;
    }

    // 4. Average fairness score
    const { data: fairness, error: fairnessError } = await supabase
      .from('yearly_fairness')
      .select('total_day_shifts')
      .eq('year', currentYear);

    if (fairnessError) throw fairnessError;

    const avgFairness = fairness && fairness.length > 0
      ? Math.round((fairness.reduce((sum, f) => sum + f.total_day_shifts, 0) / fairness.length) * 10) / 10
      : 0;

    // 5. Pending leaves
    const today = new Date();
    const { data: leaves, error: leavesError } = await supabase
      .from('doctor_leaves')
      .select('id')
      .gte('end_date', today.toISOString().split('T')[0]);

    if (leavesError) throw leavesError;

    // 6. Recent activity
    const { data: recentShifts, error: recentError } = await supabase
      .from('shift_assignments')
      .select('*, doctor:doctors!doctor_id(full_name), plan:monthly_plans(year_month)')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    return {
      totalDoctors: doctors?.length || 0,
      thisMonthShifts: shiftsCount,
      averageFairnessScore: avgFairness,
      pendingLeaves: leaves?.length || 0,
      recentActivity: recentShifts || [],
    };
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return {
      totalDoctors: 0,
      thisMonthShifts: 0,
      averageFairnessScore: 0,
      pendingLeaves: 0,
      recentActivity: [],
    };
  }
}

export async function getMonthlyTrend(months: number = 6) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  try {
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      let month = currentMonth - i;
      let year = currentYear;

      if (month <= 0) {
        month += 12;
        year -= 1;
      }

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

      data.push({
        month: yearMonth,
        shifts: shiftsCount,
      });
    }

    return data;
  } catch (error) {
    console.error('Monthly trend error:', error);
    return [];
  }
}

export async function getDoctorWorkloadDistribution() {
  const currentYear = new Date().getFullYear();

  try {
    const { data: fairness, error } = await supabase
      .from('yearly_fairness')
      .select('*, doctor:doctors!doctor_id(full_name)')
      .eq('year', currentYear)
      .order('total_day_shifts', { ascending: false })
      .limit(10);

    if (error) throw error;

    return fairness?.map(f => ({
      name: f.doctor?.full_name || 'Unknown',
      shifts: f.total_day_shifts,
    })) || [];
  } catch (error) {
    console.error('Workload distribution error:', error);
    return [];
  }
}

export async function getUpcomingLeaves(days: number = 30) {
  try {
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    const { data: leaves, error } = await supabase
      .from('doctor_leaves')
      .select('*, doctor:doctors(full_name)')
      .gte('start_date', today.toISOString().split('T')[0])
      .lte('start_date', futureDate.toISOString().split('T')[0])
      .order('start_date', { ascending: true })
      .limit(10);

    if (error) throw error;

    return leaves || [];
  } catch (error) {
    console.error('Upcoming leaves error:', error);
    return [];
  }
}
