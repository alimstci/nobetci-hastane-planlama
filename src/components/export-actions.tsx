'use client';

import { Button } from '@/components/ui/button';
import { 
  Download, 
  FileSpreadsheet, 
  Printer, 
  ChevronDown 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExportActionsProps {
  assignments: any[];
  monthName: string;
}

export function ExportActions({ assignments, monthName }: ExportActionsProps) {
  
  const handleExcelExport = () => {
    // 1. Prepare Data
    // Group by date
    const grouped = assignments.reduce((acc: any, curr) => {
      if (!acc[curr.date]) {
        acc[curr.date] = { date: curr.date, gunduz: [], gece: [] };
      }
      if (curr.shift_type === 'gunduz') {
        acc[curr.date].gunduz.push(curr.doctor?.full_name);
      } else {
        acc[curr.date].gece.push(curr.doctor?.full_name);
      }
      return acc;
    }, {});

    const sortedDates = Object.keys(grouped).sort();
    
    const excelData = sortedDates.map(dateStr => {
      const date = new Date(dateStr);
      return {
        'Tarih': format(date, 'd MMMM yyyy', { locale: tr }),
        'Gün': format(date, 'EEEE', { locale: tr }),
        'Gündüz Nöbetçisi': grouped[dateStr].gunduz.join(', '),
        'Gece Nöbetçisi': grouped[dateStr].gece.join(', ')
      };
    });

    // 2. Create Workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nöbet Çizelgesi");

    // 3. Set Column Widths
    const wscols = [
      { wch: 20 }, // Tarih
      { wch: 15 }, // Gün
      { wch: 30 }, // Gündüz
      { wch: 30 }, // Gece
    ];
    worksheet['!cols'] = wscols;

    // 4. Download
    const fileName = `Nobet_Cizelgesi_${monthName.replace(' ', '_')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-3 no-print">
      <Button 
        variant="outline" 
        size="lg" 
        className="h-14 px-6 border-slate-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all"
        onClick={handlePrint}
      >
        <Printer className="mr-2 h-4 w-4 text-slate-500" />
        <span className="uppercase font-black text-[10px] tracking-widest">Yazdır / PDF</span>
      </Button>

      <Button 
        variant="secondary" 
        size="lg" 
        className="h-14 px-6 shadow-lg hover:shadow-xl transition-all"
        onClick={handleExcelExport}
      >
        <FileSpreadsheet className="mr-2 h-4 w-4 text-teal-500" />
        <span className="uppercase font-black text-[10px] tracking-widest">Excel İndir</span>
      </Button>
    </div>
  );
}
