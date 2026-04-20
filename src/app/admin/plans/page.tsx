import { getMonthlyPlans } from '@/app/actions/plan-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronRight, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

export default async function PlansPage() {
  const currentYear = 2026; 
  const plans = await getMonthlyPlans(currentYear);

  return (
    <div className="space-y-10">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <Badge variant="premium" className="mb-2">
            <Calendar className="h-3 w-3 mr-1" />
            Planlama Takvimi: {currentYear}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Nöbet <span className="text-primary">Planları</span>
          </h1>
          <p className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            2026 Yılı 12 Aylık Operasyonel Takvim Listesi
          </p>
        </div>
      </div>

      {/* 2. Month Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const date = parseISO(`${plan.year_month}-01`);
          const monthName = format(date, 'MMMM', { locale: tr });
          const year = format(date, 'yyyy');
          const isPlanned = plan.shiftCount > 0;

          return (
            <Link key={plan.id} href={`/admin/plans/${plan.year_month}`} className="block group">
              <Card className="relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-none">
                {/* Visual Accent */}
                {isPlanned && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/20 transition-all" />
                )}
                
                <CardHeader className="p-6 pb-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{monthName}</CardTitle>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{year}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide leading-none">Plan Durumu</p>
                      <div className="flex items-center gap-2">
                        {isPlanned ? (
                          <Badge variant="premium" className="text-[9px] px-2 h-5">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Aktif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] px-2 h-5 text-slate-600 dark:text-slate-400">
                            <Clock className="h-3 w-3 mr-1" /> Taslak
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide leading-none">Atamalar</p>
                      <p className="text-3xl font-black text-slate-900 dark:text-white leading-none mt-2">{plan.shiftCount}</p>
                    </div>
                  </div>
                  
                  <div className="pt-2 flex items-center text-xs font-bold text-primary uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                    Planı İncele <ChevronRight className="h-4 w-4 ml-1.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
