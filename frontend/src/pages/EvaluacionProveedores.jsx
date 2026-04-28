import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { evaluacionService } from '@/api/services';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2 } from 'lucide-react';

const MONTHS = [
  { value: '01', label: 'Ene' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Abr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Ago' },
  { value: '09', label: 'Set' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dic' },
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

function toggle(arr, val) {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

export default function EvaluacionProveedores() {
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ['evaluacion-proveedores'],
    queryFn: () => evaluacionService.getAll().then(r => r.data),
    refetchOnWindowFocus: true,
  });

  const rows = data ?? [];

  const uniqueUnits = useMemo(
    () => [...new Set(rows.map(r => r.unidad).filter(Boolean))].sort(),
    [rows]
  );

  const uniqueYears = useMemo(
    () => [...new Set(rows.filter(r => r.fecha).map(r => r.fecha.slice(0, 4)))].sort(),
    [rows]
  );

  const activeMonths = useMemo(
    () => new Set(rows.filter(r => r.fecha).map(r => r.fecha.slice(5, 7))),
    [rows]
  );

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (selectedUnits.length > 0 && !selectedUnits.includes(r.unidad)) return false;
      if (selectedYears.length > 0 || selectedMonths.length > 0) {
        if (!r.fecha) return false;
        const yr = r.fecha.slice(0, 4);
        const mo = r.fecha.slice(5, 7);
        if (selectedYears.length > 0 && !selectedYears.includes(yr)) return false;
        if (selectedMonths.length > 0 && !selectedMonths.includes(mo)) return false;
      }
      return true;
    });
  }, [rows, selectedYears, selectedMonths, selectedUnits]);

  const hasFilters = selectedYears.length > 0 || selectedMonths.length > 0 || selectedUnits.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Proveedores con Evaluación Completada</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Listado de proveedores que completaron la evaluación ESG
        </p>
      </div>

      {/* Filtros de año */}
      {uniqueYears.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground min-w-[2.5rem]">Año:</span>
            {uniqueYears.map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedYears(prev => toggle(prev, yr))}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  selectedYears.includes(yr)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {yr}
              </button>
            ))}
            {selectedYears.length > 0 && (
              <button
                onClick={() => setSelectedYears([])}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Filtros de mes */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground min-w-[2.5rem]">Mes:</span>
            {MONTHS.filter(m => activeMonths.has(m.value)).map(m => (
              <button
                key={m.value}
                onClick={() => setSelectedMonths(prev => toggle(prev, m.value))}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  selectedMonths.includes(m.value)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {m.label}
              </button>
            ))}
            {selectedMonths.length > 0 && (
              <button
                onClick={() => setSelectedMonths([])}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Filtros de unidad */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground min-w-[2.5rem]">Unidad:</span>
            {uniqueUnits.map(u => (
              <button
                key={u}
                onClick={() => setSelectedUnits(prev => toggle(prev, u))}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  selectedUnits.includes(u)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {u}
              </button>
            ))}
            {selectedUnits.length > 0 && (
              <button
                onClick={() => setSelectedUnits([])}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Contador */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-sm px-3 py-1">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-accent" />
          {filteredRows.length} {filteredRows.length === 1 ? 'proveedor' : 'proveedores'}
          {hasFilters ? ' encontrados' : ' en total'}
        </Badge>
      </div>

      {/* Tabla */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nombre</TableHead>
                <TableHead>RUC</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Fecha de evaluación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(4).fill(0).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    {hasFilters
                      ? 'No se encontraron proveedores con los filtros seleccionados'
                      : 'No hay datos disponibles'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((r, i) => (
                  <TableRow
                    key={`${r.ruc}-${i}`}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium">{r.nombre}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{r.ruc || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{r.unidad || '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(r.fecha)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
