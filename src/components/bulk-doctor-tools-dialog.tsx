'use client';

import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Link2,
  Search,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { GroupType } from '@/lib/supabase';

type Mode = 'excel' | 'ekuri' | 'delete';

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

const modeItems: { id: Mode; title: string; description: string; icon: typeof Upload }[] = [
  { id: 'excel', title: 'Excel Aktarımı', description: 'Personel listesini içe veya dışa aktar', icon: Upload },
  { id: 'ekuri', title: 'Toplu Eküri', description: 'İsim listesiyle eşleşmeleri kur', icon: Link2 },
  { id: 'delete', title: 'Toplu Silme', description: 'Seçili personeli sistemden kaldır', icon: Trash2 },
];

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

function downloadWorkbook(filename: string, sheetName: string, rows: Record<string, string>[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

function getGroupLabel(groupType: GroupType) {
  if (groupType === 'weekend') return 'Hafta Sonu';
  if (groupType === 'night_only') return 'Sadece Gece';
  return 'Normal';
}

function getExcelGroupLabel(groupType: GroupType) {
  if (groupType === 'weekend') return 'HAFTA SONU';
  if (groupType === 'night_only') return 'SADECE GECE';
  return 'HAFTA ICI';
}

export function BulkDoctorToolsDialog({ doctors }: BulkDoctorToolsDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('excel');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pairText, setPairText] = useState('');
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [deleteSearch, setDeleteSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const pairedCount = useMemo(() => Math.floor(doctors.filter(doctor => doctor.ekuri_pair_id).length / 2), [doctors]);
  const activeCount = useMemo(() => doctors.filter(doctor => doctor.is_active).length, [doctors]);
  const parsedPairCount = useMemo(
    () => pairText.split('\n').filter(line => line.split(/[;,]/).map(part => part.trim()).filter(Boolean).length >= 2).length,
    [pairText]
  );
  const filteredDeleteDoctors = useMemo(() => {
    const term = deleteSearch.toLocaleLowerCase('tr-TR');
    return doctors.filter(doctor => doctor.full_name.toLocaleLowerCase('tr-TR').includes(term));
  }, [deleteSearch, doctors]);

  const toggleSelected = (doctorId: string) => {
    setSelectedIds(current =>
      current.includes(doctorId) ? current.filter(id => id !== doctorId) : [...current, doctorId]
    );
  };

  const selectVisibleDoctors = () => {
    const visibleIds = filteredDeleteDoctors.map(doctor => doctor.id);
    setSelectedIds(current => [...new Set([...current, ...visibleIds])]);
  };

  const clearSelection = () => setSelectedIds([]);

  const handleExport = () => {
    const rows = doctors.map(doctor => {
      const partner = doctor.ekuri_pairs
        ? doctor.ekuri_pairs.doctor1?.id === doctor.id
          ? doctor.ekuri_pairs.doctor2?.full_name
          : doctor.ekuri_pairs.doctor1?.full_name
        : '';

      return {
        DOKTOR: doctor.full_name,
        'EKURISI': partner || '',
        'CALISMA GUNU': getExcelGroupLabel(doctor.group_type),
        DURUM: doctor.is_active ? 'AKTIF' : 'PASIF',
      };
    });

    downloadWorkbook('nobetci-doktorlar.xlsx', 'Doktorlar', rows);
  };

  const handleTemplateDownload = () => {
    downloadWorkbook('nobetci-personel-sablonu.xlsx', 'Personel Sablonu', [
      {
        DOKTOR: 'RAMAZAN BULDUK',
        EKURISI: 'SUMEYYE DOGAN',
        'CALISMA GUNU': 'HAFTA ICI',
      },
      {
        DOKTOR: 'HAMDULLAH CAKIR',
        EKURISI: 'IDRIS GENC',
        'CALISMA GUNU': 'HAFTA SONU',
      },
      {
        DOKTOR: 'GECE NOBET DOKTORU',
        EKURISI: '',
        'CALISMA GUNU': 'SADECE GECE',
      },
    ]);
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
        groupType: normalizeGroup(readCell(row, ['group_type', 'grup', 'group', 'calisma gunu', '\u00e7al\u0131\u015fma g\u00fcn\u00fc'])),
        ekuriPartnerName: readCell(row, ['ekuri_partner', 'ekuri', 'ekurisi', 'partner', 'ek\u00fcri', 'ek\u00fcrisi']),
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
      <DialogContent className="!max-w-[calc(100vw-4rem)] sm:!max-w-[1120px] max-h-[88vh] overflow-hidden p-0 gap-0 rounded-xl bg-slate-50">
        <DialogHeader className="border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <DialogTitle className="text-xl normal-case tracking-tight text-slate-950">Toplu Personel İşlemleri</DialogTitle>
              <p className="mt-1 text-sm text-slate-500">Excel, eküri ve silme işlemlerini tek ekrandan güvenli şekilde yönet.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric label="Personel" value={doctors.length} />
              <Metric label="Aktif" value={activeCount} />
              <Metric label="Eküri" value={pairedCount} />
            </div>
          </div>
        </DialogHeader>

        <div className="grid min-h-[560px] grid-cols-1 md:grid-cols-[260px_1fr]">
          <aside className="border-b border-slate-200 bg-white p-4 md:border-b-0 md:border-r">
            <div className="space-y-2">
              {modeItems.map(item => {
                const Icon = item.icon;
                const active = mode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                      active
                        ? 'border-primary bg-primary/10 text-slate-950'
                        : 'border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md', active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500')}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold">{item.title}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-500">{item.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold">Beklenen Excel başlıkları</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['DOKTOR', 'EKURISI', 'CALISMA GUNU'].map(label => (
                  <Badge key={label} variant="outline" className="bg-white text-[10px]">{label}</Badge>
                ))}
              </div>
            </div>
          </aside>

          <main className="overflow-y-auto p-5">
            {mode === 'excel' && (
              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-950">Excel ile personel aktarımı</h3>
                      <p className="mt-1 text-sm text-slate-500">Var olan doktorlar isim üzerinden güncellenir, yeni isimler eklenir.</p>
                    </div>
                    <Upload className="h-5 w-5 text-primary" />
                  </div>

                  <label className="mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 text-center transition-colors hover:border-primary hover:bg-primary/5">
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                    <span className="mt-3 text-sm font-bold text-slate-900">Excel veya CSV dosyası seç</span>
                    <span className="mt-1 text-xs text-slate-500">.xlsx, .xls, .csv</span>
                    <Input className="hidden" type="file" accept=".xlsx,.xls,.csv" onChange={(event) => handleFile(event.target.files?.[0] || null)} />
                  </label>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button onClick={handleImport} disabled={loading || importRows.length === 0}>
                      {importRows.length > 0 ? `${importRows.length} Satırı İçe Aktar` : 'Dosya Bekleniyor'}
                    </Button>
                    <Button variant="outline" onClick={handleTemplateDownload}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Sablon Indir
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                      <Download className="mr-2 h-4 w-4" />
                      Mevcut Listeyi İndir
                    </Button>
                  </div>
                </section>

                <PreviewPanel rows={importRows} />
              </div>
            )}

            {mode === 'ekuri' && (
              <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-950">Toplu eküri eşleştirme</h3>
                      <p className="mt-1 text-sm text-slate-500">Her satıra iki doktor adı yaz. Virgül veya noktalı virgül kabul edilir.</p>
                    </div>
                    <Link2 className="h-5 w-5 text-primary" />
                  </div>
                  <textarea
                    value={pairText}
                    onChange={(event) => setPairText(event.target.value)}
                    placeholder={'Dr. Ayşe Yılmaz, Dr. Mehmet Kaya\nDr. Fatma Demir; Dr. Ali Koç'}
                    className="mt-5 min-h-80 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-7 outline-none focus:border-primary focus:bg-white"
                  />
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">{parsedPairCount} eşleşme satırı algılandı</p>
                    <Button onClick={handleBulkPair} disabled={loading || parsedPairCount === 0}>
                      Ekürileri Oluştur
                    </Button>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h4 className="text-sm font-bold text-slate-950">Kurallar</h4>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <Rule text="İki doktor da sistemde kayıtlı olmalı." />
                    <Rule text="Zaten ekürisi olan satırlar atlanır." />
                    <Rule text="Hafta sonu grubu ekürileri yine hafta sonu grubundan seçilmeli." />
                  </div>
                </section>
              </div>
            )}

            {mode === 'delete' && (
              <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                <section className="rounded-lg border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-950">Toplu silme</h3>
                        <p className="mt-1 text-sm text-slate-500">Silme işlemi doktor kayıtlarını ve bağlı geçmişleri etkileyebilir.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={selectVisibleDoctors}>Görünenleri Seç</Button>
                        <Button variant="outline" size="sm" onClick={clearSelection}>Temizle</Button>
                      </div>
                    </div>
                    <div className="relative mt-4">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input value={deleteSearch} onChange={(event) => setDeleteSearch(event.target.value)} placeholder="Doktor ara..." className="pl-9" />
                    </div>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {filteredDeleteDoctors.map(doctor => (
                      <label key={doctor.id} className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(doctor.id)}
                          onChange={() => toggleSelected(doctor.id)}
                          className="h-4 w-4"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-slate-900">{doctor.full_name}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">{doctor.is_active ? 'Aktif' : 'Pasif'}</span>
                        </span>
                        <Badge variant="outline">{getGroupLabel(doctor.group_type)}</Badge>
                      </label>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-rose-200 bg-rose-50 p-5">
                  <div className="flex items-center gap-3 text-rose-700">
                    <AlertTriangle className="h-5 w-5" />
                    <h4 className="text-sm font-bold">Silme Özeti</h4>
                  </div>
                  <p className="mt-4 text-4xl font-black text-rose-700">{selectedIds.length}</p>
                  <p className="mt-1 text-sm text-rose-700/80">doktor seçildi</p>
                  <Button variant="outline" onClick={handleBulkDelete} disabled={loading || selectedIds.length === 0} className="mt-6 w-full border-rose-300 bg-white text-rose-700 hover:bg-rose-100">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Seçili Doktorları Sil
                  </Button>
                </section>
              </div>
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
      <p className="text-lg font-black leading-none text-slate-950">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase text-slate-500">{label}</p>
    </div>
  );
}

function PreviewPanel({ rows }: { rows: ImportRow[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Ön izleme</h3>
          <p className="mt-1 text-sm text-slate-500">{rows.length > 0 ? `${rows.length} satır okunmaya hazır` : 'Henüz dosya seçilmedi'}</p>
        </div>
        <Users className="h-5 w-5 text-primary" />
      </div>

      <div className="mt-5 max-h-80 overflow-y-auto rounded-lg border border-slate-200">
        {rows.length === 0 ? (
          <div className="flex min-h-56 items-center justify-center text-center text-sm text-slate-500">
            Dosya seçildiğinde ilk satırlar burada görünecek.
          </div>
        ) : (
          rows.slice(0, 10).map((row, index) => (
            <div key={`${row.fullName}-${index}`} className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{row.fullName}</p>
                {row.ekuriPartnerName && <p className="truncate text-xs text-slate-500">Eküri: {row.ekuriPartnerName}</p>}
              </div>
              <Badge variant="outline">{getGroupLabel(row.groupType)}</Badge>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function Rule({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span>{text}</span>
    </div>
  );
}
