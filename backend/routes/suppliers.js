const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// GET /api/suppliers  (optional ?status=activo)
router.get('/', async (req, res) => {
  try {
    let query = supabase.from('proveedores_criticos').select('*').order('name');
    if (req.query.status) query = query.eq('status', req.query.status);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/suppliers/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('proveedores_criticos')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/suppliers
router.post('/', async (req, res) => {
  try {
    const { name, ruc, type, units, status } = req.body;
    if (!name || !type || !units?.length) {
      return res.status(400).json({ error: 'name, type y units son requeridos' });
    }
    const { data, error } = await supabase
      .from('proveedores_criticos')
      .insert({ name: name.trim(), ruc: ruc?.trim() || null, type, units, status: status || 'activo' })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, ruc, type, units, status } = req.body;
    const { data, error } = await supabase
      .from('proveedores_criticos')
      .update({
        name: name?.trim(),
        ruc: ruc?.trim() || null,
        type,
        units,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/suppliers/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('proveedores_criticos')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Proveedor eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
