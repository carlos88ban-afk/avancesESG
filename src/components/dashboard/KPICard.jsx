import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function KPICard({ title, value, subtitle, icon: Icon, accentClass }) {
  return (
    <Card className="relative overflow-hidden p-5 border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", accentClass || "bg-primary/10")}>
          <Icon className={cn("w-5 h-5", accentClass ? "text-white" : "text-primary")} />
        </div>
      </div>
      <div className={cn("absolute bottom-0 left-0 right-0 h-1", accentClass || "bg-primary/20")} />
    </Card>
  );
}