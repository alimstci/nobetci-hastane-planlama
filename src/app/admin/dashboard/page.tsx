import {
  getDashboardStats,
  getMonthlyTrend,
  getDoctorWorkloadDistribution,
  getUpcomingLeaves,
} from '@/app/actions/dashboard-actions';
import { DashboardClient } from './dashboard-client';
import { Activity } from 'lucide-react';

export default async function DashboardPage() {
  const [stats, monthlyTrend, workloadDistribution, upcomingLeaves] = await Promise.all([
    getDashboardStats(),
    getMonthlyTrend(6),
    getDoctorWorkloadDistribution(),
    getUpcomingLeaves(30),
  ]);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b pb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded bg-teal-600 flex items-center justify-center text-white shadow-sm">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
              Kontrol Paneli
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
              Sistem Özeti ve Gerçek Zamanlı Metrikler
            </p>
          </div>
        </div>
      </div>

      {/* Client Component */}
      <DashboardClient
        stats={stats}
        monthlyTrend={monthlyTrend}
        workloadDistribution={workloadDistribution}
        upcomingLeaves={upcomingLeaves}
      />
    </div>
  );
}
