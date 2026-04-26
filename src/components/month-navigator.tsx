'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  format, 
  addMonths, 
  subMonths, 
  parseISO 
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MonthNavigatorProps {
  currentMonth: string; // e.g. "2026-05"
}

export function MonthNavigator({ currentMonth }: MonthNavigatorProps) {
  const router = useRouter();
  const currentDate = parseISO(`${currentMonth}-01`);

  const handlePrev = () => {
    const prevDate = subMonths(currentDate, 1);
    router.push(`/admin/plans/${format(prevDate, 'yyyy-MM')}`);
  };

  const handleNext = () => {
    const nextDate = addMonths(currentDate, 1);
    router.push(`/admin/plans/${format(nextDate, 'yyyy-MM')}`);
  };

  const handleMonthSelect = (value: string | null) => {
    if (value) router.push(`/admin/plans/${value}`);
  };

  // Generate some months for the select dropdown (e.g. current year +/- 1)
  const currentYear = currentDate.getFullYear();
  const months = Array.from({ length: 24 }, (_, i) => {
    const date = new Date(currentYear - 1, i, 1);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: tr }),
    };
  });

  return (
    <div className="inline-flex flex-wrap items-center gap-3 bg-white dark:bg-white/5 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon-sm" 
          onClick={handlePrev}
          className="rounded-md hover:bg-primary/5 hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon-sm" 
          onClick={handleNext}
          className="rounded-md hover:bg-primary/5 hover:text-primary transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-border/50" />

      <div className="flex items-center gap-3">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <Select 
          value={currentMonth} 
          onValueChange={handleMonthSelect}
        >
          <SelectTrigger className="w-[160px] h-9 bg-transparent border-none font-bold text-sm focus:ring-0 px-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-lg shadow-lg border-border/50">
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value} className="capitalize font-medium">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
