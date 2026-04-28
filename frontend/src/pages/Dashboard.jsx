import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/api/services';
import { Target, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import KPICard from '../components/dashboard/KPICard';
import ProgressBar from '../components/dashboard/ProgressBar';
import UnitChart from '../components/dashboard/UnitChart';
import TypeChart from '../components/dashboard/TypeChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getMetrics(),
  });

  const resumen = dashboardData?.resumen;
  const detallePorUnidad = /** @type {any[]} */ (dashboardData?.detalle_por_unidad ?? []);
  const avancePorTipo = /** @type {any[]} */ (dashboardData?.avance_por_tipo ?? []);

  const unitData = detallePorUnidad.map((item) => ({
    unit: item.critico_para?.length > 18 ? item.critico_para.slice(0, 16) + '…' : item.critico_para,
    fullUnit: item.critico_para,
    completed: item.total_match,
    total: item.total_match,
    percentage: 100,
    retailCompleted: item.retail_match,
    noRetailCompleted: item.no_retail_match,
  }));

  const typeData = avancePorTipo.map((item) => ({
    type: item.tipo,
    completed: item.total_match,
    total: item.total_match,
    percentage: 100,
  }));

  const isEmpty = !resumen || (Number(resumen.z_total_proveedores_criticos_unicos) === 0 && unitData.length === 0);

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

      {isEmpty ? (
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
              value={`${resumen.porcentaje_avance_unicos}%`}
              subtitle={`${resumen.porcentaje_avance_incluye_duplicados}% avance general`}
              icon={TrendingUp}
              accentClass="bg-primary"
            />
            <KPICard
              title="Proveedores Críticos"
              value={resumen.z_total_proveedores_criticos_unicos}
              subtitle={`${resumen.a_total_proveedores_criticos_incluyendo_duplicados} total general`}
              icon={Target}
              accentClass="bg-accent"
            />
            <KPICard
              title="Completados"
              value={resumen.x_total_proveedores_unicos_match}
              subtitle={`${resumen.y_total_proveedores_incluyendo_duplicados_match} total general`}
              icon={CheckCircle2}
              accentClass=""
            />
            <KPICard
              title="Pendientes"
              value={resumen.b_pendientes_unicos}
              subtitle={`${resumen.c_pendientes_incluyendo_duplicados} total general`}
              icon={Clock}
              accentClass=""
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UnitChart data={unitData} />
            <TypeChart data={typeData} />
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Detalle por Unidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {unitData.map((item) => (
                <ProgressBar
                  key={item.fullUnit}
                  label={item.fullUnit}
                  completed={item.completed}
                  total={item.total}
                  className=""
                />
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
