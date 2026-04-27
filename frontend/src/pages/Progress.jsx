import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { progressService } from '@/api/services';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, CheckCircle2, XCircle, Filter, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function formatMonth(yyyyMM) {
  const [year, month] = yyyyMM.split('-');
  return new Date(Number(year), Number(month) - 1).toLocaleDateString('es-PE', {
    month: 'long',
    year: 'numeric',
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function Progress() {
  const queryClient = useQueryClient();
  const [unitFilter, setUnitFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [showResponded, setShowResponded] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: () => progressService.getAll(),
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const uniqueUnits = [...new Set(
    rows.flatMap(r => (r.critico_para || '').split(',').map(u => u.trim()).filter(Boolean))
  )].sort();

  const uniqueMonths = [...new Set(
    rows.filter(r => r.fecha_respuesta).map(r => r.fecha_respuesta.slice(0, 7))
  )].sort();

  const toggleMonth = (month) =>
    setSelectedMonths(prev =>
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );

  const filteredRows = useMemo(() => {
    return rows
      .map(r => ({ ...r, status: r.fecha_respuesta ? 'completado' : 'pendiente' }))
      .filter(r => {
        if (unitFilter !== 'all' && !(r.critico_para || '').includes(unitFilter)) return false;
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        if (selectedMonths.length > 0) {
          if (!r.fecha_respuesta) return false;
          if (!selectedMonths.includes(r.fecha_respuesta.slice(0, 7))) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          return (r.proveedor || '').toLowerCase().includes(q) || (r.ruc || '').toLowerCase().includes(q);
        }
        return true;
      });
  }, [rows, unitFilter, statusFilter, selectedMonths, search]);

  const completedCount = filteredRows.filter(r => r.status === 'completado').length;
  const pendingCount = filteredRows.filter(r => r.status === 'pendiente').length;
  const total = filteredRows.length;
  const colSpan = showResponded ? 7 : 6;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Avances</h1>
          <p className="text-sm text-muted-foreground mt-1">Estado de completación de encuestas ESG por proveedor y unidad</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowResponded(v => !v)}
          >
            {showResponded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showResponded ? 'Ocultar respondido en' : 'Respondido en'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['progress'] })}
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>
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

      {uniqueMonths.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">Mes:</span>
          {uniqueMonths.map(month => (
            <button
              key={month}
              onClick={() => toggleMonth(month)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors capitalize ${
                selectedMonths.includes(month)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {formatMonth(month)}
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
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Método Match</TableHead>
                {showResponded && <TableHead>Respondió en</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(colSpan).fill(0).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="text-center py-12 text-muted-foreground">
                    No se encontraron registros
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((r, i) => (
                  <TableRow key={r.ruc ? `${r.ruc}-${i}` : i} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{r.proveedor}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{r.ruc || '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(r.critico_para || '').split(',').map(u => u.trim()).filter(Boolean).map(u => (
                          <Badge key={u} variant="outline" className="text-[10px]">{u}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(r.fecha_respuesta)}
                    </TableCell>
                    <TableCell>
                      {r.status === 'completado' ? (
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
                    <TableCell className="text-xs text-muted-foreground">
                      {r.tipo_de_cruce || '—'}
                    </TableCell>
                    {showResponded && (
                      <TableCell className="text-xs text-muted-foreground">
                        {r.respondio_en || '—'}
                      </TableCell>
                    )}
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
