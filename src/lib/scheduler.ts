import { 
  addDays, 
  eachDayOfInterval, 
  endOfMonth, 
  format, 
  isSameDay, 
  parseISO, 
  startOfMonth 
} from 'date-fns';
import { Doctor, NightDebt, ShiftAssignment, YearlyFairness } from './supabase';
import { isWeekendOrTurkishHoliday } from './holidays';

export interface SchedulerInput {
  year: number;
  month: number;
  doctors: Doctor[];
  nightDebts: NightDebt[];
  fairnessStats: YearlyFairness[];
  holidays: string[]; // ISO date strings
  leaves: { doctor_id: string; start_date: string; end_date: string } [];
  externalAssignments?: Pick<ShiftAssignment, 'doctor_id' | 'date'>[];
}

export class Scheduler {
  private assignments: ShiftAssignment[] = [];
  private doctorMap: Map<string, Doctor>;
  private debtMap: Map<string, NightDebt>;
  private fairnessMap: Map<string, YearlyFairness>;
  private holidaysSet: Set<string>;
  
  // v2.2: Anlık yük takibi için yerel sayaçlar
  private localStats: Map<string, { total_day: number; holiday: number }>;

  constructor(private input: SchedulerInput) {
    this.doctorMap = new Map(input.doctors.map(d => [d.id, d]));
    this.debtMap = new Map(input.nightDebts.map(d => [d.doctor_id, d]));
    this.fairnessMap = new Map(input.fairnessStats.map(f => [f.doctor_id, f]));
    
    // 2026 Türkiye tatillerini ve inputtan gelenleri birleştir
    this.holidaysSet = new Set(input.holidays);

    // Başlangıç istatistiklerini kopyala
    this.localStats = new Map(input.doctors.map(d => {
      const stats = this.fairnessMap.get(d.id);
      return [d.id, { 
        total_day: stats?.total_day_shifts || 0, 
        holiday: stats?.holiday_count || 0 
      }];
    }));
  }

  public generatePlan(planId: string): ShiftAssignment[] {
    const startDate = startOfMonth(new Date(this.input.year, this.input.month - 1));
    const endDate = endOfMonth(startDate);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // 1. Gece Nöbetleri Dağıtımı (ADALET: Tüm grup dahil)
    this.assignNightShifts(days, planId);

    // 2. Gündüz Nöbetleri (Hafta Sonu + Tatil)
    this.assignWeekendDayShifts(days, planId);

    // 3. Gündüz Nöbetleri (Hafta İçi)
    this.assignWeekdayDayShifts(days, planId);

    this.validateRestRules();

    return this.assignments;
  }

  private isHoliday(date: Date): boolean {
    return isWeekendOrTurkishHoliday(date, [...this.holidaysSet]);
  }

  private isDoctorAvailable(doctorId: string, date: Date): boolean {
    const isLeave = this.input.leaves.some(l => 
      l.doctor_id === doctorId && 
      date >= parseISO(l.start_date) && 
      date <= parseISO(l.end_date)
    );
    if (isLeave) return false;

    // Peş peşe nöbet yasağı
    // Peş peşe nöbet yasağı ve AYNI GÜN yasağı
    const forbiddenDates = [addDays(date, -1), date, addDays(date, 1)];
    const allAssignments = [...this.assignments, ...(this.input.externalAssignments || [])];
    const hasConsecutive = allAssignments.some(a => 
      a.doctor_id === doctorId && 
      forbiddenDates.some(fd => isSameDay(parseISO(a.date), fd))
    );

    return !isLeave && !hasConsecutive;
  }

