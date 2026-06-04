-- ============================================================
-- MIGRACIÓN v2: Schema Completo RouteAI
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ------------------------------------------------------------
-- PASO 1: Agregar columna planActivo a Empresa
-- (la columna "activa" ya existe, solo agregamos planActivo)
-- ------------------------------------------------------------
ALTER TABLE "Empresa"
  ADD COLUMN IF NOT EXISTS "planActivo" BOOLEAN NOT NULL DEFAULT false;

-- ------------------------------------------------------------
-- PASO 2: Agregar columna telefono a Usuario
-- ------------------------------------------------------------
ALTER TABLE "Usuario"
  ADD COLUMN IF NOT EXISTS "telefono" TEXT;

-- ------------------------------------------------------------
-- PASO 3: Agregar columnas nuevas a Pedido
-- lat/lng para geocodificación, clienteTelefono para Twilio,
-- scoreRiesgo como FLOAT (antes era INT), rutaId para Ruta
-- ------------------------------------------------------------
ALTER TABLE "Pedido"
  ADD COLUMN IF NOT EXISTS "clienteTelefono" TEXT,
  ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "rutaId" TEXT;

-- Cambiar scoreRiesgo de INT a FLOAT si no es ya float
ALTER TABLE "Pedido"
  ALTER COLUMN "scoreRiesgo" TYPE DOUBLE PRECISION USING CAST("scoreRiesgo" AS DOUBLE PRECISION);

-- ------------------------------------------------------------
-- PASO 4: Crear tabla Ruta
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Ruta" (
  "id"              TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "fecha"           DATE        NOT NULL,
  "estado"          TEXT        NOT NULL DEFAULT 'pendiente',
  "rutaOptimizada"  JSONB,
  "empresaId"       TEXT        NOT NULL,
  "repartidorId"    TEXT        NOT NULL,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Ruta_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Ruta_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE,
  CONSTRAINT "Ruta_repartidorId_fkey"
    FOREIGN KEY ("repartidorId") REFERENCES "Usuario"("id")
);

-- Foreign key de Pedido → Ruta (ahora que Ruta existe)
ALTER TABLE "Pedido"
  ADD CONSTRAINT "Pedido_rutaId_fkey"
  FOREIGN KEY ("rutaId") REFERENCES "Ruta"("id")
  ON DELETE SET NULL
  NOT VALID; -- NOT VALID para no validar filas existentes (nulls)

-- ------------------------------------------------------------
-- PASO 5: Crear tabla Ubicacion
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Ubicacion" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "lat"          DOUBLE PRECISION NOT NULL,
  "lng"          DOUBLE PRECISION NOT NULL,
  "timestamp"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "repartidorId" TEXT        NOT NULL,
  "empresaId"    TEXT        NOT NULL,
  CONSTRAINT "Ubicacion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Ubicacion_repartidorId_fkey"
    FOREIGN KEY ("repartidorId") REFERENCES "Usuario"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Ubicacion_repartidorId_timestamp_idx"
  ON "Ubicacion" ("repartidorId", "timestamp");

-- ------------------------------------------------------------
-- PASO 6: Crear tabla Alerta
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Alerta" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "tipo"         TEXT        NOT NULL, -- desvio | retraso | riesgo_alto
  "mensaje"      TEXT        NOT NULL,
  "leida"        BOOLEAN     NOT NULL DEFAULT false,
  "empresaId"    TEXT        NOT NULL,
  "repartidorId" TEXT,
  "pedidoId"     TEXT,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Alerta_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Alerta_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE,
  CONSTRAINT "Alerta_repartidorId_fkey"
    FOREIGN KEY ("repartidorId") REFERENCES "Usuario"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "Alerta_empresaId_leida_idx"
  ON "Alerta" ("empresaId", "leida");

-- ------------------------------------------------------------
-- PASO 7: Crear tabla ReporteCache
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ReporteCache" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "fecha"     DATE        NOT NULL,
  "datos"     JSONB       NOT NULL,
  "empresaId" TEXT        NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ReporteCache_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReporteCache_empresaId_fecha_key"
    UNIQUE ("empresaId", "fecha"),
  CONSTRAINT "ReporteCache_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE
);

-- ============================================================
-- PASO 8: RLS — Habilitar y crear políticas para tablas nuevas
-- ============================================================

-- Habilitar RLS
ALTER TABLE "Ruta"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ubicacion"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Alerta"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReporteCache" ENABLE ROW LEVEL SECURITY;

-- Helper (ya existe, pero por si acaso)
CREATE OR REPLACE FUNCTION get_empresa_id_del_usuario()
RETURNS TEXT AS $$
  SELECT "empresaId"
  FROM "Usuario"
  WHERE id = auth.uid()::text
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ---- RUTA ----
CREATE POLICY "ruta_select" ON "Ruta" FOR SELECT
  USING ("empresaId" = get_empresa_id_del_usuario());

CREATE POLICY "ruta_insert" ON "Ruta" FOR INSERT
  WITH CHECK ("empresaId" = get_empresa_id_del_usuario());

CREATE POLICY "ruta_update" ON "Ruta" FOR UPDATE
  USING ("empresaId" = get_empresa_id_del_usuario());

CREATE POLICY "ruta_delete" ON "Ruta" FOR DELETE
  USING ("empresaId" = get_empresa_id_del_usuario());

-- ---- UBICACION ----
CREATE POLICY "ubicacion_select" ON "Ubicacion" FOR SELECT
  USING ("empresaId" = get_empresa_id_del_usuario());

CREATE POLICY "ubicacion_insert" ON "Ubicacion" FOR INSERT
  WITH CHECK ("empresaId" = get_empresa_id_del_usuario());

-- ---- ALERTA ----
CREATE POLICY "alerta_select" ON "Alerta" FOR SELECT
  USING ("empresaId" = get_empresa_id_del_usuario());

CREATE POLICY "alerta_insert" ON "Alerta" FOR INSERT
  WITH CHECK ("empresaId" = get_empresa_id_del_usuario());

CREATE POLICY "alerta_update" ON "Alerta" FOR UPDATE
  USING ("empresaId" = get_empresa_id_del_usuario());

-- ---- REPORTE CACHE ----
CREATE POLICY "reporte_select" ON "ReporteCache" FOR SELECT
  USING ("empresaId" = get_empresa_id_del_usuario());

CREATE POLICY "reporte_insert" ON "ReporteCache" FOR INSERT
  WITH CHECK ("empresaId" = get_empresa_id_del_usuario());

CREATE POLICY "reporte_update" ON "ReporteCache" FOR UPDATE
  USING ("empresaId" = get_empresa_id_del_usuario());

-- ============================================================
-- FIN DE MIGRACIÓN
-- Verificar con:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
-- ============================================================
