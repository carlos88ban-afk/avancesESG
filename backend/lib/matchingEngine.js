const { matchSupplier, normalizeText } = require('./constants');

/**
 * Used during xlsx upload: matches each record against critical suppliers.
 * Business rule: if a supplier matches ANY record → mark ALL its units as completed.
 * O(records × suppliers)
 */
function runMatchingEngine(records, criticalSuppliers, existingAvances) {
  const existingKeys = new Set(
    existingAvances.map((a) => `${a.critical_supplier_id}__${a.unit}`)
  );

  const newAvances = new Map();

  for (const record of records) {
    for (const supplier of criticalSuppliers) {
      const matchType = matchSupplier(record, supplier);
      if (!matchType) continue;

      for (const unit of supplier.units || []) {
        const key = `${supplier.id}__${unit}`;
        if (!existingKeys.has(key) && !newAvances.has(key)) {
          newAvances.set(key, {
            critical_supplier_id: supplier.id,
            unit,
            matched_by: matchType,
            completion_date: record.update_date ?? new Date().toISOString().split('T')[0],
          });
        }
      }
    }
  }

  return [...newAvances.values()];
}

// --- Normalization helpers for rematch (error-tolerant) ---
const normalizeName = (str) =>
  (str || '').toLowerCase().trim().replace(/\s+/g, ' ');

const normalizeRuc = (ruc) =>
  (ruc || '').toString().replace(/\D/g, '').trim();

/**
 * Used by the Refresh button: tolerant matching of critical suppliers against
 * the full proveedores table by name OR ruc (unit is NOT considered).
 *
 * Match conditions — evaluated in priority order (first match wins):
 *   1. ruc_exact:   normalizeRuc(critico.ruc)  === normalizeRuc(proveedor.ruc)
 *   2. name_is_ruc: normalizeRuc(critico.name) === normalizeRuc(proveedor.ruc)
 *   3. ruc_partial: normalizeRuc(critico.ruc).slice(0,-1) === normalizeRuc(proveedor.ruc).slice(0,-1)
 *   4. name_match:  normalizeName(critico.name) === normalizeName(proveedor.provider_name)
 *
 * If matched → ALL units of that critical supplier are marked as completed.
 * O(providers + criticalSuppliers) — no nested loops.
 *
 * @param {Array<{ruc: string|null, provider_name: string|null}>} allProviders
 * @param {Array<{id: string, name: string, ruc?: string, units: string[]}>} criticalSuppliers
 * @param {Array<{critical_supplier_id: string, unit: string}>} existingAvances
 */
function rematchSuppliers(allProviders, criticalSuppliers, existingAvances) {
  const today = new Date().toISOString().split('T')[0];

  // --- Build O(1) lookup sets from proveedores (single pass) ---
  const nameSet  = new Set(); // normalized names
  const rucSet   = new Set(); // exact normalized RUCs
  const shortSet = new Set(); // RUCs with last digit removed (both sides truncated)

  for (const p of allProviders) {
    const name = normalizeName(p.provider_name);
    if (name) nameSet.add(name);

    const ruc = normalizeRuc(p.ruc);
    if (ruc) {
      rucSet.add(ruc);
      if (ruc.length >= 2) shortSet.add(ruc.slice(0, -1));
    }
  }

  // --- Existing avances for O(1) skip check ---
  const existingKeys = new Set(
    existingAvances.map((a) => `${a.critical_supplier_id}__${a.unit}`)
  );

  const newAvances = [];

  for (const supplier of criticalSuppliers) {
    const supName  = normalizeName(supplier.name);
    const supRuc   = normalizeRuc(supplier.ruc);
    const supShort = supRuc.length >= 2 ? supRuc.slice(0, -1) : '';

    const supNameAsRuc = normalizeRuc(supplier.name);

    let matchedBy = null;

    if (supRuc && rucSet.has(supRuc)) {
      matchedBy = 'ruc_exact';
    } else if (supNameAsRuc && rucSet.has(supNameAsRuc)) {
      matchedBy = 'name_is_ruc';
    } else if (supShort && shortSet.has(supShort)) {
      matchedBy = 'ruc_partial';
    } else if (supName && nameSet.has(supName)) {
      matchedBy = 'name_match';
    }

    if (!matchedBy) continue; // ← no match: skip this supplier

    // Match found → mark ALL units as completed (unit is irrelevant for matching)
    for (const unit of supplier.units || []) {
      const key = `${supplier.id}__${unit}`;
      if (!existingKeys.has(key)) {
        existingKeys.add(key); // prevent within-batch duplicates
        newAvances.push({
          critical_supplier_id: supplier.id,
          unit,
          matched_by: matchedBy,
          completion_date: today,
        });
      }
    }
  }

  return newAvances;
}

module.exports = { runMatchingEngine, rematchSuppliers };
