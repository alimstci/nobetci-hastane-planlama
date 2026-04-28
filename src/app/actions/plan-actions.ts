'use server';

import { supabase } from '@/lib/supabase';
import { Scheduler } from '@/lib/scheduler';
import { revalidatePath } from 'next/cache';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { isWeekendOrTurkishHoliday } from '@/lib/holidays';
import { Doctor } from '@/lib/supabase';

function isWeekendOrHoliday(date: string) {
  return isWeekendOrTurkishHoliday(new Date(`${date}T00:00:00`));
}

function isAdjacentOrSameDay(left: string, right: string) {
  const leftTime = new Date(`${left}T00:00:00`).getTime();
  const rightTime = new Date(`${right}T00:00:00`).getTime();
  const dayDiff = Math.abs(Math.round((leftTime - rightTime) / (24 * 60 * 60 * 1000)));
  return dayDiff <= 1;
}

async function recalculateStats(year: number, planId?: string) {
  const { error } = await supabase.rpc('recalculate_plan_stats', { p_year: year });
  if (!error) return;
  if (!planId) throw new Error(error.message);

  const { error: fallbackError } = await supabase.rpc('recalculate_plan_stats', { p_plan_id: planId });
  if (fallbackError) throw new Error(error.message);
}

async function ensureNightDebtRows(doctors: { id: string }[]) {
  if (doctors.length === 0) return;

  const { error } = await supabase
    .from('night_debt')
    .upsert(
      doctors.map(doctor => ({ doctor_id: doctor.id })),
      { onConflict: 'doctor_id', ignoreDuplicates: true }
    );

  if (error) throw new Error(error.message);
}

export async function getMonthlyPlans(year: number) {
  const { data: plans, error } = await supabase
    .from('monthly_plans')
    .select(`
      *,
      shift_assignments(count)
    `)
    .like('year_month', `${year}-%`)
    .order('year_month', { ascending: true });

  if (error) throw error;
  
  return plans.map(p => ({
    ...p,
    shiftCount: p.shift_assignments?.[0]?.count || 0
  }));
}

export async function getPlan(yearMonth: string) {
  // 1. Get or Create the plan record
  const planResult = await supabase
    .from('monthly_plans')
    .select('*')
    .eq('year_month', yearMonth)
    .maybeSingle();
  let plan = planResult.data;
  const planError = planResult.error;

  if (planError) throw new Error(planError.message);

  if (!plan) {
    // Plan doesn't exist, create it
    const { data: newPlan, error: createError } = await supabase
      .from('monthly_plans')
      .insert([{ year_month: yearMonth, status: 'draft' }])
      .select()
      .maybeSingle();
    
    if (createError) throw new Error(createError.message);
    plan = newPlan;
  }

  // 2. Get assignments for this plan
  const { data: assignments, error: assignError } = await supabase
    .from('shift_assignments')
    .select('*, doctor:doctors!doctor_id(*)')
    .eq('plan_id', plan.id);

  if (assignError) throw new Error(assignError.message);

  // 3. Get all active doctors
  const { data: doctors, error: doctorError } = await supabase
    .from('doctors')
    .select('*, ekuri_pairs!ekuri_pair_id(*)')
    .eq('is_active', true);

  if (doctorError) throw new Error(doctorError.message);

  // 4. Get leaves for this month
  const [year, month] = yearMonth.split('-').map(Number);
  const startDate = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');

  const { data: leaves, error: leaveError } = await supabase
    .from('doctor_leaves')
    .select('*, doctor:doctors(full_name)')
    .lte('start_date', endDate)
    .gte('end_date', startDate);

  if (leaveError) throw new Error(leaveError.message);

  const previousMonthStart = format(startOfMonth(new Date(year, month - 2)), 'yyyy-MM-dd');
  const previousMonthEnd = format(endOfMonth(new Date(year, month - 2)), 'yyyy-MM-dd');
  const { data: previousAssignments, error: previousError } = await supabase
    .from('shift_assignments')
    .select('doctor_id, date, shift_type')
    .gte('date', previousMonthStart)
    .lte('date', previousMonthEnd);

  if (previousError) throw new Error(previousError.message);

  return { plan, assignments, doctors, leaves, previousAssignments };
}

