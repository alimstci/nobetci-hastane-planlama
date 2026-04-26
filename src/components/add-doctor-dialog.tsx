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

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      fullName: '',
      ekuriPartnerName: '',
      groupType: 'normal' as 'normal' | 'weekend' | 'night_only',
    }
  });

  const selectedGroup = watch('groupType');

  const onSubmit = async (data: { fullName: string; ekuriPartnerName: string; groupType: 'normal' | 'weekend' | 'night_only' }) => {
    setLoading(true);
    try {
      await addDoctor(data.fullName, data.groupType, data.ekuriPartnerName);
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
          <Button size="sm" className="font-semibold shadow-lg hover:shadow-xl transition-all h-10 px-4">
            <PlusCircle className="mr-2 h-3.5 w-3.5" /> Yeni
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
              onValueChange={(value) => value && setValue('groupType', value as any)}
              defaultValue="normal"
            >
              <SelectTrigger>
                <SelectValue placeholder="Grup seçin">
                  {selectedGroup === 'normal' && 'Normal Grup'}
                  {selectedGroup === 'weekend' && 'Hafta Sonu Grubu'}
                  {selectedGroup === 'night_only' && 'Sadece Gece'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal" textValue="Normal Grup">Normal Grup</SelectItem>
                <SelectItem value="weekend" textValue="Hafta Sonu Grubu">Hafta Sonu Grubu</SelectItem>
                <SelectItem value="night_only" textValue="Sadece Gece">Sadece Gece</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selectedGroup === 'weekend' && (
            <div className="space-y-2">
              <Label htmlFor="ekuriPartnerName">Eküri Partneri</Label>
              <Input 
                id="ekuriPartnerName" 
                placeholder="Dr. Ayşe Demir" 
                {...register('ekuriPartnerName', { required: selectedGroup === 'weekend' })} 
              />
            </div>
          )}
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
