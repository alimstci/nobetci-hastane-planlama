'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Users,
  CalendarDays,
  BarChart3,
  Stethoscope,
  Plane,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  X,
  Menu,
} from 'lucide-react';

const navItems = [
  { name: 'Kontrol Paneli', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Doktorlar', href: '/admin/doctors', icon: Users },
  { name: 'İzin Yönetimi', href: '/admin/leaves', icon: Plane },
  { name: 'Nöbet Planları', href: '/admin/plans', icon: CalendarDays },
  { name: 'Adalet Raporu', href: '/admin/fairness', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Close mobile menu on route change
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Prevent body scroll when mobile menu is open
    if (isMobileOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen, isMobile]);

  if (!isMounted) return null;

  // Mobile Menu Layout
  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 z-50 flex items-center justify-between px-6 shadow-sm">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-white">
              <Stethoscope className="h-6 w-6 stroke-[2.5px]" />
            </div>
            <span className="font-black text-xl tracking-tighter text-slate-900 dark:text-white uppercase">
              Nöbetçi
            </span>
          </Link>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300"
            aria-label="Menüyü aç"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Overlay */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-slate-900 z-[70] flex flex-col shadow-xl"
              >
                <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-white/5">
                  <Link href="/" className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-white">
                      <Stethoscope className="h-6 w-6 stroke-[2.5px]" />
                    </div>
                    <span className="font-black text-xl tracking-tighter text-slate-900 dark:text-white uppercase">
                      Nöbetçi
                    </span>
                  </Link>
                  <button
                    onClick={() => setIsMobileOpen(false)}
                    className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300"
                    aria-label="Menüyü kapat"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-3 overflow-y-auto">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.name === 'Nöbet Planları' && pathname.startsWith('/admin/plans'));
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "relative flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group overflow-hidden",
                          isActive 
                            ? "text-primary dark:text-white bg-primary/10 dark:bg-primary/20" 
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                        )}
                      >
                        {isActive && <div className="sidebar-active-indicator" />}
                        <Icon className="h-6 w-6 shrink-0" />
                        <span className="text-sm font-black uppercase tracking-widest">
                          {item.name}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <motion.aside 
      initial={false}
      animate={{ 
        width: isCollapsed ? 84 : 260,
        margin: 0,
        borderRadius: 0,
      }}
      className={cn(
        "bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-white/10 min-h-screen sticky top-0 flex flex-col z-50 overflow-hidden hidden md:flex"
      )}
    >
      <div className="p-5 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
        <Link href="/" className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-white">
            <Stethoscope className="h-5 w-5 stroke-[2.5px]" />
          </div>
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-black text-xl tracking-tight text-slate-900 dark:text-white"
            >
              Nöbetçi
            </motion.span>
          )}
        </Link>
      </div>

      {!isCollapsed && (
        <div className="px-4 my-4">
          <button 
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md bg-slate-50 dark:bg-white/5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/10 group"
            aria-label="Ara"
          >
            <Search className="h-5 w-5 shrink-0" />
            <div className="flex justify-between items-center w-full">
              <span className="text-[11px] font-black uppercase tracking-widest opacity-60">Hızlı Ara...</span>
              <kbd className="hidden lg:inline-flex h-6 items-center gap-1 rounded border bg-white dark:bg-slate-800 px-2 font-mono text-[10px] font-medium text-slate-400 opacity-100 shadow-sm">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </button>
        </div>
      )}

      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto mt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.name === 'Nöbet Planları' && pathname.startsWith('/admin/plans'));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group overflow-hidden",
                isActive 
                  ? "text-primary dark:text-white" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-primary/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-primary/10 dark:bg-primary/20 z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {isActive && <div className="sidebar-active-indicator shadow-[0_0_15px_var(--primary)]" />}
              
              <Icon className={cn(
                "h-5 w-5 shrink-0 z-10", 
                isActive ? "text-primary" : "group-hover:text-primary transition-colors"
              )} />
              
              {!isCollapsed && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[12px] font-bold uppercase tracking-wide truncate z-10"
                >
                  {item.name}
                </motion.span>
              )}
              
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wide rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-colors whitespace-nowrap z-[100] shadow-lg">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-white/10 space-y-1.5">
        <button 
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 transition-colors",
            isCollapsed ? "justify-center" : "justify-start"
          )}
          aria-label="Bildirimler"
        >
          <Bell className="h-5 w-5" />
          {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">Bildirimler</span>}
        </button>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-primary bg-primary/5 hover:bg-primary/10 transition-colors group",
            isCollapsed ? "justify-center" : "justify-start"
          )}
          aria-label={isCollapsed ? "Genişlet" : "Küçült"}
        >
          {isCollapsed ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
          {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">Küçült</span>}
        </button>
      </div>
    </motion.aside>
  );
}
