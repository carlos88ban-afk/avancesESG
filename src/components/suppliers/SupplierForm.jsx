import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { BUSINESS_UNITS, SUPPLIER_TYPES } from '@/lib/constants';

export default function SupplierForm({ open, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(initialData || {
    name: '',
    ruc: '',
    units: [],
    type: 'bienes',
  });

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
    onSubmit({ ...form, status: 'activo' });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Proveedor' : 'Nuevo Proveedor Crítico'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Proveedor</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: SODEXO PERU"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ruc">RUC (opcional)</Label>
            <Input
              id="ruc"
              value={form.ruc}
              onChange={(e) => setForm({ ...form, ruc: e.target.value })}
              placeholder="20100130204"
            />
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
          <div className="space-y-2">
            <Label>Unidades de Negocio</Label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {BUSINESS_UNITS.filter(u => u !== "QUIMICA SUIZA" && u !== "FINANCIERA OH").map((unit) => (
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
            <Button type="submit" disabled={!form.name || form.units.length === 0}>Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}