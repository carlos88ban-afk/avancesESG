-- Run this script once in Supabase SQL Editor to initialize the database

-- Critical suppliers (managed via CRUD)
CREATE TABLE IF NOT EXISTS proveedores_criticos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  ruc         TEXT,
  type        TEXT        NOT NULL CHECK (type IN ('bienes', 'servicios', 'ambos')),
  units       TEXT[]      NOT NULL DEFAULT '{}',
  status      TEXT        NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upload sessions
CREATE TABLE IF NOT EXISTS uploads (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  original_filename   TEXT        NOT NULL,
  file_path           TEXT,
  status              TEXT        NOT NULL DEFAULT 'uploaded'
                        CHECK (status IN ('uploaded', 'processing', 'processed', 'error')),
  total_sheets        INTEGER,
  total_records       INTEGER,
  new_completions     INTEGER,
  matched_suppliers   INTEGER,
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at        TIMESTAMPTZ
);

-- Raw supplier rows extracted from uploaded xlsx files
CREATE TABLE IF NOT EXISTS proveedores (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ruc           TEXT,
  provider_name TEXT,
  unit          TEXT,
  update_date   DATE,
  upload_id     UUID        REFERENCES uploads(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Completion records: which critical supplier completed for which unit
CREATE TABLE IF NOT EXISTS avances (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  critical_supplier_id  UUID        NOT NULL REFERENCES proveedores_criticos(id) ON DELETE CASCADE,
  unit                  TEXT        NOT NULL,
  matched_by            TEXT        CHECK (matched_by IN ('ruc_exact', 'ruc_partial', 'name_match')),
  completion_date       DATE,
  upload_id             UUID        REFERENCES uploads(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (critical_supplier_id, unit)
);

CREATE INDEX IF NOT EXISTS idx_avances_supplier   ON avances(critical_supplier_id);
CREATE INDEX IF NOT EXISTS idx_proveedores_ruc     ON proveedores(ruc);
CREATE INDEX IF NOT EXISTS idx_proveedores_upload  ON proveedores(upload_id);
