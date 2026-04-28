'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { generateAutoPlan } from '@/app/actions/plan-actions';
import { Button } from '@/components/ui/button';

interface GeneratePlanButtonProps {
  yearMonth: string;
  hasAssignments: boolean;
}

export function GeneratePlanButton({ yearMonth, hasAssignments }: GeneratePlanButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (hasAssignments) {
      const confirmed = window.confirm('Bu ayda mevcut nöbetler var. Otomatik plan yeniden çalışırsa manuel değişiklikler silinir. Devam edilsin mi?');
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      await generateAutoPlan(yearMonth);
      toast.success('Plan yeniden oluşturuldu');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Plan oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="premium"
      size="lg"
      className="h-11 px-5"
      disabled={loading}
      onClick={handleGenerate}
    >
      <Sparkles className="mr-3 h-5 w-5" />
      {loading ? 'Hesaplanıyor...' : hasAssignments ? 'Yeniden Hesapla' : 'Otomatik Hesapla'}
    </Button>
  );
}
