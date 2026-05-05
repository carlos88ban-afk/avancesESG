import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { evaluacionService, progressService } from '@/api/services';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2 } from 'lucide-react';

const TYPE_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'critical', label: 'Crítico' },
  { value: 'non-critical', label: 'No crítico' },
];

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
  const parts = dateStr.split('T')[0].split('-');
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function toggle(arr, val) {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizeRuc(value) {
  return String(value || '').replace(/\D/g, '');
}

function getProviderKey(row) {
  const ruc = normalizeRuc(row?.ruc);
  if (ruc) return `ruc:${ruc}`;
  return `name:${normalizeText(row?.nombre || row?.name || row?.proveedor)}`;
}

function mapProgressRowToEvaluationRow(row) {
  return {
    nombre: row.proveedor,
    ruc: row.ruc,
    unidad: row.critico_para,
    fecha: row.fecha_respuesta,
  };
}

export default function EvaluacionProveedores() {
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['evaluacion-proveedores'],
    queryFn: () => evaluacionService.getAll(),
    refetchOnWindowFocus: true,
  });

  const { data: progressData = [], isLoading: isLoadingProgress } = useQuery({
    queryKey: ['progress'],
    queryFn: () => progressService.getAll(),
    refetchOnWindowFocus: true,
  });

  const rows = Array.isArray(data) ? data : [];
  const progressRows = Array.isArray(progressData) ? progressData : [];

  const completedCriticalRows = useMemo(() => {
    const seenProviders = new Set();

    return progressRows
      .filter(row => row.estado === 'completado')
      .filter(row => {
        const providerKey = getProviderKey(row);
        if (!providerKey || seenProviders.has(providerKey)) return false;
        seenProviders.add(providerKey);
        return true;
      })
      .map(mapProgressRowToEvaluationRow);
  }, [progressRows]);

  const allCriticalProviderKeys = useMemo(() => {
    const keys = new Set();

    progressRows.forEach(supplier => {
      const ruc = normalizeRuc(supplier.ruc);
      const name = normalizeText(supplier.proveedor);
      if (ruc) keys.add(`ruc:${ruc}`);
      if (name) keys.add(`name:${name}`);
    });

    return keys;
  }, [progressRows]);

  const completedCriticalProviderKeys = useMemo(() => {
    const keys = new Set();

    completedCriticalRows.forEach(supplier => {
      const ruc = normalizeRuc(supplier.ruc);
      const name = normalizeText(supplier.nombre);
      if (ruc) keys.add(`ruc:${ruc}`);
      if (name) keys.add(`name:${name}`);
    });

    return keys;
  }, [completedCriticalRows]);

  const uniqueUnits = useMemo(
    () => [...new Set(rows.map(r => r.unidad).filter(Boolean))].sort(),
    [rows]
  );

  const uniqueYears = useMemo(
    () => [...new Set(rows.filter(r => r.fecha).map(r => String(r.fecha).slice(0, 4)))].sort(),
    [rows]
  );

  const activeMonths = useMemo(
    () => new Set(rows.filter(r => r.fecha).map(r => String(r.fecha).slice(5, 7))),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const baseRows = typeFilter === 'critical' ? completedCriticalRows : rows;

    return baseRows.filter(r => {
      const ruc = normalizeRuc(r.ruc);
      const name = normalizeText(r.nombre);
      const isCritical = (ruc && allCriticalProviderKeys.has(`ruc:${ruc}`)) ||
        (name && allCriticalProviderKeys.has(`name:${name}`));
      const isCompletedCritical = (ruc && completedCriticalProviderKeys.has(`ruc:${ruc}`)) ||
        (name && completedCriticalProviderKeys.has(`name:${name}`));

      if (typeFilter === 'critical' && !isCompletedCritical) return false;
      if (typeFilter === 'non-critical' && isCritical) return false;
      if (selectedUnits.length > 0 && !selectedUnits.includes(r.unidad)) return false;
      if (selectedYears.length > 0 || selectedMonths.length > 0) {
        if (!r.fecha) return false;
        const dateStr = String(r.fecha);
        const yr = dateStr.slice(0, 4);
        const mo = dateStr.slice(5, 7);
        if (selectedYears.length > 0 && !selectedYears.includes(yr)) return false;
        if (selectedMonths.length > 0 && !selectedMonths.includes(mo)) return false;
      }
      return true;
    });
  }, [rows, completedCriticalRows, selectedYears, selectedMonths, selectedUnits, typeFilter, allCriticalProviderKeys, completedCriticalProviderKeys]);

  const hasFilters = selectedYears.length > 0 || selectedMonths.length > 0 || selectedUnits.length > 0 || typeFilter !== 'all';
  const isPageLoading = isLoading || isLoadingProgress;
  const showFilters = !isPageLoading && rows.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Proveedores con Evaluación Completada</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Listado de proveedores que completaron la evaluación ESG
        </p>
      </div>

      {showFilters && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground w-10">Tipo:</span>
            {TYPE_FILTERS.map(option => (
              <button
                key={option.value}
                onClick={() => setTypeFilter(option.value)}
                className={
                  'text-xs px-2.5 py-1 rounded-full border transition-colors ' +
                  (typeFilter === option.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50')
                }
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground w-10">Año:</span>
            {uniqueYears.map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedYears(prev => toggle(prev, yr))}
                className={
                  'text-xs px-2.5 py-1 rounded-full border transition-colors ' +
                  (selectedYears.includes(yr)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50')
                }
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

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground w-10">Mes:</span>
            {MONTHS.filter(m => activeMonths.has(m.value)).map(m => (
              <button
                key={m.value}
                onClick={() => setSelectedMonths(prev => toggle(prev, m.value))}
                className={
                  'text-xs px-2.5 py-1 rounded-full border transition-colors ' +
                  (selectedMonths.includes(m.value)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50')
                }
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

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground w-10">Unidad:</span>
            {uniqueUnits.map(u => (
              <button
                key={u}
                onClick={() => setSelectedUnits(prev => toggle(prev, u))}
                className={
                  'text-xs px-2.5 py-1 rounded-full border transition-colors ' +
                  (selectedUnits.includes(u)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50')
                }
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

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-sm px-3 py-1">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-accent" />
          {filteredRows.length} {filteredRows.length === 1 ? 'proveedor' : 'proveedores'}
          {hasFilters ? ' encontrados' : ' en total'}
        </Badge>
      </div>

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
              {isPageLoading
                ? Array(6).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      {Array(4).fill(0).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : filteredRows.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                        {hasFilters
                          ? 'No se encontraron proveedores con los filtros seleccionados'
                          : 'No hay datos disponibles'}
                      </TableCell>
                    </TableRow>
                  )
                  : filteredRows.map((r, i) => (
                      <TableRow
                        key={r.ruc + '-' + i}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-medium">{r.nombre}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {r.ruc || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {r.unidad || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(r.fecha)}
                        </TableCell>
                      </TableRow>
                    ))
              }
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
