const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const supabase = require('../db/supabase');
const { parseExcelFile } = require('../lib/excelParser');
const { normalizeText } = require('../lib/constants');

function dedupeKey(r) {
  return [
    r.ruc ?? '',
    normalizeText(r.provider_name),
    r.unit ?? '',
    r.update_date ?? '',
  ].join('__');
}

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

    // --- 2. Dedup within the file itself ---
    const seenKeys = new Set();
    const uniqueRecords = [];
    const duplicatesPreview = [];

    for (const r of records) {
      const key = dedupeKey(r);
      if (seenKeys.has(key)) {
        duplicatesPreview.push({
          reason: 'duplicate_in_file',
          ruc: r.ruc,
          provider_name: r.provider_name,
          unit: r.unit,
          update_date: r.update_date,
          duplicateKey: key,
        });
      } else {
        seenKeys.add(key);
        uniqueRecords.push(r);
      }
    }

    // --- 3. Fetch existing proveedores and build a key set ---
    const { data: existing, error: existingErr } = await supabase
      .from('proveedores')
      .select('id, ruc, provider_name, unit, update_date');

    if (existingErr) throw existingErr;

    const existingKeys = new Set(
      (existing ?? []).map((e) => dedupeKey(e))
    );

    // --- 4. Split unique records into new vs already in DB ---
    const newRecords = [];

    for (const r of uniqueRecords) {
      const key = dedupeKey(r);
      if (existingKeys.has(key)) {
        duplicatesPreview.push({
          reason: 'already_exists_in_db',
          ruc: r.ruc,
          provider_name: r.provider_name,
          unit: r.unit,
          update_date: r.update_date,
          duplicateKey: key,
        });
      } else {
        newRecords.push(r);
      }
    }

    // --- 5. Batch insert new proveedores ---
    const BATCH_SIZE = 200;

    for (let i = 0; i < newRecords.length; i += BATCH_SIZE) {
      const batch = newRecords.slice(i, i + BATCH_SIZE);

      const insertPayload = batch.map((r) => ({
        ruc: r.ruc,
        provider_name: r.provider_name,
        unit: r.unit,
        update_date: r.update_date,
        upload_id: fileId,
      }));

      const { error: insertErr } = await supabase.from('proveedores').insert(insertPayload);
      if (insertErr) throw insertErr;

      for (const r of batch) {
        existingKeys.add(dedupeKey(r));
      }
    }

    // --- 6. Update upload record ---
    await supabase
      .from('uploads')
      .update({
        status: 'processed',
        total_sheets: sheetCount,
        total_records: records.length,
        new_completions: 0,
        matched_suppliers: 0,
        processed_at: new Date().toISOString(),
      })
      .eq('id', fileId);

    // Clean up temp file
    fs.unlink(filePath, () => {});

    res.json({
      totalSheets: sheetCount,
      totalRecordsOriginal: records.length,
      uniqueRecords: uniqueRecords.length,
      insertedProviders: newRecords.length,
      skippedDuplicates: duplicatesPreview.length,
      duplicatesPreview: duplicatesPreview.slice(0, 200),
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
