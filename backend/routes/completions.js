const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// GET /api/completions
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('avances')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/completions/supplier/:supplierId
router.get('/supplier/:supplierId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('avances')
      .select('*')
      .eq('critical_supplier_id', req.params.supplierId);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/completions
router.post('/', async (req, res) => {
  try {
    const { critical_supplier_id, unit, matched_by, completion_date } = req.body;
    if (!critical_supplier_id || !unit) {
      return res.status(400).json({ error: 'critical_supplier_id y unit son requeridos' });
    }
    const { data, error } = await supabase
      .from('avances')
      .insert({ critical_supplier_id, unit, matched_by, completion_date })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/completions/batch
router.post('/batch', async (req, res) => {
  try {
    const { completions } = req.body;
    if (!completions?.length) return res.json({ inserted: 0, data: [] });
    const { data, error } = await supabase
      .from('avances')
      .insert(completions)
      .select();
    if (error) throw error;
    res.status(201).json({ inserted: data.length, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
