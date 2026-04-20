'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Users,
  CalendarDays,
  BarChart3,
  Stethoscope,
  Plane,
  LayoutDashboard
} from 'lucide-react';

const navItems = [
  { name: 'Kontrol Paneli', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Doktorlar', href: '/admin/doctors', icon: Users },
  { name: 'İzin Yönetimi', href: '/admin/leaves', icon: Plane },
  { name: 'Nöbet Planları', href: '/admin/plans', icon: CalendarDays },
  { name: 'Adalet Raporu', href: '/admin/fairness', icon: BarChart3 },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="h-14 border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
          <div className="h-8 w-8 rounded bg-teal-600 flex items-center justify-center text-white shadow-sm group-hover:shadow-teal-600/20 transition-all">
            <Stethoscope className="h-5 w-5 stroke-[2.5px]" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">Nöbetçi</span>
        </Link>

        <div className="flex items-center h-full gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.name === 'Nöbet Planı' && pathname.startsWith('/admin/plans'));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative h-10 px-4 flex items-center gap-2 text-xs font-bold transition-all rounded-md group",
                  isActive 
                    ? "text-teal-600 bg-teal-50" 
                    : "text-muted-foreground hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-teal-600" : "text-muted-foreground group-hover:text-slate-900")} />
                <span className="hidden lg:inline uppercase tracking-wider">{item.name}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-teal-600 rounded-t-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
