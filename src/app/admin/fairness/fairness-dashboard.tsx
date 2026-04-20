'use client';

import { useState, useMemo, useEffect } from 'react';
import { getDoctorShiftHistory } from '@/app/actions/fairness-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  BarChart3, 
  Scale, 
  Info,
  Activity,
  History,
  LayoutGrid,
  List,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  stats: any[];
}

export default function FairnessDashboard({ stats }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredStats = useMemo(() => {
    return stats.filter(s => 
      s.doctor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stats, searchTerm]);

  const globalDayStats = useMemo(() => {
    const days = [
      { name: 'Pzt', key: 'monday', label: 'Pazartesi' },
      { name: 'Sal', key: 'tuesday', label: 'Salı' },
      { name: 'Çar', key: 'wednesday', label: 'Çarşamba' },
      { name: 'Per', key: 'thursday', label: 'Perşembe' },
      { name: 'Cum', key: 'friday', label: 'Cuma' },
    ];

    return days.map(d => ({
      name: d.name,
      label: d.label,
      value: stats.reduce((sum, s) => sum + (s[d.key] || 0), 0)
    }));
  }, [stats]);

  const maxGlobalValue = Math.max(...globalDayStats.map(d => d.value), 1);

  return (
    <div className="space-y-10">
      
      {/* 1. Header Area Layer */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <Badge variant="premium" className="mb-2">
            <Sparkles className="h-3 w-3 mr-1" />
            Adalet Denetimi: Aktif
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Hakkaniyet <span className="text-primary">Raporu</span>
          </h1>
          <p className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            2026 Mutlak Adalet ve Yük Dengesi
          </p>
        </div>
      </div>

      {/* 2. Global System Balance Panel */}
      <Card className="overflow-hidden border-none shadow-2xl">
        <CardHeader className="bg-slate-900/50 dark:bg-black/20 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                  <BarChart3 className="h-6 w-6 text-white" />
               </div>
               <div className="space-y-0.5">
                  <CardTitle>Genel Planlama Dengesi</CardTitle>
                  <CardDescription>Hafta İçi Toplam Atama Hacmi</CardDescription>
               </div>
            </div>
            <Badge variant="outline" className="hidden lg:flex">Canlı Veri</Badge>
          </div>
        </CardHeader>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-3 h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={globalDayStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: 'rgba(20, 184, 166, 0.05)'}} 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '16px', color: '#fff', backdropFilter: 'blur(10px)' }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={50}>
                  {globalDayStats.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.value > maxGlobalValue * 0.95 ? "url(#primaryGradient)" : "url(#accentGradient)"} 
                    />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="accentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
             <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
                <div className="flex items-center gap-3 text-primary mb-3">
                  <Info className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Algoritma Güvencesi</span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed dark:text-slate-400">
                  Sistem, nöbetleri atarken sadece toplam sayıya değil, **gün bazlı varyansa** da bakar. İdeal bir sistemde barların boyları birbirine yakındır.
                </p>
             </div>
             <div className="grid grid-cols-5 gap-2 px-2">
                {globalDayStats.map(d => (
                  <div key={d.name} className="text-center group">
                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1 group-hover:text-primary transition-colors">{d.name}</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{d.value}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </Card>

      {/* 3. Search & Layout Toggle Area */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative group w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
          <Input 
            placeholder="DOKTOR İSMİ İLE ARA..." 
            className="pl-12 h-14 bg-white/50 dark:bg-white/5 border-none shadow-xl rounded-2xl text-sm font-black tracking-widest placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex glass-card p-1 rounded-2xl gap-1 shadow-xl">
          <button 
            onClick={() => setViewMode('grid')}
            className={cn(
              "h-10 px-4 rounded-xl transition-all flex items-center gap-2",
              viewMode === 'grid' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="text-[9px] font-bold uppercase tracking-widest hidden md:inline">Grid</span>
          </button>
          <button 
            onClick={() => setViewMode('table')}
            className={cn(
              "h-10 px-4 rounded-xl transition-all flex items-center gap-2",
              viewMode === 'table' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
            )}
          >
            <List className="h-4 w-4" />
            <span className="text-[9px] font-bold uppercase tracking-widest hidden md:inline">Liste</span>
          </button>
        </div>
      </div>

      {/* 4. Doctor Cards / Detail View Layer */}
      <div className={cn(
        "grid gap-6",
        viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
      )}>
        <AnimatePresence mode="popLayout">
          {filteredStats.map((row) => (
            <motion.div
              layout
              key={row.doctor_id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
            >
              <Card className={cn(
                "group relative overflow-hidden transition-all duration-500",
                expandedId === row.doctor_id ? "ring-2 ring-primary/40 shadow-primary/10" : "hover:shadow-2xl hover:-translate-y-1"
              )}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate group-hover:text-primary transition-colors">
                        {row.doctor?.full_name}
                      </h3>
                      <Badge variant="outline" className="mt-1.5 bg-slate-100/50 dark:bg-white/5 text-xs">
                        {row.doctor?.group_type === 'normal' ? 'Normal Kadro' : 'Hafta Sonu'}
                      </Badge>
                    </div>
                    <button 
                      onClick={() => setExpandedId(expandedId === row.doctor_id ? null : row.doctor_id)}
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all bg-slate-100/50 dark:bg-white/5 text-slate-400 hover:bg-primary hover:text-white hover:scale-110",
                        expandedId === row.doctor_id && "bg-primary text-white shadow-lg shadow-primary/20"
                      )}
                    >
                      {expandedId === row.doctor_id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Stat Summary Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50/50 dark:bg-white/5 rounded-2xl p-4 text-center group/stat">
                      <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1 group-hover/stat:text-primary transition-colors">Gece</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{row.total_night_shifts}</p>
                    </div>
                    <div className="bg-slate-50/50 dark:bg-white/5 rounded-2xl p-4 text-center group/stat">
                      <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1 group-hover/stat:text-primary transition-colors">Hafta Sonu</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{row.holiday_count}</p>
                    </div>
                    <div className="bg-primary/10 dark:bg-primary/20 rounded-2xl p-4 text-center">
                      <p className="text-[9px] font-bold text-primary uppercase tracking-wide mb-1">Toplam</p>
                      <p className="text-2xl font-black text-primary">{row.total_day_shifts + row.total_night_shifts}</p>
                    </div>
                  </div>

                  {/* Expansion Detail Area */}
                  <AnimatePresence>
                    {expandedId === row.doctor_id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 space-y-6">
                          <div className="flex items-center justify-center gap-3">
                             <Activity className="h-4 w-4 text-primary" />
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hafta İçi Profil Analizi</p>
                          </div>
                          
                          <div className="h-[220px] w-full flex items-center justify-center bg-slate-50/50 dark:bg-white/5 rounded-[2rem] overflow-hidden">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={[
                                { day: 'Pzt', val: row.monday },
                                { day: 'Sal', val: row.tuesday },
                                { day: 'Çar', val: row.wednesday },
                                { day: 'Per', val: row.thursday },
                                { day: 'Cum', val: row.friday },
                              ]}>
                                <PolarGrid stroke="rgba(148, 163, 184, 0.1)" />
                                <PolarAngleAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                                <Radar 
                                  name={row.doctor?.full_name} 
                                  dataKey="val" 
                                  stroke="var(--primary)" 
                                  fill="var(--primary)" 
                                  fillOpacity={0.5} 
                                />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="grid grid-cols-5 gap-2 px-2">
                            {[
                              { l: 'PZT', k: 'monday' },
                              { l: 'SAL', k: 'tuesday' },
                              { l: 'ÇAR', k: 'wednesday' },
                              { l: 'PER', k: 'thursday' },
                              { l: 'CUM', k: 'friday' }
                            ].map(day => (
                              <div key={day.k} className="text-center">
                                <p className={cn(
                                  "text-[8px] font-black tracking-widest uppercase transition-colors mb-1",
                                  row[day.k] > 0 ? "text-primary" : "text-slate-400"
                                )}>{day.l}</p>
                                <p className={cn(
                                  "text-sm font-black transition-colors",
                                  row[day.k] > 0 ? "text-slate-900 dark:text-white" : "text-slate-300 dark:text-slate-700"
                                )}>{row[day.k] || 0}</p>
                              </div>
                            ))}
                          </div>

                          {/* Detaylı Nöbet Listesi (Timeline) */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 px-4">
                              <History className="h-3 w-3 text-primary" />
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Yıllık Nöbet Takvimi</span>
                            </div>
                            
                            <div className="bg-slate-50/50 dark:bg-white/5 rounded-3xl p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                              <HistoryList doctorId={row.doctor_id} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State Layer */}
      {filteredStats.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24 glass-card border-none rounded-[3rem] bg-transparent"
        >
          <div className="h-24 w-24 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-slate-600 mx-auto mb-6 shadow-inner">
             <Search className="h-10 w-10" />
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Personel Kaydı Bulunamadı</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wide max-w-xs mx-auto mt-4">
            "{searchTerm}" kriterine uygun bir adalet verisi bulunmuyor.
          </p>
        </motion.div>
      )}
    </div>
  );
}

function HistoryList({ doctorId }: { doctorId: string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await getDoctorShiftHistory(doctorId, 2026);
        setHistory(data || []);
      } catch (error) {
        console.error('History fetch error:', error);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [doctorId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-slate-200/50 dark:bg-white/5 rounded-2xl w-full animate-pulse" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Henüz nöbet atanmadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((h) => {
        const date = new Date(h.date);
        const monthName = date.toLocaleDateString('tr-TR', { month: 'long' });
        const dayName = date.toLocaleDateString('tr-TR', { day: 'numeric', weekday: 'short' });
        
        return (
          <div key={h.id} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-white/5 shadow-sm border border-slate-100 dark:border-white/5 group/row hover:border-primary/30 transition-all hover:scale-[1.02]">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center text-[12px] font-black uppercase shadow-inner",
                h.shift_type === 'gece' ? "bg-slate-900 text-primary" : "bg-primary/10 text-primary"
              )}>
                {h.shift_type === 'gece' ? '🌙' : '☀️'}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase leading-none mb-1">{monthName}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight opacity-60">{dayName}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={h.shift_type === 'gece' ? 'secondary' : 'default'} className="text-[7px]">
                {h.shift_type === 'gece' ? 'GECE' : 'GÜNDÜZ'}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
