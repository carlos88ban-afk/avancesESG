import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';
import { BUSINESS_UNITS, SUPPLIER_TYPES, normalizeText } from '@/lib/constants';

export default function SupplierForm({
  open,
  onClose,
  onSubmit,
  initialData,
  existingSuppliers = [],
  onDuplicate,
}) {
  const [form, setForm] = useState(initialData || {
    name: '',
    ruc: '',
    units: [],
    type: 'retail',
  });
  const [nameFocused, setNameFocused] = useState(false);
  const [rucFocused, setRucFocused] = useState(false);

  // Exclude the supplier being edited to avoid self-match
  const otherSuppliers = useMemo(
    () => existingSuppliers.filter((s) => s.id !== initialData?.id),
    [existingSuppliers, initialData]
  );

  // Partial name matches for autocomplete (min 2 chars)
  const nameMatches = useMemo(() => {
    const q = normalizeText(form.name);
    if (q.length < 2) return [];
    return otherSuppliers.filter((s) => normalizeText(s.name).includes(q));
  }, [form.name, otherSuppliers]);

  // Partial RUC matches for autocomplete (min 5 chars)
  const rucMatches = useMemo(() => {
    const q = form.ruc.trim();
    if (q.length < 5) return [];
    return otherSuppliers.filter((s) => s.ruc?.includes(q));
  }, [form.ruc, otherSuppliers]);

  // Exact duplicate: same normalized name OR same RUC (both non-empty)
  const hasExactDuplicate = useMemo(() => {
    const normName = normalizeText(form.name.trim());
    const rucVal = form.ruc.trim();
    return otherSuppliers.some(
      (s) =>
        (normName && normalizeText(s.name) === normName) ||
        (rucVal && s.ruc && s.ruc === rucVal)
    );
  }, [form.name, form.ruc, otherSuppliers]);

  const toggleUnit = (unit) => {
    setForm((prev) => ({
      ...prev,
      units: prev.units.includes(unit)
        ? prev.units.filter((u) => u !== unit)
        : [...prev.units, unit],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasExactDuplicate) return;
    onSubmit({ ...form, status: 'activo' });
  };

  const handleSelectDuplicate = (supplier) => {
    // Let the parent handle closing/reopening — it knows the modal context
    onDuplicate?.(supplier);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Proveedor' : 'Nuevo Proveedor Crítico'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Name with autocomplete dropdown */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Proveedor</Label>
            <div className="relative">
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                placeholder="Ej: SODEXO PERU"
                autoComplete="off"
                required
              />
              {nameFocused && nameMatches.length > 0 && (
                <div className="absolute z-50 w-full top-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
                  <p className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground bg-muted/60 border-b">
                    Proveedores existentes — haz clic para editar
                  </p>
                  {nameMatches.slice(0, 5).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectDuplicate(s)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-medium truncate">{s.name}</span>
                      {s.ruc && (
                        <span className="text-muted-foreground text-xs font-mono ml-auto shrink-0">{s.ruc}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RUC with autocomplete dropdown */}
          <div className="space-y-2">
            <Label htmlFor="ruc">RUC (opcional)</Label>
            <div className="relative">
              <Input
                id="ruc"
                value={form.ruc}
                onChange={(e) => setForm({ ...form, ruc: e.target.value })}
                onFocus={() => setRucFocused(true)}
                onBlur={() => setRucFocused(false)}
                placeholder="20100130204"
                autoComplete="off"
              />
              {rucFocused && rucMatches.length > 0 && (
                <div className="absolute z-50 w-full top-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
                  <p className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground bg-muted/60 border-b">
                    RUC ya registrado — haz clic para editar
                  </p>
                  {rucMatches.slice(0, 5).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectDuplicate(s)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-mono text-xs text-muted-foreground shrink-0">{s.ruc}</span>
                      <span className="font-medium truncate">{s.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Exact duplicate warning banner */}
          {hasExactDuplicate && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Ya existe un proveedor con este nombre o RUC. Selecciónalo arriba para editarlo en lugar de crear uno nuevo.
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPLIER_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Unidades de Negocio</Label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {BUSINESS_UNITS.map((unit) => (
                <label key={unit} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={form.units.includes(unit)}
                    onCheckedChange={() => toggleUnit(unit)}
                  />
                  <span className="text-xs">{unit}</span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button
              type="submit"
              disabled={!form.name || form.units.length === 0 || hasExactDuplicate}
            >
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