export async function generateAutoPlan(yearMonth: string) {
  console.log('--- Otomatik Planlama Başlatıldı:', yearMonth);
  const [year, month] = yearMonth.split('-').map(Number);
  
  // 1. Fetch all necessary data for scheduler
  const { data: doctors } = await supabase.from('doctors').select('*').eq('is_active', true);
  const { data: fairnessStats } = await supabase.from('yearly_fairness').select('*').eq('year', year);
  const { data: leaves } = await supabase.from('doctor_leaves').select('*');
  
  // Get plan ID
  const { data: plan } = await supabase.from('monthly_plans').select('id').eq('year_month', yearMonth).maybeSingle();

  console.log(`Veri Durumu: ${doctors?.length || 0} doktor, Plan ID: ${plan?.id}`);

  if (!doctors || doctors.length === 0) throw new Error('Sistemde aktif doktor bulunamadı.');
  if (!plan) throw new Error('İlgili ay için plan kaydı bulunamadı.');

  const { data: neighboringAssignments, error: neighboringError } = await supabase
    .from('shift_assignments')
    .select('doctor_id, date, shift_type')
    .neq('plan_id', plan.id);

  if (neighboringError) throw new Error(neighboringError.message);

  await ensureNightDebtRows(doctors);
  const { data: nightDebts, error: nightDebtError } = await supabase.from('night_debt').select('*');
  if (nightDebtError) throw new Error(nightDebtError.message);

  const scheduler = new Scheduler({
    year,
    month,
    doctors: doctors as Doctor[],
    nightDebts: nightDebts || [],
    fairnessStats: fairnessStats || [],
    holidays: [], 
    leaves: leaves || [],
    externalAssignments: neighboringAssignments || []
  });

  const assignments = scheduler.generatePlan(plan.id);
  console.log(`Algoritma Tamamlandı: ${assignments.length} nöbet ataması üretildi.`);

  if (assignments.length === 0) {
    throw new Error('Algoritma hiçbir nöbet ataması üretemedi. Kısıtlamaları (eküri, peş peşe yasağı vb.) kontrol edin.');
  }

  // 2. Clear old assignments (trigger çalışmaz - DELETE'de trigger yok)
  console.log('Eski nöbetler temizleniyor...');
  const boundaryConflict = assignments.find(assignment =>
    neighboringAssignments?.some(existing =>
      existing.doctor_id === assignment.doctor_id && isAdjacentOrSameDay(existing.date, assignment.date)
    )
  );

  if (boundaryConflict) {
    const doctor = doctors.find(d => d.id === boundaryConflict.doctor_id);
    throw new Error(`${doctor?.full_name || boundaryConflict.doctor_id} için mevcut planlarla peş peşe nöbet çakışması oluşuyor.`);
  }

  await supabase.from('shift_assignments').delete().eq('plan_id', plan.id);
  
  // 3. Insert new assignments (trigger çalışır - INSERT'de trigger var)
  console.log('Yeni nöbetler kaydediliyor...');
  const { error: insertError } = await supabase
    .from('shift_assignments')
    .insert(assignments);

  if (insertError) {
    console.error('Insert Hatası:', insertError.message);
    throw new Error(insertError.message);
  }

  // 4. Recalculate statistics (en sağlıklı yöntem)
  console.log('İstatistikler yeniden hesaplanıyor...');
  await recalculateStats(year, plan.id);

  console.log('--- Plan Başarıyla Oluşturuldu ve İstatistikler Hesaplandı! ---');
  revalidatePath(`/admin/plans/${yearMonth}`);
}

export async function simulateYearlyPlan(year: number) {
  console.log(`--- ${year} Yılı İçin 12 Aylık Simülasyon Başlatıldı ---`);
  
  try {
    // 1. O yıla ait tüm eski datayı temizle (Temiz sayfa testi için)
    // Önce o yılın aylık planlarını bulalım
    const { data: plans } = await supabase
      .from('monthly_plans')
      .select('id')
      .like('year_month', `${year}-%`);

    if (plans && plans.length > 0) {
      const planIds = plans.map(p => p.id);
      await supabase.from('shift_assignments').delete().in('plan_id', planIds);
      await supabase.from('monthly_plans').delete().in('id', planIds);
    }

    await supabase
      .from('night_debt')
      .update({ debt_points: 0, last_night_month: null, total_night_shifts_year: 0 })
      .not('doctor_id', 'is', null);

    // 2. Ocak'tan Aralık'a kadar döngüye gir
    for (let month = 1; month <= 12; month++) {
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
      console.log(`Planlanıyor: ${yearMonth}...`);
      
      // Her ay için önce plan kaydını oluştur/al
      await getPlan(yearMonth); 
      
      // AutoPlan algoritmasını çalıştır
      await generateAutoPlan(yearMonth);
    }

    console.log('--- 12 Aylık Simülasyon Başarıyla Tamamlandı ---');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/fairness');
    return { success: true };
  } catch (error: unknown) {
    console.error('Simulation error:', error instanceof Error ? error.message : 'Simulasyon tamamlanamadi.');
    return { success: false, error: error instanceof Error ? error.message : 'Simulasyon tamamlanamadi.' };
  }
}

