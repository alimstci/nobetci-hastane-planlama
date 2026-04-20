import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number; // Positive or negative percentage
  color?: 'primary' | 'success' | 'warning' | 'danger';
  subtitle?: string;
}

export function KPICard({
  title,
  value,
  icon,
  trend,
  color = 'primary',
  subtitle,
}: KPICardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary shadow-[0_0_20px_-10px_var(--primary)]',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-[0_0_20px_-10px_#10b981]',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-[0_0_20px_-10px_#f59e0b]',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-[0_0_20px_-10px_#f43f5e]',
  };

  const trendColor = trend && trend > 0 ? 'text-emerald-600 bg-emerald-500/5' : 'text-rose-600 bg-rose-500/5';
  const TrendIcon = trend && trend > 0 ? TrendingUp : TrendingDown;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className="overflow-hidden border-none shadow-2xl h-full">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className={cn(
              'h-16 w-16 rounded-[1.25rem] flex items-center justify-center transition-all duration-500', 
              colorClasses[color]
            )}>
              <div className="scale-110">{icon}</div>
            </div>
            {trend !== undefined && (
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all', 
                trend > 0 
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-100 shadow-sm' 
                  : 'text-rose-700 bg-rose-50 border-rose-100 shadow-sm'
              )}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-gradient tracking-tighter">
                {value}
              </span>
              {subtitle && (
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide opacity-80">
                  {subtitle}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
