import { getPlan, generateAutoPlan } from '@/app/actions/plan-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MonthNavigator } from '@/components/month-navigator';
import { ExportActions } from '@/components/export-actions';
import { ShiftEditDialog } from '@/components/shift-edit-dialog';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  Users, 
  Plane,
  Info,
  CalendarCheck,
  ChevronRight,
  Stethoscope,
  Activity
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isWeekend, 
  getDay,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default async function PlanPage({ params }: { params: Promise<{ month: string }> }) {
  const { month: yearMonth } = await params; 
  const { plan, assignments, doctors, leaves } = await getPlan(yearMonth);
  
  const [year, month] = yearMonth.split('-').map(Number);
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(monthStart);
  
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const assignedDoctorIds = new Set(assignments?.map(a => a.doctor_id));
  const offDutyDoctors = doctors?.filter(d => !assignedDoctorIds.has(d.id)) || [];

  if (!plan) {
    return (
      <div className="py-20 text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="mx-auto h-24 w-24 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
          <CalendarIcon className="h-10 w-10 text-slate-300" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Plan Bulunamadı</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest opacity-60 max-w-sm mx-auto">
            {yearMonth} dönemine ait aktif bir organizasyon bulunmuyor.
          </p>
        </div>
        <div className="flex justify-center gap-4 pt-4">
          <Button variant="outline" className="h-12 px-8">LISTEYE DÖN</Button>
          <form action={generateAutoPlan.bind(null, yearMonth)}>
            <Button type="submit" variant="premium" className="h-12 px-10">
              <Sparkles className="mr-2 h-4 w-4" />
              PLANLAMAYI BAŞLAT
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Industrial Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-5 border-b border-slate-200 dark:border-white/10 pb-5">
        <div className="space-y-4 flex-1">
          <div className="space-y-3">
             <Badge variant="premium">
               <CalendarCheck className="h-3.5 w-3.5 mr-2" />
               Operasyonel Takvim
             </Badge>
             <h1 className="text-3xl font-black tracking-tight leading-none text-slate-950 dark:text-white">
               Mesai <span className="text-primary italic">Çizelgesi</span>
             </h1>
             <p className="text-sm font-bold text-slate-500 uppercase tracking-widest opacity-60">
               Kurumsal Nöbet ve Personel Organizasyonu
             </p>
          </div>
          <MonthNavigator currentMonth={yearMonth} />
        </div>
        
        <div className="flex flex-wrap items-end gap-4">
          <ExportActions assignments={assignments} monthName={format(monthStart, 'MMMM yyyy', { locale: tr })} />
          <form action={generateAutoPlan.bind(null, yearMonth)}>
            <Button 
              type="submit"
              variant="premium"
              size="lg"
              className="h-11 px-5"
            >
              <Sparkles className="mr-3 h-5 w-5" /> 
              OTOMATİK HESABI BAŞLAT
            </Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 2. Main Calendar - Premium Aurora Grid */}
        <div className="lg:col-span-9">
          <Card className="overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="grid grid-cols-7 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10">
              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
                <div key={d} className="text-center text-[10px] uppercase font-bold tracking-wide text-slate-600 dark:text-slate-300 py-3 px-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isCurrentMonth = format(day, 'yyyy-MM') === yearMonth;
                const dayAssignments = assignments?.filter(a => a.date === dateStr);
                const isWeekendDay = isWeekend(day);
                const dayLeaves = leaves?.filter(l => dateStr >= l.start_date && dateStr <= l.end_date);

                return (
                  <div 
                    key={dateStr} 
                    className={cn(
                      "min-h-[145px] border-r border-b border-slate-200 dark:border-white/10 flex flex-col",
                      isCurrentMonth ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900/50 opacity-40 pointer-events-none",
                      isWeekendDay && isCurrentMonth && "bg-slate-50 dark:bg-white/[0.03]"
                    )}
                  >
                    <div className={cn(
                      "p-3 text-right flex justify-between items-center",
                      isWeekendDay ? "text-rose-500" : "text-slate-400"
                    )}>
                      {isWeekendDay && <span className="text-[8px] font-black uppercase tracking-tighter opacity-50">Hafta Sonu</span>}
                      {!isWeekendDay && <span />}
                      <span className="font-black text-base tracking-tighter">{format(day, 'd')}</span>
                    </div>

                    <div className="p-2 space-y-1.5 flex-1 overflow-hidden">
                      {/* Night Shift - Cyber Dark Style */}
                      {dayAssignments?.filter(a => a.shift_type === 'gece').map(a => (
                        <div key={a.id} className="px-2 py-1.5 rounded-md bg-slate-900 text-[10px] font-bold text-white border border-slate-800 flex items-center gap-1.5 justify-between group cursor-default">
                          <span className="truncate uppercase tracking-tight">{a.doctor?.full_name}</span>
                          {a.id && <ShiftEditDialog assignment={a} doctors={doctors || []} />}
                          <Badge variant="premium" className="h-3 w-3 p-0 rounded-full shrink-0" />
                        </div>
                      ))}

                      {/* Day Shifts - Glassy Light Style */}
                      {dayAssignments?.filter(a => a.shift_type === 'gunduz').map(a => (
                        <div key={a.id} className="px-2 py-1.5 rounded-md bg-teal-50 dark:bg-white/5 border border-teal-100 dark:border-white/10 text-[10px] font-bold text-teal-800 dark:text-teal-200 flex items-center gap-1.5 justify-between group cursor-default overflow-hidden">
                          <span className="truncate uppercase tracking-tight">{a.doctor?.full_name}</span>
                          {a.id && <ShiftEditDialog assignment={a} doctors={doctors || []} />}
                          {a.is_ekuri && <Users className="h-3 w-3" />}
                        </div>
                      ))}

                      {dayLeaves && dayLeaves.length > 0 && (
                        <div className="mt-auto pt-2 space-y-1">
                          {dayLeaves.map(l => (
                            <div key={l.id} className="text-[8px] font-black uppercase text-amber-500 tracking-tighter truncate flex items-center gap-1 opacity-70">
                              <Plane className="h-2.5 w-2.5 shrink-0" />
                              {l.doctor?.full_name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* 3. Sidebar Statistics */}
        <div className="lg:col-span-3 space-y-8">
          <Card className="border border-slate-200 dark:border-white/10 shadow-sm p-5 space-y-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 text-primary mb-2">
                <Info className="h-5 w-5" />
                <h3 className="text-[10px] font-black uppercase tracking-widest leading-none">Dönem Özeti</h3>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Nöbet Verimliliği</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-gradient tracking-tighter">{assignments?.length || 0}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase">ATAMA</span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Personel Katılımı</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {assignedDoctorIds.size} / {doctors?.length || 0}
                </span>
                <span className="text-[10px] font-black text-primary uppercase">KATILIM</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mt-4 shadow-inner">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_10px_var(--primary)]" 
                  style={{ width: `${(assignedDoctorIds.size / (doctors?.length || 1)) * 100}%` }} 
                />
              </div>
            </div>

            <div className="bg-primary/5 rounded-lg p-5 border border-primary/10">
               <div className="flex items-center gap-3 text-primary mb-2">
                  <Activity className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Sistem Notu</span>
               </div>
               <p className="text-[11px] font-medium text-slate-500 italic leading-relaxed">
                 Tüm atamalar muafiyet kurallarını ve adalet puanlarını gözeterek yapılmıştır.
               </p>
            </div>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">PASİF KADRO</h3>
               <Badge variant="outline" className="px-2 h-5 text-[10px] font-black">{offDutyDoctors.length}</Badge>
            </div>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {offDutyDoctors.map(doctor => (
                <div key={doctor.id} className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-transparent hover:border-primary/20 hover:bg-white dark:hover:bg-white/10 transition-all flex items-center justify-between group shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-inner">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase truncate tracking-tighter">{doctor.full_name}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">{doctor.group_type}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                </div>
              ))}
              {offDutyDoctors.length === 0 && (
                <div className="text-center py-10 bg-slate-50 dark:bg-white/5 rounded-lg border-dashed border-2 stroke-slate-200">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Kadro Tam Katılım</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
