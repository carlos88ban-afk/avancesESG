const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

const PAGE_SIZE = 1000;
const MAX_PAGES = 1000;

// GET /api/evaluacion
router.get('/', async (_req, res) => {
  try {
    const allData = [];
    let offset = 0;
    let page = 0;

    while (page < MAX_PAGES) {
      const { data, error } = await supabase.rpc('get_proveedores_evaluacion', {
        p_limit: PAGE_SIZE,
        p_offset: offset,
      });

      if (error) throw error;

      const rows = Array.isArray(data) ? data : [];

      console.log(`[evaluacion] offset=${offset}, rows=${rows.length}`);

      allData.push(...rows);

      if (rows.length < PAGE_SIZE) break;

      offset += PAGE_SIZE;
      page += 1;
    }

    if (page >= MAX_PAGES) {
      throw new Error('Se alcanzo el limite maximo de paginacion al obtener evaluacion');
    }

    console.log(`[evaluacion] total=${allData.length}`);

    res.json(allData);
  } catch (err) {
    console.error('[evaluacion] error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
