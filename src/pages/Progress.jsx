import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supplierService, completionService } from '@/api/services';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, CheckCircle2, XCircle, Filter } from 'lucide-react';
import { SUPPLIER_TYPES } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

export default function Progress() {
  const [unitFilter, setUnitFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ['critical-suppliers'],
    queryFn: () => supplierService.getActive(),
  });

  const { data: completions = [], isLoading: loadingCompletions } = useQuery({
    queryKey: ['completions'],
    queryFn: () => completionService.getAll(),
  });

  const rows = useMemo(() => {
    const completionSet = new Set(completions.map((c) => `${c.critical_supplier_id}__${c.unit}`));
    const result = [];

    suppliers.forEach((s) => {
      (s.units || []).forEach((unit) => {
        const key = `${s.id}__${unit}`;
        const isCompleted = completionSet.has(key);
        const completion = completions.find(c => c.critical_supplier_id === s.id && c.unit === unit);

        result.push({
          id: key,
          supplierName: s.name,
          ruc: s.ruc,
          unit,
          type: s.type,
          status: isCompleted ? 'completado' : 'pendiente',
          matchedBy: completion?.matched_by || null,
          completionDate: completion?.completion_date || null,
        });
      });
    });

    return result;
  }, [suppliers, completions]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (unitFilter !== 'all' && r.unit !== unitFilter) return false;
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.supplierName.toLowerCase().includes(q) || (r.ruc || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [rows, unitFilter, typeFilter, statusFilter, search]);

  const completedCount = filteredRows.filter((r) => r.status === 'completado').length;
  const pendingCount = filteredRows.filter((r) => r.status === 'pendiente').length;

  const isLoading = loadingSuppliers || loadingCompletions;

  const uniqueUnits = [...new Set(suppliers.flatMap(s => s.units || []))].sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Avances</h1>
        <p className="text-sm text-muted-foreground mt-1">Estado de completación de encuestas ESG por proveedor y unidad</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full sm:w-56"
          />
        </div>
        <Select value={unitFilter} onValueChange={setUnitFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Unidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las unidades</SelectItem>
            {uniqueUnits.map((u) => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {SUPPLIER_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
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

      <div className="flex gap-3">
        <Badge variant="outline" className="text-sm px-3 py-1">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-accent" />
          {completedCount} completados
        </Badge>
        <Badge variant="outline" className="text-sm px-3 py-1">
          <XCircle className="w-3.5 h-3.5 mr-1.5 text-destructive" />
          {pendingCount} pendientes
        </Badge>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Proveedor</TableHead>
                <TableHead>RUC</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Método Match</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(6).fill(0).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No se encontraron registros
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{r.supplierName}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{r.ruc || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{r.unit}</Badge>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{r.type}</Badge></TableCell>
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
                    <TableCell>
                      {r.matchedBy ? (
                        <span className="text-xs text-muted-foreground">
                          {r.matchedBy === 'ruc_exact' && 'RUC exacto'}
                          {r.matchedBy === 'ruc_partial' && 'RUC parcial'}
                          {r.matchedBy === 'name_match' && 'Nombre'}
                        </span>
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
  );
}