'use client';

import { useState } from 'react';
import { createEkuriPair } from '@/app/actions/doctor-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { Doctor } from '@/lib/supabase';

interface PairDoctorDialogProps {
  doctors: Doctor[];
}

export function PairDoctorDialog({ doctors }: PairDoctorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [doctor1, setDoctor1] = useState<string>('');
  const [doctor2, setDoctor2] = useState<string>('');

  // Sadece ekürisi olmayanları filtreleyebiliriz veya tümünü gösterip uyarı verebiliriz.
  // Burada temiz durması için ekürisiz olanları filtreliyoruz.
  const availableDoctors = doctors.filter(d => !d.ekuri_pair_id);

  const onSubmit = async () => {
    if (!doctor1 || !doctor2 || doctor1 === doctor2) {
      toast.error('Lütfen farklı iki doktor seçin');
      return;
    }
    
    setLoading(true);
    try {
      await createEkuriPair(doctor1, doctor2);
      toast.success('Eküri eşleşmesi başarıyla yapıldı');
      setOpen(false);
      setDoctor1('');
      setDoctor2('');
    } catch (error) {
      toast.error('Eşleştirme sırasında hata oluştu');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="font-semibold shadow-sm">
            <Users className="mr-2 h-4 w-4" /> Eküri Eşleştir
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eküri Eşleşmesi Oluştur</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>1. Doktor</Label>
            <Select onValueChange={(val) => val && setDoctor1(val)} value={doctor1}>
              <SelectTrigger>
                <SelectValue placeholder="Doktor seçin" />
              </SelectTrigger>
              <SelectContent>
                {availableDoctors.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-center">
            <Users className="h-6 w-6 text-muted-foreground/50" />
          </div>

          <div className="space-y-2">
            <Label>2. Doktor</Label>
            <Select onValueChange={(val) => val && setDoctor2(val)} value={doctor2}>
              <SelectTrigger>
                <SelectValue placeholder="Doktor seçin" />
              </SelectTrigger>
              <SelectContent>
                {availableDoctors.filter(d => d.id !== doctor1).map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button onClick={onSubmit} disabled={loading || !doctor1 || !doctor2}>
              {loading ? 'Eşleştiriliyor...' : 'Eküri Yap'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
