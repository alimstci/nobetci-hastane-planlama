'use client';

import { useState, useMemo } from 'react';
import { deleteEkuriPair } from '@/app/actions/doctor-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Unlink, 
  ShieldCheck, 
  MoreHorizontal,
  Search,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface ManageEkuriDialogProps {
  doctors: any[];
}

export function ManageEkuriDialog({ doctors }: ManageEkuriDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  // Benzersiz eküri çiftlerini hesapla
  const pairs = useMemo(() => {
    const pairMap = new Map();
    
    doctors.forEach(doc => {
      if (doc.ekuri_pair_id && doc.ekuri_pairs) {
        if (!pairMap.has(doc.ekuri_pair_id)) {
          pairMap.set(doc.ekuri_pair_id, doc.ekuri_pairs);
        }
      }
    });
    
    return Array.from(pairMap.values());
  }, [doctors]);

  const filteredPairs = pairs.filter(pair => 
    pair.doctor1.full_name.toLowerCase().includes(search.toLowerCase()) ||
    pair.doctor2.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleUnpair = async (pairId: string) => {
    setLoading(pairId);
    try {
      await deleteEkuriPair(pairId);
      toast.success('Eküri eşleşmesi başarıyla sonlandırıldı');
    } catch (error) {
      toast.error('İşlem sırasında bir hata oluştu');
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="font-semibold shadow-sm border-slate-200 dark:border-white/10">
            <Users className="mr-2 h-4 w-4 text-primary" /> Eküri Yönetimi
          </Button>
        }
      />
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-4 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
             </div>
             <div className="space-y-1">
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Eküri Birliktelikleri</DialogTitle>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest opacity-60">
                   Sistemde Tanımlı {pairs.length} Eşleşme Bulunuyor
                </p>
             </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="ESLEŞME ARA..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 bg-slate-50 dark:bg-white/5 border-none rounded-xl text-[10px] font-black tracking-widest outline-none"
            />
          </div>

          <div className="space-y-3">
            {filteredPairs.map((pair) => (
              <div 
                key={pair.id} 
                className="group p-5 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-primary/20 hover:bg-slate-50/50 dark:hover:bg-white/10 transition-all flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-6">
                  {/* Doctor 1 */}
                  <div className="text-right space-y-1 max-w-[140px]">
                    <p className="text-[11px] font-black uppercase truncate tracking-tighter text-slate-900 dark:text-white">
                       {pair.doctor1.full_name}
                    </p>
                    <Badge variant="outline" className="text-[7px] py-0">PARTNER A</Badge>
                  </div>

                  {/* Icon */}
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full border-2 border-slate-100 dark:border-white/10 flex items-center justify-center bg-white dark:bg-slate-900 z-10 group-hover:scale-110 transition-transform">
                       <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-px bg-slate-100 dark:border-white/10 -z-10" />
                  </div>

                  {/* Doctor 2 */}
                  <div className="text-left space-y-1 max-w-[140px]">
                    <p className="text-[11px] font-black uppercase truncate tracking-tighter text-slate-900 dark:text-white">
                       {pair.doctor2.full_name}
                    </p>
                    <Badge variant="outline" className="text-[7px] py-0">PARTNER B</Badge>
                  </div>
                </div>

                <Button 
                   onClick={() => handleUnpair(pair.id)}
                   disabled={loading === pair.id}
                   variant="outline" 
                   size="sm"
                   className="h-10 px-4 rounded-xl text-rose-600 border-rose-100 hover:bg-rose-50 hover:border-rose-200 transition-all gap-2"
                >
                  <Unlink className="h-3.5 w-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none">Ayır</span>
                </Button>
              </div>
            ))}

            {filteredPairs.length === 0 && (
              <div className="py-16 text-center space-y-4">
                <div className="h-16 w-16 rounded-3xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 mx-auto">
                  <MoreHorizontal className="h-8 w-8" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Herhangi Bir Eşleşme Bulunamadı</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10">
           <p className="text-[10px] font-medium text-slate-500 italic leading-relaxed text-center">
             * Eküri ayırma işlemi mevcut nöbetleri etkilemez; sadece gelecekteki otomatik planlamalarda doktorların bağımsız atanmasını sağlar.
           </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
