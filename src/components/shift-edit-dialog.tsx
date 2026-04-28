'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
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

interface ShiftEditDialogProps {
  assignment: {
    id: string;
    doctor_id: string;
    shift_type: ShiftType;
    date?: string;
  };
  doctors: Doctor[];
  allAssignments?: { id?: string; doctor_id: string; shift_type: ShiftType; date: string }[];
}

export function ShiftEditDialog({ assignment, doctors, allAssignments = [] }: ShiftEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [doctorId, setDoctorId] = useState(assignment.doctor_id);
  const [shiftType, setShiftType] = useState<ShiftType>(assignment.shift_type);
  const selectedDoctor = doctors.find(doctor => doctor.id === doctorId);
  const selectedStatus = selectedDoctor ? getDoctorShiftStatus(selectedDoctor, assignment, shiftType, allAssignments) : null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateShiftAssignment(assignment.id, doctorId, shiftType);
      toast.success('Nöbet güncellendi');
      setOpen(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Nöbet güncellenemedi');
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
                <SelectValue>{selectedDoctor?.full_name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {doctors.map(doctor => {
                  const status = getDoctorShiftStatus(doctor, assignment, shiftType, allAssignments);
                  return (
                    <SelectItem key={doctor.id} value={doctor.id} textValue={doctor.full_name}>
                      {doctor.full_name} - {status.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {selectedStatus && (
              <div className={`rounded-lg border p-3 text-xs ${selectedStatus.tone === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                <div className="flex items-center gap-2 font-bold">
                  {selectedStatus.tone === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  {selectedStatus.label}
                </div>
                <p className="mt-1">{selectedStatus.reason}</p>
              </div>
            )}
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

function getDoctorShiftStatus(
  doctor: Doctor,
  assignment: { id: string; date?: string },
  shiftType: ShiftType,
  allAssignments: { id?: string; doctor_id: string; shift_type: ShiftType; date: string }[]
) {
  const monthKey = assignment.date?.slice(0, 7);
  const monthAssignments = allAssignments.filter(item =>
    item.doctor_id === doctor.id &&
    item.id !== assignment.id &&
    (!monthKey || item.date.startsWith(monthKey))
  );
  const total = monthAssignments.length;
  const night = monthAssignments.filter(item => item.shift_type === 'gece').length;
  const day = monthAssignments.filter(item => item.shift_type === 'gunduz').length;

  if (total >= 3) return { tone: 'warn' as const, label: `${total}/3 dolu`, reason: 'Bu doktor aylık toplam nöbet sınırına ulaşmış.' };
  if (shiftType === 'gece' && night >= 1) return { tone: 'warn' as const, label: 'Gece var', reason: 'Bu doktor bu ay zaten gece nöbeti almış.' };
  if (shiftType === 'gunduz' && doctor.group_type === 'normal' && day >= 2) {
    return { tone: 'warn' as const, label: `${day}/2 gündüz`, reason: 'Hafta içi doktoru için aylık gündüz sınırı dolu.' };
  }
  return { tone: 'ok' as const, label: `${total}/3 uygun`, reason: 'Aylık yük sınırları içinde görünüyor.' };
}
