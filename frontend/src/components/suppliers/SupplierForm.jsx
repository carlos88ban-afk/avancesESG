import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { BUSINESS_UNITS, SUPPLIER_TYPES } from '@/lib/constants';
import { supplierService } from '@/api/services';

export default function SupplierForm({
  open,
  onClose,
  onSubmit,
  initialData,
  existingSuppliers = [],
  onDuplicate,
}) {
  // Relation fields (always editable)
  const [form, setForm] = useState({
    unit: initialData?.unit || '',
    type: initialData?.type || 'retail',
  });

  // The resolved base provider — pre-set in edit mode, chosen by search in create mode
  const [selectedProvider, setSelectedProvider] = useState(
    initialData?.proveedor_id
      ? { id: initialData.proveedor_id, name: initialData.name, ruc: initialData.ruc || '' }
      : null
  );

  // Name search state
  const [nameInput, setNameInput] = useState('');
  const [nameResults, setNameResults] = useState([]);
  const [nameSearching, setNameSearching] = useState(false);
  const [showNameDropdown, setShowNameDropdown] = useState(false);

  // RUC hard-validation state
  const [rucInput, setRucInput] = useState('');
  const [rucConflict, setRucConflict] = useState(null); // { id, name, ruc } when exact RUC exists

  // --- Computed ---

  // Is the resolved provider already assigned to the selected unit?
  const alreadyInUnitRelation = useMemo(() => {
    if (!selectedProvider || !form.unit) return null;
    return (
      existingSuppliers.find(
        (s) =>
          s.proveedor_id === selectedProvider.id &&
          s.unit === form.unit &&
          s.type === form.type &&
          s.id !== initialData?.id
      ) || null
    );
  }, [selectedProvider, form.unit, form.type, existingSuppliers, initialData]);

  const canSubmit =
    (selectedProvider || nameInput.trim().length > 0) &&
    !!form.unit &&
    !alreadyInUnitRelation &&
    !(rucConflict && !selectedProvider);

  // --- Effects ---

  // Debounced name search (350 ms) — only in create mode when no provider is selected
  useEffect(() => {
    const trimmed = nameInput.trim();
    if (trimmed.length < 2 || selectedProvider) {
      setNameResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setNameSearching(true);
      try {
        const results = await supplierService.search(trimmed);
        setNameResults(results || []);
      } catch {
        setNameResults([]);
      } finally {
        setNameSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [nameInput, selectedProvider]);

  // Debounced RUC search (400 ms) — hard validation: exact RUC must not already exist
  useEffect(() => {
    const ruc = rucInput.trim();
    if (ruc.length < 8 || selectedProvider) {
      setRucConflict(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await supplierService.search(ruc);
        const exact = (results || []).find((r) => r.ruc === ruc);
        setRucConflict(exact || null);
      } catch {
        setRucConflict(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [rucInput, selectedProvider]);

  // --- Handlers ---

  const handleSelectFromSearch = (provider) => {
    setSelectedProvider(provider);
    setNameInput(provider.name);
    setRucInput(provider.ruc || '');
    setNameResults([]);
    setRucConflict(null);
  };

  const handleAcceptRucConflict = () => {
    setSelectedProvider(rucConflict);
    setNameInput(rucConflict.name);
    setRucInput(rucConflict.ruc || '');
    setRucConflict(null);
  };

  const clearSelectedProvider = () => {
    setSelectedProvider(null);
    setNameInput('');
    setRucInput('');
    setRucConflict(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (selectedProvider) {
      // Caso A: link existing provider to unit
      onSubmit({
        proveedor_id: selectedProvider.id,
        unit: form.unit,
        type: form.type,
        status: initialData?.status || 'activo',
      });
    } else {
      // Caso B: create new base provider + link
      onSubmit({
        name: nameInput.trim(),
        ruc: rucInput.trim() || null,
        unit: form.unit,
        type: form.type,
        status: initialData?.status || 'activo',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Proveedor' : 'Nuevo Proveedor Crítico'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── PROVIDER BLOCK ─────────────────────────────── */}
          {selectedProvider ? (
            // Selected provider card
            <div className="space-y-1.5">
              <Label>Proveedor</Label>
              <div className="flex items-center gap-2 p-3 rounded-md bg-accent/10 border border-accent/30">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedProvider.name}</p>
                  {selectedProvider.ruc && (
                    <p className="text-xs text-muted-foreground font-mono">{selectedProvider.ruc}</p>
                  )}
                </div>
                {/* Only allow changing the provider in create mode */}
                {!initialData && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground"
                    onClick={clearSelectedProvider}
                    title="Cambiar proveedor"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            // Search inputs — create mode only
            <>
              {/* Name with API autocomplete */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Proveedor</Label>
                <div className="relative">
                  <Input
                    id="name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onFocus={() => setShowNameDropdown(true)}
                    onBlur={() => setShowNameDropdown(false)}
                    placeholder="Ej: SODEXO PERU"
                    autoComplete="off"
                    required
                  />
                  {nameSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  )}
                  {showNameDropdown && nameResults.length > 0 && (
                    <div className="absolute z-50 w-full top-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
                      <p className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground bg-muted/60 border-b">
                        Proveedores similares — selecciona para reutilizar
                      </p>
                      {nameResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectFromSearch(p)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-medium truncate">{p.name}</span>
                          {p.ruc && (
                            <span className="text-muted-foreground text-xs font-mono ml-auto shrink-0">
                              {p.ruc}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RUC — hard validation */}
              <div className="space-y-2">
                <Label htmlFor="ruc">RUC (opcional)</Label>
                <Input
                  id="ruc"
                  value={rucInput}
                  onChange={(e) => setRucInput(e.target.value)}
                  placeholder="20100130204"
                  autoComplete="off"
                />
                {rucConflict && (
                  <div className="flex items-center gap-2 p-2.5 rounded-md bg-amber-50 border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-800 flex-1">
                      Este RUC ya existe: <strong>{rucConflict.name}</strong>
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs border-amber-400 text-amber-800 hover:bg-amber-100 shrink-0"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleAcceptRucConflict}
                    >
                      Usar este
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── RELATION FIELDS ─────────────────────────────── */}

          <div className="space-y-2">
            <Label htmlFor="unit">Unidad de Negocio</Label>
            <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una unidad" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_UNITS.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          {/* ── WARNINGS ─────────────────────────────────────── */}

          {/* Same provider already in this unit */}
          {alreadyInUnitRelation && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong>{selectedProvider?.name}</strong> ya está registrado en{' '}
                <strong>{form.unit}</strong>.
                {onDuplicate && (
                  <button
                    type="button"
                    className="ml-1 underline font-medium"
                    onClick={() => onDuplicate(alreadyInUnitRelation)}
                  >
                    Editar esa relación
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Unresolved RUC conflict blocks submit */}
          {rucConflict && !selectedProvider && (
            <p className="text-xs text-destructive">
              Debes usar el proveedor existente o borrar el RUC para continuar.
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
