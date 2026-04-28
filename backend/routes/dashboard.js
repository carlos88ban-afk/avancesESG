const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// GET /api/dashboard/metrics
router.get('/metrics', async (_req, res) => {
  try {
    const [metricsResult, detailResult] = await Promise.all([
      supabase.rpc('get_dashboard_metrics'),
      supabase.rpc('get_progress_detailed'),
    ]);

    if (metricsResult.error) throw metricsResult.error;
    if (detailResult.error) throw detailResult.error;

    const m = metricsResult.data?.[0] ?? {};
    const resumenData = {
      x_total_proveedores_unicos_match:              m.x_unicos_match       ?? 0,
      y_total_proveedores_incluyendo_duplicados_match: m.y_total_match       ?? 0,
      z_total_proveedores_criticos_unicos:            m.z_unicos_total       ?? 0,
      a_total_proveedores_criticos_incluyendo_duplicados: m.a_total          ?? 0,
      b_pendientes_unicos:                            m.b_pendientes_unicos  ?? 0,
      c_pendientes_incluyendo_duplicados:             m.c_pendientes_total   ?? 0,
      porcentaje_avance_unicos:                       Number(m.pct_unicos    ?? 0),
      porcentaje_avance_incluye_duplicados:           Number(m.pct_total     ?? 0),
    };

    const completed = (detailResult.data || []).filter((r) => r.estado === 'completado');

    const unitMap = {};
    for (const row of completed) {
      const unit = row.critico_para;
      if (!unitMap[unit]) unitMap[unit] = { critico_para: unit, total_match: 0, retail_match: 0, no_retail_match: 0 };
      unitMap[unit].total_match++;
      if (row.tipo === 'retail') unitMap[unit].retail_match++;
      else unitMap[unit].no_retail_match++;
    }
    const detallePorUnidad = Object.values(unitMap);

    const tipoMap = {};
    for (const row of completed) {
      const tipo = row.tipo;
      if (!tipoMap[tipo]) tipoMap[tipo] = { tipo, total_match: 0 };
      tipoMap[tipo].total_match++;
    }
    const avancePorTipo = Object.values(tipoMap);

    res.json([
      { seccion: 'resumen', data: resumenData },
      { seccion: 'total_por_unidad', data: detallePorUnidad.map((u) => ({ critico_para: u.critico_para, total_match: u.total_match })) },
      { seccion: 'avance_por_tipo', data: avancePorTipo },
      { seccion: 'detalle_por_unidad', data: detallePorUnidad },
    ]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
