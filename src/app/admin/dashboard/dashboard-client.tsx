'use client';

import { useState, useEffect, useMemo } from 'react';
import { KPICard } from '@/components/kpi-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from 'recharts';
import {
  Users,
  Calendar,
  TrendingUp,
  Activity,
  Plane,
  Clock,
  Play,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

import { simulateYearlyPlan } from '@/app/actions/plan-actions';
import { toast } from 'sonner';

interface DashboardClientProps {
  stats: any;
  monthlyTrend: any[];
  workloadDistribution: any[];
  upcomingLeaves: any[];
}

export function DashboardClient({
  stats,
  monthlyTrend,
  workloadDistribution,
  upcomingLeaves,
}: DashboardClientProps) {
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async () => {
    if (!confirm('2026 yılı için 12 aylık simülasyon başlatılacaktır. Mevcut veriler silinebilir. Emin misiniz?')) return;
    
    setIsSimulating(true);
    const toastId = toast.loading('1 Yıllık Simülasyon çalıştırılıyor...');
    
    try {
      const result = await simulateYearlyPlan(2026);
      if (!result.success) {
        throw new Error(result.error || 'Simülasyon tamamlanamadı.');
      }
      toast.success('Simülasyon tamamlandı! Veriler güncellendi.', { id: toastId });
    } catch (error: any) {
      toast.error('Hata: ' + error.message, { id: toastId });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-12 pb-12">
      
      {/* 1. Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-x-12 gap-y-6">
        <div className="space-y-3">
          <Badge variant="premium" className="px-3 py-1">
            <ShieldCheck className="h-3 w-3 mr-1.5" />
            Sistem Güvencesi: Aktif
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Operasyonel <span className="text-primary">Özet</span>
          </h1>
          <p className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            Hastane Nöbet Verimliliği ve Doktor Yük Dağılımı
          </p>
        </div>
        
        <Button 
          onClick={handleSimulate} 
          disabled={isSimulating}
          variant="premium"
          size="lg"
          className="h-14 px-10"
        >
          {isSimulating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              SİMÜLASYON ÇALIŞIYOR...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4 fill-current" />
              1 YILLIK NÖBET SİMÜLE ET (2026)
            </>
          )}
        </Button>
      </div>

      {/* 2. KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="TOPLAM DOKTOR" value={stats.totalDoctors} icon={<Users className="h-7 w-7" />} color="primary" subtitle="UZMAN" trend={2} />
        <KPICard title="BU AY NÖBETLER" value={stats.thisMonthShifts} icon={<Calendar className="h-7 w-7" />} color="success" subtitle="ATAMA" trend={12} />
        <KPICard title="ORTALAMA ADALET" value={`%${stats.averageFairnessScore}`} icon={<Activity className="h-7 w-7" />} color="warning" subtitle="SKOR" trend={0.5} />
        <KPICard title="AKTİF İZİNLER" value={upcomingLeaves.length} icon={<Plane className="h-7 w-7" />} color="danger" subtitle="PERSONEL" />
      </div>

      {/* 3. Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Monthly Trend Area Chart */}
        <Card className="lg:col-span-3 border-none shadow-2xl overflow-hidden relative group">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardDescription>Yıllık Nöbet Yükü</CardDescription>
                <CardTitle>Trend Analizi</CardTitle>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardHeader>
          
          <div className="px-4 pb-8 h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="colorShifts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                  dy={10} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: 'none', 
                    borderRadius: '16px', 
                    color: '#fff',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                  }} 
                  itemStyle={{ color: '#fff', fontWeight: 900, fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="shifts" 
                  stroke="#0d9488" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorShifts)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Workload Bar Chart */}
        <Card className="lg:col-span-2 border-none shadow-2xl overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardDescription>Yük Dağılımı</CardDescription>
                <CardTitle>Departman Limitleri</CardTitle>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                <Activity className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardHeader>

          <div className="px-6 pb-8 h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadDistribution} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#475569' }} width={80} />
                <Tooltip cursor={{fill: 'rgba(13, 148, 136, 0.05)'}} />
                <Bar dataKey="shifts" radius={[0, 10, 10, 0]} barSize={24} animationDuration={1500}>
                  {workloadDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#0d9488" : "#4f46e5"} fillOpacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 4. Activity & Leaves Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Activity */}
        <Card className="border-none shadow-2xl overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-900/50 dark:bg-black/20">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center shadow-xl shadow-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-0.5">
                <CardTitle>Son Operasyonlar</CardTitle>
                <CardDescription>Sistem Atama Günlüğü</CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="p-4 space-y-2 max-h-[460px] overflow-y-auto custom-scrollbar">
            {stats.recentActivity?.length > 0 ? (
              stats.recentActivity.map((activity: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all group border border-transparent hover:border-primary/20">
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary/20 group-hover:text-primary transition-all shadow-inner">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate tracking-tight">{activity.doctor?.full_name}</p>
                      <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{activity.shift_type === 'gece' ? '🌙 Gece Nöbeti' : '☀️ Gündüz Mesaisi'}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                </div>
              ))
            ) : (
              <div className="text-center py-20 opacity-60">
                <Clock className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Kayıt Bulunamadı</p>
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Leaves */}
        <Card className="border-none shadow-2xl overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-900/50 dark:bg-black/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shadow-xl shadow-amber-500/10">
                  <Plane className="h-6 w-6 text-amber-600" />
                </div>
                <div className="space-y-0.5">
                  <CardTitle>Muafiyet & İzinler</CardTitle>
                  <CardDescription>Gelecek 30 Gün Planı</CardDescription>
                </div>
              </div>
              <Badge variant="outline">MUAFİYET</Badge>
            </div>
          </CardHeader>
          <div className="p-4 space-y-2 max-h-[460px] overflow-y-auto custom-scrollbar">
            {upcomingLeaves?.length > 0 ? (
              upcomingLeaves.map((leave: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all group border border-transparent hover:border-amber-500/20">
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-500/5 flex items-center justify-center text-amber-600 shadow-inner">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate tracking-tight">{leave.doctor?.full_name}</p>
                      <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-500 uppercase tracking-wide">{format(parseISO(leave.start_date), 'dd MMMM', { locale: tr })} Başlangıç</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide leading-none mb-1">Durum</p>
                    <Badge variant="outline" className="text-[9px] border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">BEKLEMEDE</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 opacity-60">
                <Plane className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Aktif Muafiyet Yok</p>
              </div>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}
