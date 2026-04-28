'use client';

import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, FileSpreadsheet, Link2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { bulkCreateEkuriPairs, bulkDeleteDoctors, bulkImportDoctors } from '@/app/actions/doctor-actions';
import { GroupType } from '@/lib/supabase';

type DoctorRow = {
  id: string;
  full_name: string;
  group_type: GroupType;
  is_active: boolean;
  ekuri_pair_id?: string | null;
  ekuri_pairs?: {
    doctor1?: { id: string; full_name: string };
    doctor2?: { id: string; full_name: string };
  } | null;
};

type ImportRow = {
  fullName: string;
  groupType: GroupType;
  ekuriPartnerName?: string;
};

interface BulkDoctorToolsDialogProps {
  doctors: DoctorRow[];
}

function normalizeGroup(value: unknown): GroupType {
  const raw = String(value || '').trim().toLocaleLowerCase('tr-TR');
  if (['weekend', 'hafta sonu', 'h.sonu', 'haftasonu'].includes(raw)) return 'weekend';
  if (['night_only', 'sadece gece', 'gece'].includes(raw)) return 'night_only';
  return 'normal';
}

function readCell(row: Record<string, unknown>, keys: string[]) {
  const entry = Object.entries(row).find(([key]) => keys.includes(key.trim().toLocaleLowerCase('tr-TR')));
  return entry ? String(entry[1] || '').trim() : '';
}

export function BulkDoctorToolsDialog({ doctors }: BulkDoctorToolsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pairText, setPairText] = useState('');
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const pairedCount = useMemo(() => doctors.filter(doctor => doctor.ekuri_pair_id).length / 2, [doctors]);

  const toggleSelected = (doctorId: string) => {
    setSelectedIds(current =>
      current.includes(doctorId) ? current.filter(id => id !== doctorId) : [...current, doctorId]
    );
  };

  const handleExport = () => {
    const rows = doctors.map(doctor => {
      const partner = doctor.ekuri_pairs
        ? doctor.ekuri_pairs.doctor1?.id === doctor.id
          ? doctor.ekuri_pairs.doctor2?.full_name
          : doctor.ekuri_pairs.doctor1?.full_name
        : '';

      return {
        full_name: doctor.full_name,
        group_type: doctor.group_type,
        is_active: doctor.is_active ? 'aktif' : 'pasif',
        ekuri_partner: partner || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Doktorlar');
    XLSX.writeFile(workbook, 'nobetci-doktorlar.xlsx');
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
    const parsedRows = rawRows
      .map(row => ({
        fullName: readCell(row, ['full_name', 'ad soyad', 'ad_soyad', 'isim', 'doktor', 'doctor']),
        groupType: normalizeGroup(readCell(row, ['group_type', 'grup', 'group'])),
        ekuriPartnerName: readCell(row, ['ekuri_partner', 'ekuri', 'partner', 'eküri']),
      }))
      .filter(row => row.fullName);

    setImportRows(parsedRows);
    toast.success(`${parsedRows.length} doktor satırı okundu`);
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const result = await bulkImportDoctors(importRows);
      toast.success(`${result.imported} doktor işlendi, ${result.paired} eküri oluşturuldu`);
      setImportRows([]);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'İçe aktarma tamamlanamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPair = async () => {
    const rows = pairText
      .split('\n')
      .map(line => line.split(/[;,]/).map(part => part.trim()))
      .filter(parts => parts.length >= 2)
      .map(([doctor1Name, doctor2Name]) => ({ doctor1Name, doctor2Name }));

    setLoading(true);
    try {
      const result = await bulkCreateEkuriPairs(rows);
      toast.success(`${result.created} eküri oluşturuldu, ${result.skipped} satır atlandı`);
      setPairText('');
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Eküri eşleştirme tamamlanamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm(`${selectedIds.length} doktor kalıcı olarak silinsin mi?`);
    if (!confirmed) return;

    setLoading(true);
    try {
      await bulkDeleteDoctors(selectedIds);
      toast.success(`${selectedIds.length} doktor silindi`);
      setSelectedIds([]);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Toplu silme tamamlanamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="h-10 px-3 font-semibold">
            <FileSpreadsheet className="mr-2 h-3.5 w-3.5 text-primary" />
            Toplu
          </Button>
        }
      />
      <DialogContent className="max-w-5xl max-h-[86vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Toplu Personel İşlemleri</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold">Excel İçe/Dışa Aktar</h3>
                <p className="text-xs text-slate-500 mt-1">Kolonlar: full_name, group_type, ekuri_partner</p>
              </div>
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <Input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => handleFile(event.target.files?.[0] || null)} />
            <div className="flex items-center gap-2">
              <Button onClick={handleImport} disabled={loading || importRows.length === 0} className="flex-1">
                {importRows.length > 0 ? `${importRows.length} Satırı Al` : 'İçe Aktar'}
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold">Toplu Eküri</h3>
                <p className="text-xs text-slate-500 mt-1">Her satır: Doktor A, Doktor B</p>
              </div>
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <textarea
              value={pairText}
              onChange={(event) => setPairText(event.target.value)}
              placeholder="Dr. Ayşe Yılmaz, Dr. Mehmet Kaya"
              className="min-h-36 w-full resize-y rounded-md border border-slate-200 bg-slate-50 p-3 text-xs outline-none focus:border-primary"
            />
            <Button onClick={handleBulkPair} disabled={loading || !pairText.trim()} className="w-full">
              Ekürileri Oluştur
            </Button>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold">Toplu Silme</h3>
                <p className="text-xs text-slate-500 mt-1">{doctors.length} doktor, {pairedCount} eküri çifti</p>
              </div>
              <Trash2 className="h-5 w-5 text-rose-600" />
            </div>
            <div className="max-h-56 overflow-y-auto rounded-md border border-slate-200">
              {doctors.map(doctor => (
                <label key={doctor.id} className="flex items-center gap-3 border-b border-slate-100 px-3 py-2 text-xs last:border-b-0">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(doctor.id)}
                    onChange={() => toggleSelected(doctor.id)}
                  />
                  <span className="flex-1 truncate font-semibold">{doctor.full_name}</span>
                  <Badge variant="outline" className="text-[9px]">{doctor.group_type}</Badge>
                </label>
              ))}
            </div>
            <Button variant="outline" onClick={handleBulkDelete} disabled={loading || selectedIds.length === 0} className="w-full text-rose-600 hover:text-rose-700">
              {selectedIds.length > 0 ? `${selectedIds.length} Doktoru Sil` : 'Doktor Seç'}
            </Button>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
