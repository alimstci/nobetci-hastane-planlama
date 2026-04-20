'use client';

import { useState } from 'react';
import { deleteLeave } from '@/app/actions/leave-actions';
import { ManageLeavesDialog } from '@/components/manage-leaves-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Trash2, Search, Plane, ShieldAlert, History, Sparkles } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function LeavesPageClient({ 
  initialDoctors, 
  initialLeaves 
}: { 
  initialDoctors: any[], 
  initialLeaves: any[] 
}) {
  const [search, setSearch] = useState('');
  
  const filteredDoctors = initialDoctors?.filter(d => 
    d.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <Badge variant="premium" className="mb-2">
            <Plane className="h-3 w-3 mr-1" />
            Muafiyet Sistemi: Aktif
          </Badge>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none text-gradient">
            İzin <span className="text-primary italic">Yönetimi</span>
          </h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest opacity-60">
            Personel Muafiyetleri ve Zamanlanmış İzin Takibi
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar: Quick Search and Add */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex flex-col gap-6">
             <div className="flex items-center justify-between px-1">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hızlı Atama</h2>
             </div>
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
                <Input 
                  placeholder="PERSONEL ARA..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-14 bg-white/50 dark:bg-white/5 border-none shadow-xl rounded-2xl text-[11px] font-black tracking-widest placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                />
             </div>
             <Card className="overflow-hidden border-none shadow-2xl">
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-white/5">
                    <AnimatePresence mode="popLayout">
                      {filteredDoctors?.map(doctor => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          key={doctor.id} 
                          className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase tracking-tighter">{doctor.full_name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{doctor.group_type === 'normal' ? 'Normal' : 'H.Sonu'}</p>
                          </div>
                          <ManageLeavesDialog 
                            doctorId={doctor.id} 
                            doctorName={doctor.full_name} 
                            trigger={
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9 px-4 text-[9px] font-black uppercase tracking-widest"
                              >
                                SEÇ
                              </Button>
                            }
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {filteredDoctors?.length === 0 && (
                      <div className="py-12 text-center">
                         <Search className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sonuç Yok</p>
                      </div>
                    )}
                  </div>
                </CardContent>
             </Card>
          </div>
        </div>

        {/* Main Content: Leaves List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between px-1">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                Aktif Muafiyetler <Badge variant="secondary" className="px-2 h-4">{initialLeaves?.length}</Badge>
             </h2>
             <Button variant="ghost" size="sm" className="h-9 font-black uppercase tracking-widest text-[9px]">
                <History className="h-4 w-4 mr-2" /> Geçmiş
             </Button>
          </div>

          <Card className="overflow-hidden border-none shadow-2xl">
             <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-900 p-8">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="font-black text-[10px] text-white/50 uppercase tracking-[0.2em] py-8 px-10">Personel</TableHead>
                      <TableHead className="font-black text-[10px] text-white/50 uppercase tracking-[0.2em] text-center">Tarih Aralığı</TableHead>
                      <TableHead className="font-black text-[10px] text-white/50 uppercase tracking-[0.2em] text-center">Durum Metriği</TableHead>
                      <TableHead className="font-black text-[10px] text-white/50 uppercase tracking-[0.2em] text-right px-10">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {initialLeaves?.map((leave) => {
                        const today = new Date();
                        const start = parseISO(leave.start_date);
                        const end = parseISO(leave.end_date);
                        const isActive = today >= start && today <= end;
                        const isFuture = today < start;

                        return (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key={leave.id} 
                            className="hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-50 dark:border-white/5 transition-all group"
                          >
                            <TableCell className="py-8 px-10">
                               <div className="flex items-center gap-5">
                                  <div className={cn(
                                     "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110",
                                     isActive ? "bg-primary text-white shadow-primary/20" : "bg-primary/10 text-primary"
                                  )}>
                                     <Plane className={cn("h-6 w-6", isActive && "animate-pulse")} />
                                  </div>
                                  <div>
                                     <p className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{leave.doctor?.full_name}</p>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{leave.doctor?.group_type === 'normal' ? 'Normal Kadro' : 'Hafta Sonu'}</p>
                                  </div>
                               </div>
                            </TableCell>
                            <TableCell className="text-center">
                               <div className="inline-flex flex-col items-center">
                                  <span className="text-[11px] font-black uppercase tracking-tighter text-slate-700 dark:text-slate-200">
                                     {format(start, 'dd MMM', { locale: tr })} - {format(end, 'dd MMM yyyy', { locale: tr })}
                                  </span>
                               </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant={isActive ? "premium" : isFuture ? "default" : "outline"}
                                className="text-[8px] px-3 h-6"
                              >
                                {isActive ? "MUAFİYET AKTİF" : isFuture ? "GELECEK KAYIT" : "GEÇMİŞ"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right px-10">
                               <form action={async () => { await deleteLeave(leave.id); }}>
                                 <Button 
                                   type="submit"
                                   variant="ghost" 
                                   size="icon" 
                                   className="h-10 w-10 rounded-full text-rose-500 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                 >
                                   <Trash2 className="h-4 w-4" />
                                 </Button>
                               </form>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                    {(!initialLeaves || initialLeaves.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-24">
                          <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="space-y-4"
                          >
                            <div className="h-20 w-20 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-200 mx-auto">
                              <ShieldAlert className="h-10 w-10" />
                            </div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Sistemde Kayıtlı Veri Yok</p>
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
             </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
