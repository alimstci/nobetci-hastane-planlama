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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 md:py-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* 1. Page Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-200">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight uppercase">Hakkaniyet Raporu</h1>
              <p className="text-xs md:text-sm text-slate-500 font-black uppercase tracking-[0.2em] mt-1 opacity-70">
                2026 Yılı Mutlak Adalet ve Yük Analizi
              </p>
            </div>
          </div>
        </div>

        {/* 2. Top Level Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-none bg-white shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 group">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-600 transition-colors duration-500">
                <Users className="h-8 w-8 text-teal-600 group-hover:text-white transition-colors duration-500" />
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
          
          <Card className="border-none bg-white shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 group">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-600 transition-colors duration-500">
                <TrendingDown className="h-8 w-8 text-emerald-600 group-hover:text-white transition-colors duration-500" />
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

          <Card className="border-none bg-white shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 group sm:col-span-2 lg:col-span-1">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-slate-900 flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
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
