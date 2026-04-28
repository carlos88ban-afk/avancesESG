import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supplierService, completionService, dashboardService } from '@/api/services';
import { Target, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import KPICard from '../components/dashboard/KPICard';
import ProgressBar from '../components/dashboard/ProgressBar';
import UnitChart from '../components/dashboard/UnitChart';
import TypeChart from '../components/dashboard/TypeChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ['critical-suppliers'],
    queryFn: () => supplierService.getActive(),
  });

  const { data: completions = [], isLoading: loadingCompletions } = useQuery({
    queryKey: ['completions'],
    queryFn: () => completionService.getAll(),
  });

  const { data: dashboardMetrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => dashboardService.getMetrics(),
  });

  const metrics = useMemo(() => {
    if (!suppliers.length) return null;

    // Total expected = sum of all units across all suppliers
    let totalExpected = 0;
    const unitMap = {};
    const typeMap = {};

    suppliers.forEach((s) => {
      const units = s.units || [];
      totalExpected += units.length;

      units.forEach((u) => {
        if (!unitMap[u]) unitMap[u] = { total: 0, completed: 0 };
        unitMap[u].total++;
      });

      const type = s.type || 'ambos';
      if (!typeMap[type]) typeMap[type] = { total: 0, completed: 0 };
      typeMap[type].total += units.length;
    });

    // Mark completions
    const completionSet = new Set(completions.map((c) => `${c.critical_supplier_id}__${c.unit}`));
    let totalCompleted = 0;

    suppliers.forEach((s) => {
      const units = s.units || [];
      units.forEach((u) => {
        const key = `${s.id}__${u}`;
        if (completionSet.has(key)) {
          totalCompleted++;
          if (unitMap[u]) unitMap[u].completed++;
          const type = s.type || 'ambos';
          if (typeMap[type]) typeMap[type].completed++;
        }
      });
    });

    const globalPct = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;

    const unitData = Object.entries(unitMap)
      .map(([unit, d]) => ({
        unit: unit.length > 18 ? unit.slice(0, 16) + '…' : unit,
        fullUnit: unit,
        completed: d.completed,
        total: d.total,
        percentage: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const typeData = Object.entries(typeMap).map(([type, d]) => ({
      type,
      completed: d.completed,
      total: d.total,
      percentage: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
    }));

    return {
      totalSuppliers: suppliers.length,
      totalExpected,
      totalCompleted,
      pending: totalExpected - totalCompleted,
      globalPct,
      unitData,
      typeData,
    };
  }, [suppliers, completions]);

  const isLoading = loadingSuppliers || loadingCompletions;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitoreo del avance de encuestas ESG</p>
      </div>

      {!metrics || metrics.totalSuppliers === 0 ? (
        <Card className="border-0 shadow-sm p-12 text-center">
          <Target className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <h2 className="text-lg font-semibold mb-1">Sin datos aún</h2>
          <p className="text-sm text-muted-foreground">Agrega proveedores críticos y carga un archivo para comenzar.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Avance Global"
              value={dashboardMetrics ? `${dashboardMetrics.pct_unicos}%` : `${metrics.globalPct}%`}
              subtitle={
                dashboardMetrics
                  ? `${dashboardMetrics.pct_total}% avance general · ${dashboardMetrics.x_unicos_match} únicos / ${dashboardMetrics.y_total_match} total`
                  : `${metrics.totalCompleted} de ${metrics.totalExpected} completados`
              }
              icon={TrendingUp}
              accentClass="bg-primary"
            />
            <KPICard
              title="Proveedores Críticos"
              value={metrics.totalSuppliers}
              subtitle="Activos en el sistema"
              icon={Target}
              accentClass="bg-accent"
            />
            <KPICard
              title="Completados"
              value={metrics.totalCompleted}
              subtitle="Encuestas confirmadas"
              icon={CheckCircle2}
            />
            <KPICard
              title="Pendientes"
              value={metrics.pending}
              subtitle="Encuestas faltantes"
              icon={Clock}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UnitChart data={metrics.unitData} />
            <TypeChart data={metrics.typeData} />
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Detalle por Unidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {metrics.unitData.map((item) => (
                <ProgressBar
                  key={item.fullUnit}
                  label={item.fullUnit}
                  completed={item.completed}
                  total={item.total}
                />
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}