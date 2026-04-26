const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// Flatten a proveedor_unidad row (with nested proveedores_criticos) to a plain object
function flattenRow(row) {
  return {
    id: row.id,
    proveedor_id: row.proveedores_criticos.id,
    name: row.proveedores_criticos.name,
    ruc: row.proveedores_criticos.ruc,
    unit: row.unit,
    type: row.type,
    status: row.status,
  };
}

const RELATION_SELECT = `
  id,
  unit,
  type,
  status,
  proveedores_criticos!inner (
    id,
    name,
    ruc
  )
`;

// GET /api/suppliers  (optional ?status=activo)
router.get('/', async (req, res) => {
  try {
    let query = supabase.from('proveedor_unidad').select(RELATION_SELECT);
    if (req.query.status) query = query.eq('status', req.query.status);
    const { data, error } = await query;
    if (error) throw error;
    const result = (data || [])
      .map(flattenRow)
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/suppliers/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('proveedor_unidad')
      .select(RELATION_SELECT)
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json(flattenRow(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/suppliers
router.post('/', async (req, res) => {
  try {
    const { name, ruc, unit, type, status } = req.body;
    if (!name || !unit || !type) {
      return res.status(400).json({ error: 'name, unit y type son requeridos' });
    }

    // --- 1. Find or create the base proveedor ---
    let proveedorData = null;

    // Try by RUC first (exact match)
    if (ruc?.trim()) {
      const { data } = await supabase
        .from('proveedores_criticos')
        .select('id, name, ruc')
        .eq('ruc', ruc.trim())
        .maybeSingle();
      proveedorData = data;
    }

    // Try by name (case-insensitive exact) if not found by RUC
    if (!proveedorData) {
      const { data } = await supabase
        .from('proveedores_criticos')
        .select('id, name, ruc')
        .ilike('name', name.trim())
        .maybeSingle();
      proveedorData = data;
    }

    // Create if not found
    if (!proveedorData) {
      const { data, error: createErr } = await supabase
        .from('proveedores_criticos')
        .insert({ name: name.trim(), ruc: ruc?.trim() || null, status: 'activo' })
        .select('id, name, ruc')
        .single();
      if (createErr) throw createErr;
      proveedorData = data;
    }

    // --- 2. Check for duplicate (proveedor_id, unit) ---
    const { data: existing } = await supabase
      .from('proveedor_unidad')
      .select('id, unit, type, status')
      .eq('proveedor_id', proveedorData.id)
      .eq('unit', unit)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        duplicate: true,
        message: 'El proveedor ya existe para esta unidad',
        existing: {
          id: existing.id,
          proveedor_id: proveedorData.id,
          name: proveedorData.name,
          ruc: proveedorData.ruc,
          unit: existing.unit,
          type: existing.type,
          status: existing.status,
        },
      });
    }

    // --- 3. Insert relation ---
    const { data: relation, error: relErr } = await supabase
      .from('proveedor_unidad')
      .insert({ proveedor_id: proveedorData.id, unit, type, status: status || 'activo' })
      .select('id, unit, type, status')
      .single();
    if (relErr) throw relErr;

    res.status(201).json({
      id: relation.id,
      proveedor_id: proveedorData.id,
      name: proveedorData.name,
      ruc: proveedorData.ruc,
      unit: relation.unit,
      type: relation.type,
      status: relation.status,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/suppliers/:id  (id = proveedor_unidad.id)
router.put('/:id', async (req, res) => {
  try {
    const { name, ruc, unit, type, status } = req.body;

    // Update proveedor_unidad
    const { data: relation, error: relErr } = await supabase
      .from('proveedor_unidad')
      .update({ unit, type, status })
      .eq('id', req.params.id)
      .select('id, unit, type, status, proveedor_id')
      .single();
    if (relErr) throw relErr;
    if (!relation) return res.status(404).json({ error: 'Relación no encontrada' });

    // Optionally update name / ruc in proveedores_criticos
    let proveedorData;
    if (name !== undefined || ruc !== undefined) {
      const updates = {};
      if (name !== undefined) updates.name = name.trim();
      if (ruc !== undefined) updates.ruc = ruc?.trim() || null;
      const { data, error: provErr } = await supabase
        .from('proveedores_criticos')
        .update(updates)
        .eq('id', relation.proveedor_id)
        .select('id, name, ruc')
        .single();
      if (provErr) throw provErr;
      proveedorData = data;
    } else {
      const { data, error: provErr } = await supabase
        .from('proveedores_criticos')
        .select('id, name, ruc')
        .eq('id', relation.proveedor_id)
        .single();
      if (provErr) throw provErr;
      proveedorData = data;
    }

    res.json({
      id: relation.id,
      proveedor_id: relation.proveedor_id,
      name: proveedorData.name,
      ruc: proveedorData.ruc,
      unit: relation.unit,
      type: relation.type,
      status: relation.status,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/suppliers/:id  — removes the relation only, not the base proveedor
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('proveedor_unidad')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Relación eliminada exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
