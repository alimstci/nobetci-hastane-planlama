'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { addDoctor } from '@/app/actions/doctor-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

export function AddDoctorDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      fullName: '',
      groupType: 'normal' as 'normal' | 'weekend',
    }
  });

  const onSubmit = async (data: { fullName: string; groupType: 'normal' | 'weekend' }) => {
    setLoading(true);
    try {
      await addDoctor(data.fullName, data.groupType);
      toast.success('Doktor başarıyla eklendi');
      setOpen(false);
      reset();
    } catch (error) {
      toast.error('Hata oluştu');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="font-semibold shadow-lg hover:shadow-xl transition-all">
            <PlusCircle className="mr-2 h-4 w-4" /> Yeni Doktor
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Doktor Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Ad Soyad</Label>
            <Input 
              id="fullName" 
              placeholder="Dr. Ahmet Yılmaz" 
              {...register('fullName', { required: true })} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="groupType">Grup</Label>
            <Select 
              onValueChange={(value) => setValue('groupType', value as any)}
              defaultValue="normal"
            >
              <SelectTrigger>
                <SelectValue placeholder="Grup seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal Grup</SelectItem>
                <SelectItem value="weekend">Hafta Sonu Grubu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
