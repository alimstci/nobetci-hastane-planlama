'use client';

import { useState, useEffect } from 'react';
import { addLeave, getDoctorLeaves, deleteLeave } from '@/app/actions/leave-actions';
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
import { Calendar, Trash2, Plus, Plane } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface ManageLeavesDialogProps {
  doctorId: string;
  doctorName: string;
  trigger?: React.ReactNode;
}

export function ManageLeavesDialog({ doctorId, doctorName, trigger }: ManageLeavesDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  const fetchLeaves = async () => {
    try {
      const data = await getDoctorLeaves(doctorId);
      setLeaves(data);
    } catch (error) {
      console.error('İzinler yüklenemedi:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLeaves();
    }
  }, [open, doctorId]);

  const handleAddLeave = async () => {
    if (!startDate || !endDate) {
      toast.error('Lütfen tarih aralığı seçin');
      return;
    }
    
    setLoading(true);
    try {
      await addLeave(doctorId, startDate, endDate, description);
      toast.success('İzin başarıyla eklendi');
      setStartDate('');
      setEndDate('');
      setDescription('');
      fetchLeaves();
    } catch (error) {
      toast.error('İzin eklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLeave = async (id: string) => {
    try {
      await deleteLeave(id);
      toast.success('İzin silindi');
      fetchLeaves();
    } catch (error) {
      toast.error('İzin silinemedi');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        trigger || (
          <Button variant="ghost" size="icon-sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
            <Plane className="h-4 w-4" />
          </Button>
        )
      } />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-amber-600" />
            {doctorName} - İzin Yönetimi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Başlangıç</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bitiş</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Açıklama (Opsiyonel)</Label>
            <Input 
              placeholder="Örn: Yıllık İzin, Kongre vb." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
            />
          </div>

          <Button 
            className="w-full bg-amber-600 hover:bg-amber-700" 
            onClick={handleAddLeave} 
            disabled={loading}
          >
            <Plus className="mr-2 h-4 w-4" /> İzin Ekle
          </Button>

          <div className="space-y-3 pt-4">
            <h4 className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" /> Kayıtlı İzinler ({leaves.length})
            </h4>
            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
              {leaves.map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border group hover:bg-muted transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">
                        {format(new Date(leave.start_date), 'd MMM', { locale: tr })} - {format(new Date(leave.end_date), 'd MMM', { locale: tr })}
                      </span>
                      {leave.description && (
                        <Badge variant="outline" className="text-[10px] py-0">{leave.description}</Badge>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon-xs" 
                    className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteLeave(leave.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {leaves.length === 0 && (
                <p className="text-xs text-center py-6 text-muted-foreground italic">Henüz izin kaydı yok.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