export async function updateShiftAssignment(assignmentId: string, doctorId: string, shiftType: 'gunduz' | 'gece') {
  const { data: currentAssignment, error: assignmentError } = await supabase
    .from('shift_assignments')
    .select('*, plan:monthly_plans(year_month)')
    .eq('id', assignmentId)
    .maybeSingle();

  if (assignmentError) throw new Error(assignmentError.message);
  if (!currentAssignment) throw new Error('Nöbet kaydı bulunamadı.');

  const { data: doctor, error: doctorError } = await supabase
    .from('doctors')
    .select('*')
    .eq('id', doctorId)
    .eq('is_active', true)
    .maybeSingle();

  if (doctorError) throw new Error(doctorError.message);
  if (!doctor) throw new Error('Aktif doktor bulunamadı.');

  const date = currentAssignment.date;
  const isHolidayShift = isWeekendOrHoliday(date);

  if (shiftType === 'gunduz') {
    if (doctor.group_type === 'night_only') {
      throw new Error('Sadece gece grubundaki doktor gündüz nöbetine yazılamaz.');
    }
    if (isHolidayShift && doctor.group_type !== 'weekend') {
      throw new Error('Hafta sonu ve tatil gündüz nöbetleri sadece hafta sonu grubuna yazılabilir.');
    }
    if (isHolidayShift && !doctor.ekuri_pair_id) {
      throw new Error('Hafta sonu grubu doktorunun eküri eşleşmesi olmalıdır.');
    }
    if (!isHolidayShift && doctor.group_type !== 'normal') {
      throw new Error('Hafta içi gündüz nöbetleri sadece normal gruba yazılabilir.');
    }
  }

  const { data: leaves, error: leaveError } = await supabase
    .from('doctor_leaves')
    .select('id')
    .eq('doctor_id', doctorId)
    .lte('start_date', date)
    .gte('end_date', date);

  if (leaveError) throw new Error(leaveError.message);
  if (leaves && leaves.length > 0) throw new Error('Doktor bu tarihte izinli.');

  const { data: conflicts, error: conflictError } = await supabase
    .from('shift_assignments')
    .select('id, date')
    .eq('doctor_id', doctorId)
    .neq('id', assignmentId);

  if (conflictError) throw new Error(conflictError.message);
  const conflict = conflicts?.find(shift => isAdjacentOrSameDay(shift.date, date));
  if (conflict) {
    throw new Error(`Peş peşe nöbet kuralı ihlal ediliyor: ${conflict.date} tarihli nöbet var.`);
  }

  const [year, month] = currentAssignment.plan.year_month.split('-').map(Number);
  const monthStart = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
  const { data: monthlyAssignments, error: monthlyError } = await supabase
    .from('shift_assignments')
    .select('id, shift_type')
    .eq('doctor_id', doctorId)
    .gte('date', monthStart)
    .lte('date', monthEnd)
    .neq('id', assignmentId);

  if (monthlyError) throw new Error(monthlyError.message);

  const sameMonthAssignments = monthlyAssignments || [];
  if (sameMonthAssignments.length >= 3) {
    throw new Error('Bu doktor bu ay maksimum 3 nobet sinirina ulasti.');
  }
  if (shiftType === 'gece' && sameMonthAssignments.some(shift => shift.shift_type === 'gece')) {
    throw new Error('Bir doktor ayni ay icinde ikinci gece nobetine yazilamaz.');
  }
  if (shiftType === 'gunduz' && doctor.group_type === 'normal') {
    const weekdayDayCount = sameMonthAssignments.filter(shift => shift.shift_type === 'gunduz').length;
    if (weekdayDayCount >= 2) {
      throw new Error('Hafta ici doktoru ayni ay icinde en fazla 2 gunduz nobeti tutabilir.');
    }
  }

  const { error: updateError } = await supabase
    .from('shift_assignments')
    .update({
      doctor_id: doctorId,
      shift_type: shiftType,
      is_ekuri: false,
      partner_id: null,
    })
    .eq('id', assignmentId);

  if (updateError) throw new Error(updateError.message);
  await recalculateStats(year, currentAssignment.plan_id);
  revalidatePath(`/admin/plans/${currentAssignment.plan.year_month}`);
  revalidatePath('/admin/fairness');
}
