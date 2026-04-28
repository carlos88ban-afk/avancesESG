-- Ejecutar en Supabase SQL Editor
-- Fuente de verdad para la página Progress

CREATE OR REPLACE FUNCTION public.get_progress_detailed()
RETURNS TABLE (
  proveedor       text,
  ruc             text,
  critico_para    text,
  tipo            text,
  fecha_respuesta date,
  estado          text,
  tipo_de_cruce   text,
  respondio_en    text
)
LANGUAGE sql
STABLE
AS $$
  WITH p AS (
    SELECT
      LOWER(TRIM(provider_name))                                    AS col_nombre,
      LOWER(TRIM(ruc))                                              AS col_ruc,
      LEFT(LOWER(TRIM(ruc)), LENGTH(TRIM(ruc)) - 1)                AS col_ruc_sin_dv,
      provider_name,
      ruc,
      unit,
      update_date
    FROM proveedores
  ),
  pc AS (
    SELECT
      pc.id,
      pc.name,
      pc.ruc,
      pu.unit  AS critico_para,
      pu.type  AS tipo
    FROM proveedores_criticos pc
    LEFT JOIN proveedor_unidad pu
      ON pu.proveedor_id = pc.id
  ),
  matches AS (
    SELECT
      pc.name          AS proveedor,
      pc.ruc,
      pc.critico_para,
      pc.tipo,
      p.update_date    AS fecha_respuesta,
      p.unit           AS respondio_en,
      CASE
        WHEN p.col_ruc = LOWER(TRIM(pc.ruc))                                          THEN 'ruc_exacto'
        WHEN p.col_ruc = LEFT(LOWER(TRIM(pc.ruc)), LENGTH(TRIM(pc.ruc)) - 1)         THEN 'ruc_sin_dv'
        WHEN p.col_nombre = LOWER(TRIM(pc.name))                                      THEN 'nombre'
        ELSE NULL
      END AS tipo_de_cruce
    FROM pc
    LEFT JOIN p
      ON (
        p.col_nombre = LOWER(TRIM(pc.name))
        OR p.col_ruc = LOWER(TRIM(pc.ruc))
        OR p.col_ruc = LEFT(LOWER(TRIM(pc.ruc)), LENGTH(TRIM(pc.ruc)) - 1)
      )
  )
  SELECT
    proveedor,
    ruc,
    critico_para,
    tipo,
    fecha_respuesta,
    CASE
      WHEN tipo_de_cruce IS NOT NULL THEN 'completado'
      ELSE 'pendiente'
    END AS estado,
    tipo_de_cruce,
    respondio_en
  FROM matches;
$$;
