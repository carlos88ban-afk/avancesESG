import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierService } from '@/api/services';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pencil, Trash2, AlertTriangle, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import SupplierForm from '../components/suppliers/SupplierForm';

export default function Suppliers() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);

  // Each item: { id (proveedor_unidad), proveedor_id, name, ruc, unit, type, status }
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['critical-suppliers-all'],
    queryFn: () => supplierService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => supplierService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['critical-suppliers-all'] });
      queryClient.invalidateQueries({ queryKey: ['critical-suppliers'] });
      toast.success('Proveedor creado exitosamente');
      setShowForm(false);
    },
    onError: (err) => {
      const body = /** @type {any} */ (err)?.response?.data;
      if (body?.duplicate && body?.existing) {
        toast.warning(body.message || 'El proveedor ya existe para esta unidad');
        setShowForm(false);
        setEditing(body.existing);
      } else {
        toast.error(body?.error || err.message || 'Error al crear proveedor');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => supplierService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['critical-suppliers-all'] });
      queryClient.invalidateQueries({ queryKey: ['critical-suppliers'] });
      toast.success('Proveedor actualizado exitosamente');
      setEditing(null);
    },
    onError: (err) => {
      const body = /** @type {any} */ (err)?.response?.data;
      toast.error(body?.error || err.message || 'Error al actualizar proveedor');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => supplierService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['critical-suppliers-all'] });
      queryClient.invalidateQueries({ queryKey: ['critical-suppliers'] });
      toast.success('Relación eliminada');
      setDeleteTarget(null);
    },
    onError: (err) => {
      const body = /** @type {any} */ (err)?.response?.data;
      toast.error(body?.error || err.message || 'Error al eliminar');
    },
  });

  const unitOptions = [...new Set(suppliers.map((s) => s.unit).filter(Boolean))].sort();
  const typeOptions = [...new Set(suppliers.map((s) => s.type).filter(Boolean))].sort();

  const toggleFilter = (value, selectedValues, setSelectedValues) => {
    setSelectedValues(
      selectedValues.includes(value)
        ? selectedValues.filter((item) => item !== value)
        : [...selectedValues, value]
    );
  };

  const filtered = suppliers.filter((s) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.ruc?.toLowerCase().includes(q) ||
      s.unit?.toLowerCase().includes(q);
    const matchesUnit = selectedUnits.length === 0 || selectedUnits.includes(s.unit);
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(s.type);

    return matchesSearch && matchesUnit && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proveedores Críticos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de proveedores que deben completar encuestas ESG
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Agregar Proveedor
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, RUC o unidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="justify-start">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Unidad
                {selectedUnits.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{selectedUnits.length}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Crítico para</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {unitOptions.map((unit) => (
                <DropdownMenuCheckboxItem
                  key={unit}
                  checked={selectedUnits.includes(unit)}
                  onCheckedChange={() => toggleFilter(unit, selectedUnits, setSelectedUnits)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {unit}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="justify-start">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Tipo
                {selectedTypes.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{selectedTypes.length}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Tipo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {typeOptions.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => toggleFilter(type, selectedTypes, setSelectedTypes)}
                  onSelect={(e) => e.preventDefault()}
                  className="capitalize"
                >
                  {type}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-sm font-medium text-muted-foreground">
          {filtered.length} proveedores encontrados
        </p>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nombre</TableHead>
              <TableHead>RUC</TableHead>
              <TableHead>Crítico para</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <TableRow key={i}>
                  {Array(5).fill(0).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  {search || selectedUnits.length > 0 || selectedTypes.length > 0
                    ? 'Sin resultados para los filtros aplicados'
                    : 'No hay proveedores registrados'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {s.ruc || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{s.unit}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">{s.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditing(s)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(s)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {showForm && (
        <SupplierForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          existingSuppliers={suppliers}
          onDuplicate={(supplier) => {
            setShowForm(false);
            setEditing(supplier);
          }}
        />
      )}

      {editing && (
        <SupplierForm
          key={editing.id}
          open={!!editing}
          onClose={() => setEditing(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editing.id, data })}
          initialData={editing}
          existingSuppliers={suppliers}
          onDuplicate={(supplier) => setEditing(supplier)}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Eliminar relación
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Eliminar a <strong>{deleteTarget?.name}</strong> de la unidad{' '}
              <strong>{deleteTarget?.unit}</strong>? El proveedor base no será eliminado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
