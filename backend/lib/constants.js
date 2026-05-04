const UNIT_NORMALIZATION = {
  'SUPERMERCADOS PERUANOS': 'SPSA',
  'INKAFARMA': 'FARMACIAS PERUANAS',
  'QUIMICA SUIZA': 'FARMACIAS PERUANAS',
  'FINANCIERA OH': 'IFXP',
};

function normalizeText(text) {
  if (!text) return '';
  return text
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

function normalizeUnit(unit) {
  const normalized = normalizeText(unit);
  for (const [key, value] of Object.entries(UNIT_NORMALIZATION)) {
    if (normalized.includes(normalizeText(key))) return value;
  }
  return normalized;
}

/**
 * Returns the match type if record matches criticalSupplier, or null.
 * @param {{ ruc?: string, provider_name?: string }} record
 * @param {{ ruc?: string, name: string }} criticalSupplier
 * @returns {'ruc_exact'|'ruc_partial'|'name_match'|null}
 */
function matchSupplier(record, criticalSupplier) {
  const recRuc = (record.ruc || '').trim();
  const criRuc = (criticalSupplier.ruc || '').trim();

  if (recRuc && criRuc && recRuc === criRuc) return 'ruc_exact';

  if (recRuc.length >= 2 && criRuc.length >= 2) {
    const recShort = recRuc.slice(0, -1);
    const criShort = criRuc.slice(0, -1);
    if (recShort === criShort || recRuc === criShort || recShort === criRuc) {
      return 'ruc_partial';
    }
  }

  const normRecord = normalizeText(record.provider_name);
  const normCritical = normalizeText(criticalSupplier.name);
  if (normRecord && normCritical && normRecord === normCritical) return 'name_match';

  return null;
}

module.exports = { normalizeText, normalizeUnit, matchSupplier };
