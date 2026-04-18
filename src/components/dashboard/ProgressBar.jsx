import React from 'react';
import { cn } from '@/lib/utils';

export default function ProgressBar({ label, completed, total, className }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate mr-4">{label}</span>
        <span className="text-sm font-semibold tabular-nums">
          {completed}/{total} <span className="text-muted-foreground font-normal">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            pct === 100 ? "bg-accent" : pct >= 50 ? "bg-primary" : "bg-chart-5"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}