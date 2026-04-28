const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// GET /api/dashboard/metrics
router.get('/metrics', async (_req, res) => {
  try {
    const { data, error } = await supabase.rpc('get_progress_detailed');
    if (error) throw error;

    const rows = data || [];

    const completed = rows.filter((r) => r.estado === 'completado');

    const uniqueRucs = new Set(rows.map((r) => r.ruc));
    const uniqueCompletedRucs = new Set(completed.map((r) => r.ruc));

    const z = uniqueRucs.size;
    const x = uniqueCompletedRucs.size;
    const a = rows.length;
    const y = completed.length;

    const resumenData = {
      x_total_proveedores_unicos_match: x,
      y_total_proveedores_incluyendo_duplicados_match: y,
      z_total_proveedores_criticos_unicos: z,
      a_total_proveedores_criticos_incluyendo_duplicados: a,
      b_pendientes_unicos: z - x,
      c_pendientes_incluyendo_duplicados: a - y,
      porcentaje_avance_unicos: z > 0 ? Math.round((x / z) * 1000) / 10 : 0,
      porcentaje_avance_incluye_duplicados: a > 0 ? Math.round((y / a) * 1000) / 10 : 0,
    };

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

    const totalPorUnidad = detallePorUnidad.map((u) => ({
      critico_para: u.critico_para,
      total_match: u.total_match,
    }));

    res.json([
      { seccion: 'resumen', data: resumenData },
      { seccion: 'total_por_unidad', data: totalPorUnidad },
      { seccion: 'avance_por_tipo', data: avancePorTipo },
      { seccion: 'detalle_por_unidad', data: detallePorUnidad },
    ]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