  // v2.2 Helper: Diziyi karıştır (Adalet için)
  private shuffle<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5);
  }

  private assignNightShifts(days: Date[], planId: string) {
    // ADALET GÜNCELLEMESİ: Gece nöbeti havuzu TÜM doktorlar (73 kişi) oldu.
    const allDoctors = this.input.doctors; 
    const usedInMonth = new Set<string>(); // "Her doktor ayda max 1 gece nöbeti tutabilir" kuralını sağlar.

    for (const day of days) {
      const dateStr = format(day, 'yyyy-MM-dd');
      
      // Borç puanına ve son nöbet ayına göre sırala + Eşitlik durumunda KARIŞTIR
      const candidates = this.shuffle([...allDoctors])
        .sort((a, b) => {
          const debtA = this.debtMap.get(a.id)?.debt_points || 0;
          const debtB = this.debtMap.get(b.id)?.debt_points || 0;
          if (debtA !== debtB) return debtB - debtA;
          return (this.debtMap.get(a.id)?.last_night_month || '').localeCompare(
            this.debtMap.get(b.id)?.last_night_month || ''
          );
        });

      const bestDoctor = candidates.find(d => 
        !usedInMonth.has(d.id) && 
        this.isDoctorAvailable(d.id, day)
      );

      if (bestDoctor) {
        this.assignments.push({
          plan_id: planId,
          date: dateStr,
          shift_type: 'gece',
          doctor_id: bestDoctor.id,
          is_ekuri: false
        });
        usedInMonth.add(bestDoctor.id);
      }
    }
  }

  private assignWeekendDayShifts(days: Date[], planId: string) {
    const weekendDoctors = this.input.doctors.filter(d => d.group_type === 'weekend' && this.findPartnerId(d));

    for (const day of days) {
      if (!this.isHoliday(day)) continue;

      const dateStr = format(day, 'yyyy-MM-dd');
      const selectedForDay: string[] = [];

      // Borç puanına (Kümülatif Tatil) + KARIŞTIR
      const candidates = this.shuffle([...weekendDoctors])
        .sort((a, b) => {
          const statsA = this.localStats.get(a.id)?.holiday || 0;
          const statsB = this.localStats.get(b.id)?.holiday || 0;
          return statsA - statsB;
        });

      for (const doctor of candidates) {
        if (selectedForDay.length >= 2) break;
        if (selectedForDay.includes(doctor.id)) continue;
        if (!this.isDoctorAvailable(doctor.id, day)) continue;

        const partnerId = doctor.ekuri_pair_id ? this.findPartnerId(doctor) : null;
        const canTakePartner = partnerId && this.isDoctorAvailable(partnerId, day) && selectedForDay.length === 0;

        this.addAssignment(planId, dateStr, doctor.id, !!canTakePartner, partnerId, true);
        selectedForDay.push(doctor.id);

        if (canTakePartner && partnerId) {
          this.addAssignment(planId, dateStr, partnerId, true, doctor.id, true);
          selectedForDay.push(partnerId);
        }
      }
    }
  }

  private assignWeekdayDayShifts(days: Date[], planId: string) {
    const normalDoctors = this.input.doctors.filter(d => d.group_type === 'normal');

    for (const day of days) {
      if (this.isHoliday(day)) continue;

      const dateStr = format(day, 'yyyy-MM-dd');
      const selectedForDay: string[] = [];

      // Gün dengesine (Kümülatif Toplam) + KARIŞTIR
      const candidates = this.shuffle([...normalDoctors])
        .sort((a, b) => {
          const statsA = this.localStats.get(a.id)?.total_day || 0;
          const statsB = this.localStats.get(b.id)?.total_day || 0;
          return statsA - statsB;
        });

      for (const doctor of candidates) {
        if (selectedForDay.length >= 3) break;
        if (selectedForDay.includes(doctor.id)) continue;
        if (!this.isDoctorAvailable(doctor.id, day)) continue;

        const partnerId = doctor.ekuri_pair_id ? this.findPartnerId(doctor) : null;
        const canTakePartner = partnerId && 
                               this.isDoctorAvailable(partnerId, day) && 
                               selectedForDay.length <= 1 && 
                               !selectedForDay.includes(partnerId!);

        this.addAssignment(planId, dateStr, doctor.id, !!canTakePartner, partnerId, false);
        selectedForDay.push(doctor.id);

        if (canTakePartner && partnerId) {
          this.addAssignment(planId, dateStr, partnerId, true, doctor.id, false);
          selectedForDay.push(partnerId);
        }
      }
    }
  }

  // v2.2 Helper: Atama yaparken yerel sayaçları güncelle
  private addAssignment(planId: string, date: string, doctorId: string, isEkuri: boolean, partnerId: string | null, isHoliday: boolean) {
    this.assignments.push({
      plan_id: planId,
      date,
      shift_type: 'gunduz',
      doctor_id: doctorId,
      is_ekuri: isEkuri,
      partner_id: partnerId
    });

    // Yerel istatistikleri GÜNCELLE (Anlık adalet)
    const stats = this.localStats.get(doctorId);
    if (stats) {
      stats.total_day++;
      if (isHoliday) stats.holiday++;
    }
  }

  private findPartnerId(doctor: Doctor): string | null {
    if (!doctor.ekuri_pair_id) return null;
    const partner = this.input.doctors.find(d => 
      d.ekuri_pair_id === doctor.ekuri_pair_id && d.id !== doctor.id
    );
    return partner ? partner.id : null;
  }

  private validateRestRules() {
    const byDoctor = new Map<string, ShiftAssignment[]>();

    for (const assignment of this.assignments) {
      const doctorAssignments = byDoctor.get(assignment.doctor_id) || [];
      doctorAssignments.push(assignment);
      byDoctor.set(assignment.doctor_id, doctorAssignments);
    }

    for (const [doctorId, assignments] of byDoctor) {
      const sorted = assignments.sort((a, b) => a.date.localeCompare(b.date));

      for (let i = 1; i < sorted.length; i++) {
        const previous = parseISO(sorted[i - 1].date);
        const current = parseISO(sorted[i].date);
        const dayDiff = Math.round((current.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000));

        if (dayDiff <= 1) {
          const doctorName = this.doctorMap.get(doctorId)?.full_name || doctorId;
          throw new Error(`${doctorName} için peş peşe nöbet ihlali oluştu: ${sorted[i - 1].date} ve ${sorted[i].date}`);
        }
      }
    }
  }
}
