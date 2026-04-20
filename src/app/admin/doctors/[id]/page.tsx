import {
  getDoctorProfile,
  getDoctorStats,
  getDoctorShiftHistory,
  getDoctorLeaveHistory,
  getEkuriPartner,
} from '@/app/actions/doctor-profile-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Calendar,
  Moon,
  Sun,
  TrendingUp,
  Plane,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: doctorId } = await params;
  const currentYear = new Date().getFullYear();

  const [doctor, stats, shiftHistory, leaveHistory] = await Promise.all([
    getDoctorProfile(doctorId),
    getDoctorStats(doctorId, currentYear),
    getDoctorShiftHistory(doctorId),
    getDoctorLeaveHistory(doctorId),
  ]);

  let ekuriPartner = null;
  if (doctor.ekuri_pair_id) {
    ekuriPartner = await getEkuriPartner(doctor.ekuri_pair_id, doctorId);
  }

  const dayStats = [
    { day: 'Pazartesi', count: stats.fairness.monday },
    { day: 'Salı', count: stats.fairness.tuesday },
    { day: 'Çarşamba', count: stats.fairness.wednesday },
    { day: 'Perşembe', count: stats.fairness.thursday },
    { day: 'Cuma', count: stats.fairness.friday },
    { day: 'Cumartesi', count: stats.fairness.saturday },
    { day: 'Pazar', count: stats.fairness.sunday },
  ];

  const maxDayCount = Math.max(...dayStats.map(d => d.count), 1);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 1. Header with Back Button */}
      <div className="flex items-center gap-4 border-b pb-8">
        <Link href="/admin/doctors">
          <Button variant="outline" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
            {doctor.full_name}
          </h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2 opacity-60">
            Kişisel Nöbet Profili ve İstatistikleri
          </p>
        </div>
      </div>

      {/* 2. Profile Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Info */}
        <Card className="border shadow-sm bg-white rounded-lg overflow-hidden">
          <CardHeader className="bg-slate-50/50 py-4 px-6 border-b">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">
              Temel Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Grup Tipi</p>
              <Badge
                className={cn(
                  'mt-2 text-[10px] font-black uppercase tracking-widest border-px px-2 h-6',
                  doctor.group_type === 'normal'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                )}
              >
                {doctor.group_type === 'normal' ? 'Hafta İçi' : 'Hafta Sonu'}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Durum</p>
              <Badge
                variant="outline"
                className={cn(
                  'mt-2 text-[10px] font-black uppercase tracking-widest border-px px-2 h-6',
                  doctor.is_active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                )}
              >
                {doctor.is_active ? 'Aktif' : 'Pasif'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Night Shift Stats */}
        <Card className="border shadow-sm bg-white rounded-lg overflow-hidden">
          <CardHeader className="bg-slate-50/50 py-4 px-6 border-b">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Gece Nöbeti
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Borç Puanı</p>
              <p className="text-3xl font-black text-slate-900 mt-2">{stats.nightDebt.debt_points}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Yıllık Toplam</p>
              <p className="text-xl font-bold text-slate-600 mt-2">
                {stats.nightDebt.total_night_shifts_year} nöbet
              </p>
            </div>
            {stats.nightDebt.last_night_month && (
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Son Nöbet</p>
                <p className="text-sm font-bold text-slate-600 mt-2">
                  {stats.nightDebt.last_night_month}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Day Shift Stats */}
        <Card className="border shadow-sm bg-white rounded-lg overflow-hidden">
          <CardHeader className="bg-slate-50/50 py-4 px-6 border-b">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Gündüz Nöbeti
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Toplam Nöbet</p>
              <p className="text-3xl font-black text-slate-900 mt-2">
                {stats.fairness.total_day_shifts}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Hafta Sonu Nöbeti</p>
              <p className="text-xl font-bold text-slate-600 mt-2">
                {stats.fairness.holiday_count} gün
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Ekuri Partner */}
      {ekuriPartner && (
        <Card className="border shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg overflow-hidden">
          <CardContent className="p-6 flex items-center gap-4">
            <ShieldCheck className="h-8 w-8 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Eküri Partneri</p>
              <p className="text-lg font-bold text-emerald-900 mt-1">{ekuriPartner.full_name}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Day Distribution */}
      <Card className="border shadow-sm bg-white rounded-lg overflow-hidden">
        <CardHeader className="bg-slate-50/50 py-4 px-6 border-b">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Gün Dağılımı ({currentYear})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {dayStats.map((day) => (
              <div key={day.day} className="space-y-2">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide text-center">
                  {day.day.slice(0, 3)}
                </p>
                <div className="h-24 bg-slate-100 rounded-lg overflow-hidden flex flex-col-reverse">
                  <div
                    className="bg-teal-500 transition-all duration-500"
                    style={{
                      height: `${maxDayCount > 0 ? (day.count / maxDayCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-center font-black text-slate-900 text-lg">{day.count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 5. Shift History */}
      <Card className="border shadow-sm bg-white rounded-lg overflow-hidden">
        <CardHeader className="bg-slate-50/50 py-4 px-6 border-b">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Nöbet Geçmişi (Son 20)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4 px-6">Tarih</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Nöbet Tipi</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Ay</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Eküri</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shiftHistory.length > 0 ? (
                shiftHistory.map((shift) => (
                  <TableRow key={shift.id} className="hover:bg-slate-50 border-b">
                    <TableCell className="py-4 px-6 font-bold text-slate-900">
                      {format(parseISO(shift.date), 'dd MMM yyyy', { locale: tr })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[9px] font-black uppercase tracking-widest border-px px-2 h-5',
                          shift.shift_type === 'gece'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        )}
                      >
                        {shift.shift_type === 'gece' ? '🌙 Gece' : '☀️ Gündüz'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-[10px] font-bold text-slate-500 uppercase">
                      {shift.plan?.year_month}
                    </TableCell>
                    <TableCell className="text-center">
                      {shift.is_ekuri ? (
                        <ShieldCheck className="h-4 w-4 text-emerald-600 mx-auto" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground opacity-50">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-[10px] italic uppercase">
                    Henüz nöbet geçmişi yok
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 6. Leave History */}
      <Card className="border shadow-sm bg-white rounded-lg overflow-hidden">
        <CardHeader className="bg-slate-50/50 py-4 px-6 border-b">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <Plane className="h-4 w-4" />
            İzin Geçmişi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4 px-6">Başlangıç</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Bitiş</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Gün Sayısı</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Açıklama</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveHistory.length > 0 ? (
                leaveHistory.map((leave) => {
                  const start = parseISO(leave.start_date);
                  const end = parseISO(leave.end_date);
                  const days = Math.ceil(
                    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
                  ) + 1;

                  return (
                    <TableRow key={leave.id} className="hover:bg-slate-50 border-b">
                      <TableCell className="py-4 px-6 font-bold text-slate-900">
                        {format(start, 'dd MMM yyyy', { locale: tr })}
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-900">
                        {format(end, 'dd MMM yyyy', { locale: tr })}
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-900">
                        {days} gün
                      </TableCell>
                      <TableCell className="text-[10px] text-slate-600 font-semibold">
                        {leave.description || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-[10px] italic uppercase">
                    Henüz izin geçmişi yok
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
