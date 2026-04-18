const XLSX = require('xlsx');
const { normalizeUnit } = require('./constants');

/**
 * Parses an xlsx file and extracts supplier records from all sheets.
 * Expected columns: B = update date, D = RUC, E = supplier name.
 * Row 1 is treated as header and skipped.
 *
 * @param {string} filePath
 * @returns {{ records: Array<{unit: string, ruc: string|null, provider_name: string|null, update_date: string|null}>, sheetCount: number }}
 */
function parseExcelFile(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const records = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const unit = normalizeUnit(sheetName);

    const ref = sheet['!ref'];
    if (!ref) continue;

    const range = XLSX.utils.decode_range(ref);

    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const dateCell = sheet[XLSX.utils.encode_cell({ r: row, c: 1 })]; // B
      const rucCell  = sheet[XLSX.utils.encode_cell({ r: row, c: 3 })]; // D
      const nameCell = sheet[XLSX.utils.encode_cell({ r: row, c: 4 })]; // E

      if (!rucCell && !nameCell) continue;

      const ruc           = rucCell  ? String(rucCell.v  ?? '').trim() || null : null;
      const provider_name = nameCell ? String(nameCell.v ?? '').trim() || null : null;

      if (!ruc && !provider_name) continue;

      records.push({ unit, ruc, provider_name, update_date: parseDate(dateCell) });
    }
  }

  return { records, sheetCount: workbook.SheetNames.length };
}

function parseDate(cell) {
  if (!cell) return null;
  if (cell.t === 'd' && cell.v instanceof Date) {
    return cell.v.toISOString().split('T')[0];
  }
  if (cell.t === 'n') {
    const parsed = XLSX.SSF.parse_date_code(cell.v);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
  }
  if (cell.t === 's') {
    const d = new Date(cell.v);
    if (!isNaN(d)) return d.toISOString().split('T')[0];
  }
  return null;
}

module.exports = { parseExcelFile };
