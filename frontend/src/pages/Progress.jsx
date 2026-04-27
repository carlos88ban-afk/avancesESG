import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { progressService } from '@/api/services';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, CheckCircle2, XCircle, Filter, RefreshCw, Info } from 'lucide-react';

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

/** @param {string | null | undefined} dateStr */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

/**
 * @param {string[]} arr
 * @param {string} val
 * @returns {string[]}
 */
function toggle(arr, val) {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

export default function Progress() {
  const queryClient = useQueryClient();
  const [unitFilter, setUnitFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: () => progressService.getAll(),
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });
  /** @type {any[]} */
  const rows = data ?? [];

  const uniqueUnits = [...new Set(rows.map((/** @type {any} */ r) => r.critico_para).filter(Boolean))].sort();
  const uniqueYears = [...new Set(rows.filter(r => r.fecha_respuesta).map(r => r.fecha_respuesta.slice(0, 4)))].sort();
  const activeMonths = new Set(rows.filter(r => r.fecha_respuesta).map(r => r.fecha_respuesta.slice(5, 7)));

  const hasAnyFilter =
    unitFilter !== 'all' || tipoFilter !== 'all' || statusFilter !== 'all' ||
    search || selectedYears.length > 0 || selectedMonths.length > 0;

  const filteredRows = useMemo(() => {
    const hasDateFilter = selectedYears.length > 0 || selectedMonths.length > 0;
    return rows.filter(r => {
      if (unitFilter !== 'all' && r.critico_para !== unitFilter) return false;
      if (tipoFilter !== 'all' && r.tipo !== tipoFilter) return false;
      if (statusFilter !== 'all' && r.estado !== statusFilter) return false;
      if (hasDateFilter) {
        if (!r.fecha_respuesta) return false;
        const yr = r.fecha_respuesta.slice(0, 4);
        const mo = r.fecha_respuesta.slice(5, 7);
        if (selectedYears.length > 0 && !selectedYears.includes(yr)) return false;
        if (selectedMonths.length > 0 && !selectedMonths.includes(mo)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (r.proveedor || '').toLowerCase().includes(q) || (r.ruc || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [rows, unitFilter, tipoFilter, statusFilter, selectedYears, selectedMonths, search]);

  const completedCount = filteredRows.filter(r => r.estado === 'completado').length;
  const pendingCount = filteredRows.filter(r => r.estado === 'pendiente').length;
  const total = filteredRows.length;
  const Provider = /** @type {any} */ (TooltipProvider);

  return (
    <Provider>
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Avances</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Estado de completación de encuestas ESG por proveedor y unidad
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-2"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['progress'] })}
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proveedor o RUC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-56"
            />
          </div>
          <Select value={unitFilter} onValueChange={setUnitFilter}>
            <SelectTrigger className="w-full sm:w-52">
              <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Crítico para" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las unidades</SelectItem>
              {uniqueUnits.map(u => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="no retail">No retail</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="completado">Completado</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
          </div>
        )}

        <div className="flex gap-3">
          <Badge variant="outline" className="text-sm px-3 py-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-accent" />
            {completedCount} completados ({total ? Math.round((completedCount / total) * 100) : 0}%)
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            <XCircle className="w-3.5 h-3.5 mr-1.5 text-destructive" />
            {pendingCount} pendientes ({total ? Math.round((pendingCount / total) * 100) : 0}%)
          </Badge>
        </div>

        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Proveedor</TableHead>
                  <TableHead>RUC</TableHead>
                  <TableHead>Crítico para</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha respuesta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Método Match</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      {Array(7).fill(0).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      {hasAnyFilter
                        ? 'No se encontraron registros con los filtros seleccionados'
                        : 'No hay datos disponibles'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((r, i) => (
                    <TableRow
                      key={`${r.proveedor}-${r.critico_para}-${i}`}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-medium">{r.proveedor}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{r.ruc || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{r.critico_para || '—'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize text-[10px]">{r.tipo || '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(r.fecha_respuesta)}
                      </TableCell>
                      <TableCell>
                        {r.estado === 'completado' ? (
                          <Badge className="bg-accent text-accent-foreground">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Completado
                          </Badge>
                        ) : (
                          <Badge className="bg-destructive/10 text-destructive border border-destructive/20">
                            <XCircle className="w-3 h-3 mr-1" />
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.tipo_de_cruce ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">{r.tipo_de_cruce}</span>
                            {r.respondio_en && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3.5 h-3.5 text-muted-foreground/50 cursor-help shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                  <p className="font-medium mb-0.5">Respondió en</p>
                                  <p>{r.respondio_en}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </Provider>
  );
}
