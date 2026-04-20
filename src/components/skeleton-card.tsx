'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <Card className={cn("animate-pulse", className)}>
      <CardHeader>
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4 mb-2" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-full" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-5/6" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-4/6" />
      </CardContent>
    </Card>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div 
              key={j} 
              className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg flex-1 animate-pulse"
              style={{ animationDelay: `${(i * cols + j) * 50}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
