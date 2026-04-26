'use client';

import { useState } from 'react';
import { updateShiftAssignment } from '@/app/actions/plan-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Doctor, ShiftType } from '@/lib/supabase';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface ShiftEditDialogProps {
  assignment: {
    id: string;
    doctor_id: string;
    shift_type: ShiftType;
  };
  doctors: Doctor[];
}

export function ShiftEditDialog({ assignment, doctors }: ShiftEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [doctorId, setDoctorId] = useState(assignment.doctor_id);
  const [shiftType, setShiftType] = useState<ShiftType>(assignment.shift_type);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateShiftAssignment(assignment.id, doctorId, shiftType);
      toast.success('Nöbet güncellendi');
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Nöbet güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="h-6 w-6 rounded-lg opacity-70 hover:opacity-100">
            <Pencil className="h-3 w-3" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nöbeti Düzenle</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nöbet Tipi</p>
            <Select value={shiftType} onValueChange={(value) => value && setShiftType(value as ShiftType)}>
              <SelectTrigger>
                <SelectValue>{shiftType === 'gece' ? 'Gece' : 'Gündüz'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gunduz" textValue="Gündüz">Gündüz</SelectItem>
                <SelectItem value="gece" textValue="Gece">Gece</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Doktor</p>
            <Select value={doctorId} onValueChange={(value) => value && setDoctorId(value)}>
              <SelectTrigger>
                <SelectValue>{doctors.find(doctor => doctor.id === doctorId)?.full_name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {doctors.map(doctor => (
                  <SelectItem key={doctor.id} value={doctor.id} textValue={doctor.full_name}>
                    {doctor.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
