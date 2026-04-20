import { getAnalyticsData, getMonthlyAnalytics } from '@/app/actions/analytics-actions';
import { AnalyticsClient } from './analytics-client';
import { BarChart3 } from 'lucide-react';

export default async function AnalyticsPage() {
  const currentYear = new Date().getFullYear();
  const [analyticsData, monthlyData] = await Promise.all([
    getAnalyticsData(currentYear),
    getMonthlyAnalytics(currentYear),
  ]);

  // Transform day distribution for radar chart
  const dayDistributionData = [
    { day: 'Pzt', value: analyticsData.dayDistribution.monday },
    { day: 'Sal', value: analyticsData.dayDistribution.tuesday },
    { day: 'Çar', value: analyticsData.dayDistribution.wednesday },
    { day: 'Per', value: analyticsData.dayDistribution.thursday },
    { day: 'Cum', value: analyticsData.dayDistribution.friday },
    { day: 'Cmt', value: analyticsData.dayDistribution.saturday },
    { day: 'Paz', value: analyticsData.dayDistribution.sunday },
  ];

  // Transform doctor workload
  const doctorWorkloadData = analyticsData.doctorWorkload.map(d => ({
    name: d.doctor?.full_name || 'Unknown',
    shifts: d.total_day_shifts,
  }));

  // Transform night shifts
  const nightShiftData = analyticsData.nightShifts.map(d => ({
    name: d.doctor?.full_name || 'Unknown',
    shifts: d.total_night_shifts_year,
  }));

  // Transform holidays
  const holidayData = analyticsData.holidays.map(d => ({
    name: d.doctor?.full_name || 'Unknown',
    holidays: d.holiday_count,
  }));

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b pb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
              Analitik Rapor
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
              {currentYear} Yılı Detaylı İstatistikler ve Trendler
            </p>
          </div>
        </div>
      </div>

      {/* Client Component */}
      <AnalyticsClient
        dayDistributionData={dayDistributionData}
        monthlyData={monthlyData}
        doctorWorkloadData={doctorWorkloadData}
        nightShiftData={nightShiftData}
        holidayData={holidayData}
      />
    </div>
  );
}
