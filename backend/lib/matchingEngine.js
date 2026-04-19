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

/**
 * Used by the Refresh button: checks each critical supplier against the full
 * proveedores table by name OR ruc (ignoring unit).
 *
 * Algorithm:
 *   1. Build O(1) lookup sets from all providers (one pass).
 *   2. For each critical supplier check if name OR ruc matches.
 *   3. If matched → create avances for ALL its units (not just the matched unit).
 *
 * @param {Array<{ruc: string|null, provider_name: string|null}>} allProviders
 * @param {Array<{id: string, name: string, ruc?: string, units: string[]}>} criticalSuppliers
 * @param {Array<{critical_supplier_id: string, unit: string}>} existingAvances
 */
function rematchSuppliers(allProviders, criticalSuppliers, existingAvances) {
  const today = new Date().toISOString().split('T')[0];

  // --- Build lookup sets from proveedores (O(n)) ---
  const nameSet   = new Set(); // normalized names
  const rucSet    = new Set(); // exact RUCs
  const rucShort  = new Set(); // RUCs without last digit

  for (const p of allProviders) {
    const norm = normalizeText(p.provider_name);
    if (norm) nameSet.add(norm);

    const ruc = (p.ruc || '').trim();
    if (ruc) {
      rucSet.add(ruc);
      if (ruc.length >= 2) rucShort.add(ruc.slice(0, -1));
    }
  }

  // --- Existing avances as Set for O(1) skip ---
  const existingKeys = new Set(
    existingAvances.map((a) => `${a.critical_supplier_id}__${a.unit}`)
  );

  const newAvances = [];

  for (const supplier of criticalSuppliers) {
    // --- Try to match by name OR ruc (no unit check) ---
    const normName  = normalizeText(supplier.name);
    const supRuc    = (supplier.ruc || '').trim();
    const supShort  = supRuc.length >= 2 ? supRuc.slice(0, -1) : '';

    let matchedBy = null;

    if (supRuc && rucSet.has(supRuc)) {
      matchedBy = 'ruc_exact';
    } else if (supShort && (rucShort.has(supShort) || rucSet.has(supShort))) {
      matchedBy = 'ruc_partial';
    } else if (normName && nameSet.has(normName)) {
      matchedBy = 'name_match';
    }

    if (!matchedBy) continue;

    // --- Mark ALL units of this supplier as completed ---
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
