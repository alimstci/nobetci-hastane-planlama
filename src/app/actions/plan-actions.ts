'use server';

import { supabase } from '@/lib/supabase';
import { Scheduler } from '@/lib/scheduler';
import { revalidatePath } from 'next/cache';
import { format, startOfMonth, endOfMonth } from 'date-fns';

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
  let { data: plan, error: planError } = await supabase
    .from('monthly_plans')
    .select('*')
    .eq('year_month', yearMonth)
    .maybeSingle();

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
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

  if (leaveError) throw new Error(leaveError.message);

  return { plan, assignments, doctors, leaves };
}

export async function generateAutoPlan(yearMonth: string) {
  console.log('--- Otomatik Planlama Başlatıldı:', yearMonth);
  const [year, month] = yearMonth.split('-').map(Number);
  
  // 1. Fetch all necessary data for scheduler
  const { data: doctors } = await supabase.from('doctors').select('*').eq('is_active', true);
  const { data: nightDebts } = await supabase.from('night_debt').select('*');
  const { data: fairnessStats } = await supabase.from('yearly_fairness').select('*').eq('year', year);
  const { data: leaves } = await supabase.from('doctor_leaves').select('*');
  
  // Get plan ID
  const { data: plan } = await supabase.from('monthly_plans').select('id').eq('year_month', yearMonth).maybeSingle();

  console.log(`Veri Durumu: ${doctors?.length || 0} doktor, Plan ID: ${plan?.id}`);

  if (!doctors || doctors.length === 0) throw new Error('Sistemde aktif doktor bulunamadı.');
  if (!plan) throw new Error('İlgili ay için plan kaydı bulunamadı.');

  const scheduler = new Scheduler({
    year,
    month,
    doctors: doctors as any,
    nightDebts: nightDebts || [],
    fairnessStats: fairnessStats || [],
    holidays: [], 
    leaves: leaves || []
  });

  const assignments = scheduler.generatePlan(plan.id);
  console.log(`Algoritma Tamamlandı: ${assignments.length} nöbet ataması üretildi.`);

  if (assignments.length === 0) {
    throw new Error('Algoritma hiçbir nöbet ataması üretemedi. Kısıtlamaları (eküri, peş peşe yasağı vb.) kontrol edin.');
  }

  // 2. Clear old assignments (trigger çalışmaz - DELETE'de trigger yok)
  console.log('Eski nöbetler temizleniyor...');
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
  const { error: recalcError } = await supabase.rpc('recalculate_plan_stats', {
    p_plan_id: plan.id
  });

  if (recalcError) {
    console.error('İstatistik Hesaplama Hatası:', recalcError.message);
    throw new Error(recalcError.message);
  }

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
  } catch (error: any) {
    console.error('Simülasyon Hatası:', error.message);
    throw new Error(error.message);
  }
}
