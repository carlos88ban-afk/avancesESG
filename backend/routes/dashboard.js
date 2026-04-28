const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// GET /api/dashboard/metrics
router.get('/metrics', async (_req, res) => {
  try {
    const { data, error } = await supabase.rpc('get_dashboard_metrics');
    if (error) throw error;
    // RPC returns an array with one row
    const row = Array.isArray(data) ? data[0] : data;
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
