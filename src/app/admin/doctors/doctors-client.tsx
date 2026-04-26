'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  UserPlus, 
  Users, 
  ShieldCheck, 
  Stethoscope, 
  MapPin, 
  Calendar, 
  Trash2,
  ChevronRight,
  Activity,
  History,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddDoctorDialog } from '@/components/add-doctor-dialog';
import { PairDoctorDialog } from '@/components/pair-doctor-dialog';
import { ManageLeavesDialog } from '@/components/manage-leaves-dialog';
import { ManageEkuriDialog } from '@/components/manage-ekuri-dialog';
import { EditDoctorDialog } from '@/components/edit-doctor-dialog';
import { deleteDoctor, getDetailedDoctorStats, setDoctorActive } from '@/app/actions/doctor-actions';
import { toast } from 'sonner';

interface Props {
  initialDoctors: any[];
}

export function DoctorsClient({ initialDoctors }: Props) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialDoctors?.[0]?.id || null);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    
    async function fetchStats() {
      setLoadingStats(true);
      try {
        // TypeScript narrowing for selectedId
        if (!selectedId) return;
        const data = await getDetailedDoctorStats(selectedId);
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoadingStats(false);
      }
    }
    
    fetchStats();
  }, [selectedId]);

  const filteredDoctors = useMemo(() => {
    return initialDoctors?.filter(d => 
      d.full_name?.toLowerCase().includes(search.toLowerCase())
    ) || [];
  }, [initialDoctors, search]);

  const selectedDoctor = useMemo(() => {
    return initialDoctors?.find(d => d.id === selectedId) || null;
  }, [initialDoctors, selectedId]);

  const groupLabel = (groupType: string) => {
    if (groupType === 'normal') return 'Hafta İçi';
    if (groupType === 'weekend') return 'Hafta Sonu';
    return 'Sadece Gece';
  };

  const handleToggleActive = async () => {
    if (!selectedDoctor) return;
    try {
      await setDoctorActive(selectedDoctor.id, !selectedDoctor.is_active);
      toast.success(selectedDoctor.is_active ? 'Doktor pasifleştirildi' : 'Doktor aktif edildi');
    } catch (error: any) {
      toast.error(error?.message || 'Durum güncellenemedi');
    }
  };

  const handleDeleteDoctor = async () => {
    if (!selectedDoctor) return;
    const confirmed = window.confirm(`${selectedDoctor.full_name} kalıcı olarak silinsin mi? Geçmiş nöbet kayıtları da etkilenebilir.`);
    if (!confirmed) return;

    try {
      await deleteDoctor(selectedDoctor.id);
      toast.success('Doktor silindi');
      setSelectedId(null);
    } catch (error: any) {
      toast.error(error?.message || 'Doktor silinemedi');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-6rem)] gap-6">
      
      {/* LEFT COLUMN: Search and List */}
      <div className="lg:w-[380px] flex flex-col gap-6">
        <div className="space-y-4 px-1">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-3xl font-black text-gradient uppercase tracking-tighter">
              Personel
            </h2>
            <div className="flex items-center gap-2">
              <ManageEkuriDialog doctors={initialDoctors} />
              <AddDoctorDialog />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] opacity-60">
            Sistemde {initialDoctors?.length} Kayıtlı Personel
          </p>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
          <Input 
            placeholder="İSİMLE ARA..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-11 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm rounded-md text-[11px] font-bold tracking-wide placeholder:text-slate-400 focus:ring-2 focus:ring-primary/10 outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {filteredDoctors.map((doc) => (
              <motion.button
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key={doc.id}
                onClick={() => setSelectedId(doc.id)}
                className={cn(
                  "w-full text-left p-3 rounded-md transition-colors border flex items-center gap-3 group relative overflow-hidden",
                  selectedId === doc.id 
                    ? "bg-slate-900 border-primary text-white" 
                    : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 shadow-sm"
                )}
              >
                {selectedId === doc.id && (
                  <motion.div 
                    layoutId="active-bg"
                    className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" 
                  />
                )}
                <div className={cn(
                  "h-9 w-9 rounded-md flex items-center justify-center shrink-0 transition-colors",
                  selectedId === doc.id ? "bg-primary text-white" : "bg-primary/10 text-primary"
                )}>
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 z-10">
                  <p className={cn(
                    "font-black text-[12px] uppercase tracking-tighter truncate",
                    selectedId === doc.id ? "text-white" : "text-slate-900 dark:text-white"
                  )}>{doc.full_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={selectedId === doc.id ? "secondary" : "outline"} className="text-[7px]">
                      {doc.group_type === 'normal' && 'NORMAL'}
                      {doc.group_type === 'weekend' && 'H.SONU'}
                      {doc.group_type === 'night_only' && 'GECE'}
                    </Badge>
                    {doc.ekuri_pair_id && (
                      <ShieldCheck className={cn("h-3 w-3", selectedId === doc.id ? "text-primary" : "text-primary")} />
                    )}
                  </div>
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 shrink-0 transition-transform z-10",
                  selectedId === doc.id ? "text-primary translate-x-1" : "text-slate-300 opacity-0 group-hover:opacity-100"
                )} />
              </motion.button>
            ))}
          </AnimatePresence>
          {filteredDoctors.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300 mx-auto">
                <Search className="h-8 w-8" />
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Kayıt Bulunamadı</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Profile / Detail View */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {selectedDoctor ? (
            <motion.div 
              key={selectedDoctor.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full flex flex-col space-y-6"
            >
              {/* Header Card - Daha Kompakt */}
              <Card className="overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="h-20 bg-slate-900 relative overflow-hidden">
                  {/* Aura Pattern */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
                  
                  <div className="absolute -bottom-8 left-6 p-1 bg-background rounded-lg shadow-sm">
                    <div className="h-16 w-16 rounded-md bg-primary flex items-center justify-center text-white border-4 border-background">
                      <Stethoscope className="h-7 w-7" />
                    </div>
                  </div>
                  
                  <div className="absolute top-4 right-6 flex gap-2">
                     <PairDoctorDialog doctors={initialDoctors} />
                     <ManageLeavesDialog doctorId={selectedDoctor.id} doctorName={selectedDoctor.full_name} />
                  </div>
                </div>
                
                <CardContent className="pt-12 pb-5 px-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {selectedDoctor.full_name}
                        </h1>
                        <Badge variant="premium" className="h-6">
                          <Activity className="h-3 w-3 mr-1" />
                          {selectedDoctor.is_active ? 'AKTİF' : 'PASİF'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-primary" /> 
                          Ana Kampüs
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary" /> 
                          {new Date(selectedDoctor.created_at).toLocaleDateString('tr')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats Grid - Daha Kompakt */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Grup Türü</h4>
                      <p className="text-xl font-black text-slate-900 dark:text-white leading-none">
                        {groupLabel(selectedDoctor.group_type)}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Sistem rotasyon önceliği</p>
                </Card>

                    <div className="bg-white dark:bg-white/5 rounded-lg p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Eküri Durumu</h4>
                          <p className="text-xl font-black text-slate-900 dark:text-white leading-none">
                            {selectedDoctor.ekuri_pair_id ? 'Eşleşmiş' : 'Tekil'}
                          </p>
                        </div>
                      </div>
                      {selectedDoctor.ekuri_pairs ? (
                         <div className="space-y-2">
                           <Badge variant="premium" className="text-[9px] w-full justify-center py-1">
                             PARTNER: {selectedDoctor.ekuri_pairs.doctor1.id === selectedDoctor.id ? selectedDoctor.ekuri_pairs.doctor2.full_name : selectedDoctor.ekuri_pairs.doctor1.full_name}
                           </Badge>
                         </div>
                      ) : (
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Herhangi bir eşleşme tanımlanmamış</p>
                      )}
                    </div>

                <Card className="p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-9 w-9 rounded-md bg-primary text-white flex items-center justify-center">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Genel Sıralama</h4>
                      <p className="text-xl font-black text-slate-900 dark:text-white leading-none">
                        {stats ? 'Aktif' : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: stats ? "100%" : "0%" }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-primary rounded-full" 
                    />
                  </div>
                </Card>
              </div>

              {/* Bottom Content Area - Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border border-slate-200 dark:border-white/10 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Hızlı İşlemler</CardTitle>
                    <CardDescription className="text-xs">Doktor yönetimi</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-12"
                      render={<a href={`/admin/doctors/${selectedDoctor.id}`} />}
                      nativeButton={false}
                    >
                      <History className="h-4 w-4 mr-2" />
                      Detaylı Profil ve Geçmiş
                    </Button>
                    <ManageLeavesDialog 
                      doctorId={selectedDoctor.id} 
                      doctorName={selectedDoctor.full_name}
                    />
                    <EditDoctorDialog doctor={selectedDoctor} />
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-12"
                      onClick={handleToggleActive}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      {selectedDoctor.is_active ? 'Doktoru Pasifleştir' : 'Doktoru Aktif Et'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-12 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={handleDeleteDoctor}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Doktoru Sil
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-white/10 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">İstatistikler</CardTitle>
                    <CardDescription className="text-xs">2026 Yılı Özeti</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-transparent hover:border-primary/20 transition-all">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Toplam Nöbet</span>
                      <span className={cn("text-xl font-black text-slate-900 dark:text-white", loadingStats && "animate-pulse opacity-50")}>
                        {stats ? stats.total_day_shifts + stats.total_night_shifts : '0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-transparent hover:border-primary/20 transition-all">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Gece Nöbeti</span>
                      <span className={cn("text-xl font-black text-slate-900 dark:text-white", loadingStats && "animate-pulse opacity-50")}>
                        {stats ? stats.total_night_shifts : '0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-transparent hover:border-primary/20 transition-all">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Hafta Sonu Nöbeti</span>
                      <span className={cn("text-xl font-black text-slate-900 dark:text-white", loadingStats && "animate-pulse opacity-50")}>
                        {stats ? stats.holiday_count : '0'}
                      </span>
                    </div>
                    <Button 
                      variant="default" 
                      className="w-full mt-4"
                      render={<a href={`/admin/doctors/${selectedDoctor.id}`} />}
                      nativeButton={false}
                    >
                      Tüm İstatistikleri Gör
                    </Button>
                  </CardContent>
                </Card>
              </div>

            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center p-12 glass-card rounded-[3rem] border-dashed border-2 bg-transparent"
            >
              <div className="h-24 w-24 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300 mb-8 shadow-inner">
                <Users className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Personel Seçiniz</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest max-w-xs mt-4 opacity-60">
                Detayları, izinleri ve kümülatif yükü incelemek için soldaki listeden bir doktor seçin.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
