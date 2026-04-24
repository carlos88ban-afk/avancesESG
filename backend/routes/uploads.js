const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const supabase = require('../db/supabase');
const { parseExcelFile } = require('../lib/excelParser');
const { runMatchingEngine } = require('../lib/matchingEngine');
const { normalizeText } = require('../lib/constants');

const UPLOAD_DIR = path.join(__dirname, '..', 'tmp');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const isXlsx =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.originalname.toLowerCase().endsWith('.xlsx');
    if (isXlsx) cb(null, true);
    else cb(new Error('Solo se aceptan archivos .xlsx'));
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

// POST /api/uploads  — receive file, create upload record, return id
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

    const { data, error } = await supabase
      .from('uploads')
      .insert({
        original_filename: req.file.originalname,
        file_path: req.file.path,
        status: 'uploaded',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ id: data.id, filename: req.file.originalname });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/uploads/:fileId/process  — run full pipeline
router.post('/:fileId/process', async (req, res) => {
  const { fileId } = req.params;

  try {
    const { data: uploadRecord, error: fetchErr } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fetchErr || !uploadRecord) {
      return res.status(404).json({ error: 'Upload no encontrado' });
    }

    await supabase.from('uploads').update({ status: 'processing' }).eq('id', fileId);

    const filePath = uploadRecord.file_path;
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error('Archivo no encontrado en el servidor. Por favor vuelva a subir el archivo.');
    }

    // --- 1. Parse Excel ---
    const { records, sheetCount } = parseExcelFile(filePath);

    // --- 2. Deduplicate within the file by ruc+provider_name ---
    const seen = new Set();
    const uniqueRecords = records.filter((r) => {
      const key = `${normalizeText(r.ruc)}__${normalizeText(r.provider_name)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // --- 3. Upsert proveedores via RPC (insert or update by ruc+provider_name) ---
    for (const r of uniqueRecords) {
      const { error } = await supabase.rpc('upsert_proveedor', {
        p_ruc: r.ruc,
        p_provider_name: r.provider_name,
        p_unit: r.unit,
        p_update_date: r.update_date,
        p_upload_id: fileId,
      });
      if (error) throw error;
    }

    // --- 5. Load critical suppliers and existing avances ---
    const [{ data: criticalSuppliers, error: suppErr }, { data: existingAvances, error: avErr }] =
      await Promise.all([
        supabase.from('proveedores_criticos').select('*').eq('status', 'activo'),
        supabase.from('avances').select('critical_supplier_id, unit'),
      ]);

    if (suppErr) throw suppErr;
    if (avErr) throw avErr;

    // --- 6. Run matching engine against all records from this upload ---
    const newAvances = runMatchingEngine(
      uniqueRecords,
      criticalSuppliers ?? [],
      existingAvances ?? []
    );

    // --- 7. Insert new avances ---
    if (newAvances.length > 0) {
      const avancesWithUpload = newAvances.map((a) => ({ ...a, upload_id: fileId }));
      const { error: insertAvErr } = await supabase.from('avances').insert(avancesWithUpload);
      if (insertAvErr) throw insertAvErr;
    }

    const matchedSuppliers = new Set(newAvances.map((a) => a.critical_supplier_id)).size;

    // --- 8. Update upload record with results ---
    await supabase
      .from('uploads')
      .update({
        status: 'processed',
        total_sheets: sheetCount,
        total_records: uniqueRecords.length,
        new_completions: newAvances.length,
        matched_suppliers: matchedSuppliers,
        processed_at: new Date().toISOString(),
      })
      .eq('id', fileId);

    // Clean up temp file
    fs.unlink(filePath, () => {});

    res.json({
      totalSheets: sheetCount,
      totalRecords: uniqueRecords.length,
      newCompletions: newAvances.length,
      matchedSuppliers,
    });
  } catch (err) {
    await supabase
      .from('uploads')
      .update({ status: 'error', error_message: err.message })
      .eq('id', fileId);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/uploads/:fileId/status
router.get('/:fileId/status', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('uploads')
      .select('id, status, total_sheets, total_records, new_completions, matched_suppliers, error_message, processed_at')
      .eq('id', req.params.fileId)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Upload no encontrado' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
