const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// GET /api/dashboard/metrics
router.get('/metrics', async (_req, res) => {
  try {
    const [metricsResult, detailedResult] = await Promise.all([
      supabase.rpc('get_dashboard_metrics'),
      supabase.rpc('get_progress_detailed'),
    ]);

    if (metricsResult.error) throw metricsResult.error;
    if (detailedResult.error) throw detailedResult.error;

    const metricsRow = Array.isArray(metricsResult.data)
      ? metricsResult.data[0]
      : metricsResult.data;

    const rows = detailedResult.data || [];

    // Aggregate per-unit and per-type from get_progress_detailed()
    const unitMap = {};
    const typeMap = {};

    for (const row of rows) {
      const unit = row.unit || '';
      const type = row.type || 'ambos';
      const total = Number(row.total ?? 0);
      const completed = Number(row.completed ?? 0);
      const retailCompleted = Number(row.retail_completed ?? 0);
      const noRetailCompleted = Number(row.no_retail_completed ?? 0);

      if (!unitMap[unit]) {
        unitMap[unit] = { total: 0, completed: 0, retailCompleted: 0, noRetailCompleted: 0 };
      }
      unitMap[unit].total += total;
      unitMap[unit].completed += completed;
      unitMap[unit].retailCompleted += retailCompleted;
      unitMap[unit].noRetailCompleted += noRetailCompleted;

      if (!typeMap[type]) typeMap[type] = { total: 0, completed: 0 };
      typeMap[type].total += total;
      typeMap[type].completed += completed;
    }

    const unitData = Object.entries(unitMap)
      .map(([unit, d]) => ({
        unit: unit.length > 18 ? unit.slice(0, 16) + '…' : unit,
        fullUnit: unit,
        completed: d.completed,
        total: d.total,
        percentage: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
        retailCompleted: d.retailCompleted,
        noRetailCompleted: d.noRetailCompleted,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const typeData = Object.entries(typeMap).map(([type, d]) => ({
      type,
      completed: d.completed,
      total: d.total,
      percentage: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
    }));

    res.json({ metrics: metricsRow, unitData, typeData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
