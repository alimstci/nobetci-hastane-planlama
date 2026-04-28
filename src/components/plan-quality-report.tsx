import { AlertTriangle, CheckCircle2, Moon, ShieldCheck, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ReactNode } from 'react';

type Assignment = {
  doctor_id: string;
  date: string;
  shift_type: 'gunduz' | 'gece';
  doctor?: { full_name?: string; group_type?: string };
};

type Doctor = {
  id: string;
  full_name: string;
  group_type: string;
};

interface PlanQualityReportProps {
  assignments: Assignment[];
  doctors: Doctor[];
  previousAssignments: Pick<Assignment, 'doctor_id' | 'shift_type'>[];
  expectedDaySlots: number;
  expectedNightSlots: number;
}

export function PlanQualityReport({
  assignments,
  doctors,
  previousAssignments,
  expectedDaySlots,
  expectedNightSlots,
}: PlanQualityReportProps) {
  const perDoctor = new Map<string, { total: number; day: number; night: number; name: string; group: string }>();
  const previousLoad = new Map<string, number>();

  doctors.forEach(doctor => {
    perDoctor.set(doctor.id, { total: 0, day: 0, night: 0, name: doctor.full_name, group: doctor.group_type });
  });

  assignments.forEach(assignment => {
    const stats = perDoctor.get(assignment.doctor_id);
    if (!stats) return;
    stats.total++;
    if (assignment.shift_type === 'gece') stats.night++;
    if (assignment.shift_type === 'gunduz') stats.day++;
  });

  previousAssignments.forEach(assignment => {
    previousLoad.set(assignment.doctor_id, (previousLoad.get(assignment.doctor_id) || 0) + 1);
  });

  const overloads = [...perDoctor.values()].filter(stats =>
    stats.total > 3 || stats.night > 1 || (stats.group === 'normal' && stats.day > 2)
  );
  const restPool = doctors
    .filter(doctor => (previousLoad.get(doctor.id) || 0) >= 3)
    .map(doctor => ({ name: doctor.full_name, load: previousLoad.get(doctor.id) || 0 }));
  const dayCount = assignments.filter(assignment => assignment.shift_type === 'gunduz').length;
  const nightCount = assignments.filter(assignment => assignment.shift_type === 'gece').length;
  const missingDay = Math.max(expectedDaySlots - dayCount, 0);
  const missingNight = Math.max(expectedNightSlots - nightCount, 0);
  const issueCount = overloads.length + (missingDay > 0 ? 1 : 0) + (missingNight > 0 ? 1 : 0);

  return (
    <Card className="border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {issueCount === 0 ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
            <h2 className="text-base font-bold text-slate-950">Plan Kalite Raporu</h2>
            <Badge variant={issueCount === 0 ? 'success' : 'outline'}>{issueCount === 0 ? 'Temiz' : `${issueCount} Uyarı`}</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">Yük sınırı, dinlendirme havuzu ve eksik atama kontrolü.</p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniMetric label="Gündüz" value={`${dayCount}/${expectedDaySlots}`} />
          <MiniMetric label="Gece" value={`${nightCount}/${expectedNightSlots}`} />
          <MiniMetric label="Dinlenen" value={String(restPool.length)} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <QualityBox
          icon={<Moon className="h-4 w-4" />}
          title="Eksik Atama"
          tone={missingDay || missingNight ? 'warn' : 'ok'}
          lines={[
            missingDay ? `${missingDay} gündüz slotu eksik` : 'Gündüz slotları dolu',
            missingNight ? `${missingNight} gece slotu eksik` : 'Gece slotları dolu',
          ]}
        />
        <QualityBox
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Limit Aşımı"
          tone={overloads.length ? 'warn' : 'ok'}
          lines={overloads.length ? overloads.slice(0, 4).map(item => `${item.name}: ${item.total} toplam`) : ['Aylık limit aşımı yok']}
        />
        <QualityBox
          icon={<Users className="h-4 w-4" />}
          title="Dinlendirme Havuzu"
          tone={restPool.length ? 'info' : 'ok'}
          lines={restPool.length ? restPool.slice(0, 4).map(item => `${item.name}: geçen ay ${item.load}`) : ['Geçen ay 3+ nöbetli doktor yok']}
        />
      </div>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-sm font-black text-slate-950">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase text-slate-500">{label}</p>
    </div>
  );
}

function QualityBox({ icon, title, lines, tone }: { icon: ReactNode; title: string; lines: string[]; tone: 'ok' | 'warn' | 'info' }) {
  const toneClass = tone === 'warn' ? 'border-amber-200 bg-amber-50 text-amber-800' : tone === 'info' ? 'border-sky-200 bg-sky-50 text-sky-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800';
  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-xs font-bold uppercase">{title}</h3>
      </div>
      <div className="mt-3 space-y-1">
        {lines.map(line => <p key={line} className="text-xs font-medium">{line}</p>)}
      </div>
    </div>
  );
}
