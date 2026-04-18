const { matchSupplier } = require('./constants');

/**
 * Matches uploaded records against critical suppliers and returns new avances to insert.
 * Business rule: if a supplier matches ANY record → mark ALL its units as completed.
 *
 * @param {Array<{ruc: string|null, provider_name: string|null, update_date: string|null}>} records
 * @param {Array<{id: string, name: string, ruc?: string, units: string[]}>} criticalSuppliers
 * @param {Array<{critical_supplier_id: string, unit: string}>} existingAvances
 * @returns {Array<{critical_supplier_id: string, unit: string, matched_by: string, completion_date: string|null}>}
 */
function runMatchingEngine(records, criticalSuppliers, existingAvances) {
  const existingKeys = new Set(
    existingAvances.map((a) => `${a.critical_supplier_id}__${a.unit}`)
  );

  // key → avance object (prevents duplicates within this batch)
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

module.exports = { runMatchingEngine };
