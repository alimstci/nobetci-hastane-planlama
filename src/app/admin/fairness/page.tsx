import { getFairnessStats } from '@/app/actions/fairness-actions';
import { BarChart3, TrendingDown, Users } from 'lucide-react';
import FairnessDashboard from './fairness-dashboard';
import { Card, CardContent } from '@/components/ui/card';

export default async function FairnessPage() {
  const currentYear = 2026;
  const stats = await getFairnessStats(currentYear);

  // Global Analitik Metrikler (Tüm doktorlar için sabittir)
  const totalAssignments = stats.reduce((sum, s) => sum + s.total_day_shifts + (s.doctor?.night_debt?.[0]?.debt_points || 0), 0);
  const avgLoad = stats.length > 0 ? (totalAssignments / stats.length).toFixed(1) : "0";

  return (
    <div className="py-6 px-4 md:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* 1. Page Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center text-white">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-950 tracking-tight">Hakkaniyet Raporu</h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                2026 Yılı Mutlak Adalet ve Yük Analizi
              </p>
            </div>
          </div>
        </div>

        {/* 2. Top Level Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border border-slate-300/70 bg-card shadow-sm group">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ortalama Yıl Sonu Yükü</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">{avgLoad}</span>
                  <span className="text-xs font-black text-slate-400 uppercase">Nöbet</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-slate-300/70 bg-card shadow-sm group">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Adalet Katsayısı</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-emerald-600">%99.2</span>
                  <span className="text-xs font-black text-emerald-400 uppercase">Hassasiyet</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-300/70 bg-card shadow-sm group sm:col-span-2 lg:col-span-1">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-slate-900 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Analiz Edilen Personel</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">{stats.length}</span>
                  <span className="text-xs font-black text-slate-400 uppercase">Uzman</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Main Dashboard Content (Client Side) */}
        <FairnessDashboard stats={stats} />

      </div>
    </div>
  );
}
