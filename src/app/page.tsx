import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, CalendarDays, Users, BarChart3, ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/50 p-4">
      <div className="max-w-4xl w-full space-y-12 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
            <Sparkles className="h-4 w-4" />
            <span>Next.js 15 & Supabase ile Güçlendirildi</span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter sm:text-7xl">
            Nöbetlerinizi <span className="text-primary tracking-tight">Akıllıca</span> Dağıtın.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Hastanenizin adil, otomatik ve kurala dayalı yeni nesil nöbet planlama sistemi. 
            Karmaşık kuralları sisteme bırakın, siz işinize odaklanın.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/plans/2026-05">
            <Card className="hover:shadow-2xl transition-all cursor-pointer group border-none shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CalendarDays className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Nöbet Planı</CardTitle>
                <CardDescription>Otomatik planlama ve aylık takvim görünümü.</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/doctors">
            <Card className="hover:shadow-2xl transition-all cursor-pointer group border-none shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle>Doktorlar</CardTitle>
                <CardDescription>Kadro yönetimi ve eküri eşleştirmeleri.</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/fairness">
            <Card className="hover:shadow-2xl transition-all cursor-pointer group border-none shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle>Adalet Raporu</CardTitle>
                <CardDescription>Yıllık bazda şeffaf nöbet istatistikleri.</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        <div className="flex gap-4 justify-center">
          <Button 
            render={<Link href="/admin/plans/2026-05" />}
            nativeButton={false}
            size="lg" 
            className="rounded-full px-8 font-bold text-lg shadow-xl hover:shadow-primary/20 transition-all"
          >
            Hemen Başla <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            render={<Link href="/admin/doctors" />}
            nativeButton={false}
            variant="outline" 
            size="lg" 
            className="rounded-full px-8 font-bold text-lg shadow-md"
          >
            Doktor Listesi
          </Button>
        </div>
      </div>
    </div>
  );
}
