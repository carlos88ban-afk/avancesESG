export const BUSINESS_UNITS = [
  "SUPERMERCADOS PERUANOS",
  "INKAFARMA",
  "FARMACIAS PERUANAS",
  "REAL PLAZA",
  "FINANCIERA OH",
  "SIP",
  "INTERCORP RETAIL",
  "QUIMICA SUIZA"
];

export const UNIT_NORMALIZATION = {
  "QUIMICA SUIZA": "FARMACIAS PERUANAS",
  "FINANCIERA OH": "SIP"
};

export const SUPPLIER_TYPES = ["bienes", "servicios", "ambos"];

export function normalizeText(text) {
  if (!text) return "";
  return text
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

export function normalizeUnit(unit) {
  const normalized = normalizeText(unit);
  for (const [key, value] of Object.entries(UNIT_NORMALIZATION)) {
    if (normalized.includes(normalizeText(key))) {
      return value;
    }
  }
  return normalized;
}

export function matchSupplier(record, criticalSupplier) {
  // 1. RUC exacto
  if (record.ruc && criticalSupplier.ruc && record.ruc === criticalSupplier.ruc) {
    return "ruc_exact";
  }
  // 2. RUC sin último dígito
  if (record.ruc && criticalSupplier.ruc && record.ruc.length >= 2 && criticalSupplier.ruc.length >= 2) {
    const recordRucShort = record.ruc.slice(0, -1);
    const criticalRucShort = criticalSupplier.ruc.slice(0, -1);
    if (recordRucShort === criticalRucShort || record.ruc === criticalRucShort || recordRucShort === criticalSupplier.ruc) {
      return "ruc_partial";
    }
  }
  // 3. Nombre normalizado
  const normRecordName = normalizeText(record.provider_name);
  const normCriticalName = normalizeText(criticalSupplier.name);
  if (normRecordName && normCriticalName && normRecordName === normCriticalName) {
    return "name_match";
  }
  return null;
}