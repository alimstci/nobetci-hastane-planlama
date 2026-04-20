const { createClient } = require('@supabase/supabase-js');
const { 
  addDays, 
  eachDayOfInterval, 
  endOfMonth, 
  format, 
  getDay, 
  isSameDay, 
  parseISO, 
  startOfMonth 
} = require('date-fns');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class BackgroundScheduler {
  constructor(input) {
    this.input = input;
    this.assignments = [];
    this.doctorMap = new Map(input.doctors.map(d => [d.id, d]));
    this.debtMap = new Map(input.nightDebts.map(d => [d.doctor_id, d]));
    this.fairnessMap = new Map(input.fairnessStats.map(f => [f.doctor_id, f]));
    this.holidaysSet = new Set(input.holidays);

    // Yıllık Hafıza (Kümülatif Yük)
    this.localStats = new Map(input.doctors.map(d => {
      const stats = this.fairnessMap.get(d.id);
      return [d.id, { 
        total_day: stats?.total_day_shifts || 0, 
        holiday: stats?.holiday_count || 0 
      }];
    }));
  }

  isHoliday(date) {
    const TURKISH_HOLIDAYS_2026 = [
      '2026-01-01',
      '2026-03-19', '2026-03-20', '2026-03-21', '2026-03-22', 
      '2026-04-23',
      '2026-05-01',
      '2026-05-19',
      '2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30',
      '2026-07-15',
      '2026-08-30',
      '2026-10-28', '2026-10-29'
    ];
    const day = getDay(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    return day === 0 || day === 6 || TURKISH_HOLIDAYS_2026.includes(dateStr);
  }

  isDoctorAvailable(doctorId, date) {
    const forbiddenDates = [addDays(date, -1), date, addDays(date, 1)];
    const hasConsecutive = this.assignments.some(a => 
      a.doctor_id === doctorId && 
      forbiddenDates.some(fd => isSameDay(parseISO(a.date), fd))
    );
    return !hasConsecutive;
  }

  shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  addAssignment(planId, date, doctorId, isEkuri, partnerId, isHoliday) {
    this.assignments.push({ plan_id: planId, date, shift_type: 'gunduz', doctor_id: doctorId, is_ekuri: isEkuri, partner_id: partnerId });
    const stats = this.localStats.get(doctorId);
    if (stats) {
      stats.total_day++;
      if (isHoliday) stats.holiday++;
    }
  }

  generatePlan(planId) {
    const startDate = startOfMonth(new Date(this.input.year, this.input.month - 1));
    const endDate = endOfMonth(startDate);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    this.assignNightShifts(days, planId);
    this.assignWeekendDayShifts(days, planId);
    this.assignWeekdayDayShifts(days, planId);
    return this.assignments;
  }

  assignNightShifts(days, planId) {
    // ADALET GÜNCELLEMESİ: Tüm doktorlar (73-77 kişi) gece nöbetine dahil edildi.
    const allDoctors = this.input.doctors; 
    const usedInMonth = new Set(); // "Ayda max 1 gece" kuralı
    for (const day of days) {
      const candidates = this.shuffle([...allDoctors]).sort((a, b) => {
        const debtA = this.debtMap.get(a.id)?.debt_points || 0;
        const debtB = this.debtMap.get(b.id)?.debt_points || 0;
        if (debtA !== debtB) return debtB - debtA;
        return (this.debtMap.get(a.id)?.last_night_month || '').localeCompare(this.debtMap.get(b.id)?.last_night_month || '');
      });
      const bestDoctor = candidates.find(d => !usedInMonth.has(d.id) && this.isDoctorAvailable(d.id, day));
      if (bestDoctor) {
        this.assignments.push({ plan_id: planId, date: format(day, 'yyyy-MM-dd'), shift_type: 'gece', doctor_id: bestDoctor.id, is_ekuri: false });
        usedInMonth.add(bestDoctor.id);
      }
    }
  }

  assignWeekendDayShifts(days, planId) {
    const weekendDoctors = this.input.doctors.filter(d => d.group_type === 'weekend');
    for (const day of days) {
      if (!this.isHoliday(day)) continue;
      const candidates = this.shuffle([...weekendDoctors]).sort((a, b) => {
        const statsA = this.localStats.get(a.id)?.holiday || 0;
        const statsB = this.localStats.get(b.id)?.holiday || 0;
        return statsA - statsB;
      });
      let selectedCount = 0;
      for (const doctor of candidates) {
        if (selectedCount >= 2) break;
        if (this.isDoctorAvailable(doctor.id, day)) {
            this.addAssignment(planId, format(day, 'yyyy-MM-dd'), doctor.id, false, null, true);
            selectedCount++;
        }
      }
    }
  }

  assignWeekdayDayShifts(days, planId) {
    const normalDoctors = this.input.doctors.filter(d => d.group_type === 'normal');
    for (const day of days) {
      if (this.isHoliday(day)) continue;
      const candidates = this.shuffle([...normalDoctors]).sort((a, b) => {
        const statsA = this.localStats.get(a.id)?.total_day || 0;
        const statsB = this.localStats.get(b.id)?.total_day || 0;
        return statsA - statsB;
      });
      let selectedCount = 0;
      for (const doctor of candidates) {
        if (selectedCount >= 3) break;
        if (this.isDoctorAvailable(doctor.id, day)) {
            this.addAssignment(planId, format(day, 'yyyy-MM-dd'), doctor.id, false, null, false);
            selectedCount++;
        }
      }
    }
  }
}

async function main() {
  const year = 2026;
  console.log(`--- ${year} Yılı ANALİTİK HAFIZALI SİMÜLASYON Başladı ---`);
  const { data: plans } = await supabase.from('monthly_plans').select('id').like('year_month', `${year}-%`);
  if (plans && plans.length > 0) {
    const ids = plans.map(p => p.id);
    await supabase.from('shift_assignments').delete().in('plan_id', ids);
    await supabase.from('monthly_plans').delete().in('id', ids);
    // yearly_fairness'ı da temizleyelim ki hafıza sıfırlansın
    await supabase.from('yearly_fairness').delete().eq('year', year);
    console.log('Eski adaletsiz veriler ve istatistikler temizlendi.');
  }

  for (let month = 1; month <= 12; month++) {
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
    process.stdout.write(`Planlanıyor: ${yearMonth}... `);
    const { data: plan } = await supabase.from('monthly_plans').insert({ year_month: yearMonth }).select().single();
    const { data: doctors } = await supabase.from('doctors').select('*');
    const { data: debts } = await supabase.from('night_debt').select('*');
    
    // Her ay başında veritabanından en güncel YILLIK TOPLAM istatistiği çek
    const { data: fairness } = await supabase.from('yearly_fairness').select('*').eq('year', year);
    
    const scheduler = new BackgroundScheduler({ year, month, doctors, nightDebts: debts, fairnessStats: fairness || [], holidays: [] });
    const assignments = scheduler.generatePlan(plan.id);
    await supabase.from('shift_assignments').insert(assignments);
    
    // KRİTİK DÜZELTME: p_plan_id kullanarak kümülatif hesabı tetikle
    const { error: rpcError } = await supabase.rpc('recalculate_plan_stats', { p_plan_id: plan.id });
    if (rpcError) console.error('HATA:', rpcError.message);
    else console.log('Tamam.');
  }
  console.log('--- 12 Aylık TAM ADALETLİ Simülasyon Başarıyla Tamamlandı! ---');
}
main();
