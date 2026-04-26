'use client';

import { useState } from 'react';
import { updateDoctor } from '@/app/actions/doctor-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Doctor, GroupType } from '@/lib/supabase';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface EditDoctorDialogProps {
  doctor: Doctor;
}

const groupLabels: Record<GroupType, string> = {
  normal: 'Normal Grup',
  weekend: 'Hafta Sonu Grubu',
  night_only: 'Sadece Gece',
};

export function EditDoctorDialog({ doctor }: EditDoctorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(doctor.full_name);
  const [groupType, setGroupType] = useState<GroupType>(doctor.group_type);
  const [isActive, setIsActive] = useState(doctor.is_active);

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      toast.error('Doktor adı boş olamaz');
      return;
    }

    setLoading(true);
    try {
      await updateDoctor(doctor.id, fullName.trim(), groupType, isActive);
      toast.success('Doktor bilgileri güncellendi');
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Doktor güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="w-full justify-start h-12">
            <Pencil className="h-4 w-4 mr-2" />
            Doktoru Düzenle
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Doktoru Düzenle</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-full-name">Ad Soyad</Label>
            <Input id="edit-full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Grup</Label>
            <Select value={groupType} onValueChange={(value) => value && setGroupType(value as GroupType)}>
              <SelectTrigger>
                <SelectValue>{groupLabels[groupType]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal" textValue="Normal Grup">Normal Grup</SelectItem>
                <SelectItem value="weekend" textValue="Hafta Sonu Grubu">Hafta Sonu Grubu</SelectItem>
                <SelectItem value="night_only" textValue="Sadece Gece">Sadece Gece</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 p-4">
            <span className="text-xs font-black uppercase tracking-widest">Aktif</span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-5 w-5 accent-primary"
            />
          </label>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
