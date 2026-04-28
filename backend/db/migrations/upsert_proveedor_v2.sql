-- Ejecutar en Supabase SQL Editor
-- Migración: columna provider_name_clean + nueva lógica upsert_proveedor

-- 1. Columna generada (equivalente a normalizeText en JS)
ALTER TABLE proveedores
  ADD COLUMN IF NOT EXISTS provider_name_clean TEXT GENERATED ALWAYS AS (
    TRIM(REGEXP_REPLACE(REGEXP_REPLACE(UPPER(COALESCE(provider_name, '')), '[^A-Z0-9 ]', '', 'g'), ' +', ' ', 'g'))
  ) STORED;

-- 2. Constraint única sobre (ruc, provider_name_clean)
--    Si hay duplicados previos en la tabla, eliminarlos primero.
ALTER TABLE proveedores
  ADD CONSTRAINT proveedores_ruc_name_clean_unique
  UNIQUE (ruc, provider_name_clean);

-- 3. Función upsert: duplicado = mismo ruc + mismo provider_name_clean.
--    En duplicado: sólo actualiza update_date.
--    En caso contrario: inserta nuevo registro.
CREATE OR REPLACE FUNCTION public.upsert_proveedor(
  p_ruc           TEXT,
  p_provider_name TEXT,
  p_unit          TEXT,
  p_update_date   DATE,
  p_upload_id     UUID
)
RETURNS VOID
LANGUAGE sql
AS $$
  INSERT INTO proveedores (ruc, provider_name, unit, update_date, upload_id)
  VALUES (p_ruc, p_provider_name, p_unit, p_update_date, p_upload_id)
  ON CONFLICT (ruc, provider_name_clean)
  DO UPDATE SET update_date = EXCLUDED.update_date;
$$;
