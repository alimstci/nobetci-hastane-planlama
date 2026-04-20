'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Search,
  Users,
  Calendar,
  BarChart3,
  LayoutDashboard,
  Plane,
  Command as CommandIcon,
  X,
  History,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const items = [
    {
      title: 'Navigasyon',
      links: [
        { name: 'Kontrol Paneli', icon: LayoutDashboard, href: '/admin/dashboard' },
        { name: 'Doktor Yönetimi', icon: Users, href: '/admin/doctors' },
        { name: 'İzin & Muafiyet', icon: Plane, href: '/admin/leaves' },
        { name: 'Nöbet Planları', icon: Calendar, href: '/admin/plans' },
        { name: 'Adalet Analizi', icon: BarChart3, href: '/admin/fairness' },
      ]
    },
    {
      title: 'Hızlı İşlemler',
      links: [
        { name: 'Yeni Doktor Ekle', icon: Users, action: () => router.push('/admin/doctors?add=true') },
        { name: 'İzin Yaz', icon: Plane, action: () => router.push('/admin/leaves?action=add') },
        { name: 'Simülasyon Çalıştır', icon: Sparkles, action: () => router.push('/admin/dashboard?simulate=true') },
      ]
    }
  ];

  const filteredItems = items.map(section => ({
    ...section,
    links: section.links.filter(link => 
      link.name.toLowerCase().includes(query.toLowerCase())
    )
  })).filter(section => section.links.length > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-transparent shadow-none top-[20%] translate-y-0">
        <div className="glass-card rounded-[2rem] border border-white/20 overflow-hidden shadow-2xl shadow-slate-900/50">
          
          {/* Search Input Area */}
          <div className="p-6 border-b border-white/10 flex items-center gap-4 bg-slate-900/50">
            <Search className="h-6 w-6 text-teal-500 animate-pulse" />
            <input 
              autoFocus
              placeholder="Gitmek istediğiniz sayfa veya işlem..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent border-none text-xl font-bold text-white placeholder:text-slate-500 outline-none w-full tracking-tight"
            />
            <div className="flex items-center gap-2">
               <kbd className="h-6 flex items-center gap-1 rounded bg-white/10 px-2 font-mono text-[10px] font-black text-slate-400">ESC</kbd>
            </div>
          </div>

          {/* Results Area */}
          <div className="max-h-[400px] overflow-y-auto p-4 custom-scrollbar bg-slate-950/80 backdrop-blur-xl">
            {filteredItems.length > 0 ? (
              filteredItems.map((section, idx) => (
                <div key={idx} className="mb-6 last:mb-0">
                  <h3 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">{section.title}</h3>
                  <div className="space-y-1">
                    {section.links.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if ('href' in item && item.href) runCommand(() => router.push(item.href as string));
                            if ('action' in item && item.action) runCommand(item.action as () => void);
                          }}
                          className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/10 text-slate-300 hover:text-white transition-all group border border-transparent hover:border-white/5"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-all">
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-sm uppercase tracking-widest">{item.name}</span>
                          </div>
                          <History className="h-4 w-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                 <CommandIcon className="h-12 w-12 text-slate-800 mx-auto mb-4" />
                 <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Sonuç Bulunamadı</p>
              </div>
            )}
          </div>

          {/* Footer Hints */}
          <div className="p-4 bg-slate-900/80 border-t border-white/5 flex items-center justify-center gap-6">
             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <kbd className="bg-white/5 px-1.5 py-0.5 rounded">↑↓</kbd> Seç
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <kbd className="bg-white/5 px-1.5 py-0.5 rounded">ENTER</kbd> Git
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <kbd className="bg-white/5 px-1.5 py-0.5 rounded">ESC</kbd> Kapat
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
