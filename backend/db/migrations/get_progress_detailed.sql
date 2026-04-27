-- Ejecutar en Supabase SQL Editor
-- Fuente de verdad para la página Progress

CREATE OR REPLACE FUNCTION public.get_progress_detailed()
RETURNS TABLE (
  proveedor   text,
  ruc         text,
  critico_para text,
  tipo        text,
  respondio_en text,
  fecha_respuesta date,
  tipo_de_cruce text,
  estado      text
)
LANGUAGE sql
STABLE
AS $$
  WITH base AS (
    SELECT * FROM public.get_supplier_matches_detailed()
  ),
  pc AS (
    SELECT p.id, p.name, p.ruc
    FROM proveedores_criticos p
    WHERE p.status = 'activo'
  ),
  unidad_tipo AS (
    SELECT pu.proveedor_id, pu.unit, pu.type
    FROM proveedor_unidad pu
    WHERE pu.status = 'activo'
  )
  SELECT
    pc.name          AS proveedor,
    pc.ruc,
    ut.unit          AS critico_para,
    ut.type          AS tipo,
    b.respondio_en,
    b.fecha_respuesta,
    b.tipo_de_cruce,
    CASE
      WHEN b.respondio_en IS NULL THEN 'pendiente'
      ELSE 'completado'
    END              AS estado
  FROM pc
  LEFT JOIN unidad_tipo ut ON ut.proveedor_id = pc.id
  LEFT JOIN base b
    ON b.proveedor   = pc.name
   AND b.critico_para = ut.unit
  ORDER BY pc.name, ut.unit;
$$;
