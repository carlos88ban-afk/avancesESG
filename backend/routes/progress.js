const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// GET /api/progress
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase.rpc('get_progress_detailed');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
