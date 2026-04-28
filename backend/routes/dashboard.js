const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// GET /api/dashboard/metrics
router.get('/metrics', async (_req, res) => {
  try {
    const { data, error } = await supabase.rpc('get_progress_detailed');
    if (error) throw error;

    const rows = data || [];

    // Group flat rows by the seccion column
    const sections = {};
    for (const row of rows) {
      const sec = row.seccion;
      if (!sections[sec]) sections[sec] = [];
      sections[sec].push(row);
    }

    res.json({
      resumen: sections.resumen?.[0] ?? null,
      total_por_unidad: sections.total_por_unidad ?? [],
      avance_por_tipo: sections.avance_por_tipo ?? [],
      detalle_por_unidad: sections.detalle_por_unidad ?? [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
