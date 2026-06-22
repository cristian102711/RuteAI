-- ============================================================
-- Migración manual: SLA de pedidos + estado "cancelado" + timeline
-- Aplicar en Supabase → SQL Editor (no requiere Node/Prisma).
-- Idempotente: usa IF NOT EXISTS para poder re-ejecutarse sin error.
-- ============================================================

-- 1) Nuevos campos en Pedido (SLA, tiempos, motivos, intentos)
ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "fechaEntregaLimite" TIMESTAMP(3);
ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "despachadoEn"       TIMESTAMP(3);
ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "entregadoEn"        TIMESTAMP(3);
ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "canceladoEn"        TIMESTAMP(3);
ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "intentosEntrega"    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "entregaSinFoto"     BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "motivoCancelacion"  TEXT;

-- 2) Timeline / auditoría de eventos del pedido
CREATE TABLE IF NOT EXISTS "EventoPedido" (
  "id"             TEXT NOT NULL,
  "pedidoId"       TEXT NOT NULL,
  "tipo"           TEXT NOT NULL,
  "estadoAnterior" TEXT,
  "estadoNuevo"    TEXT,
  "motivo"         TEXT,
  "descripcion"    TEXT,
  "actorId"        TEXT,
  "actorNombre"    TEXT,
  "metadata"       JSONB,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventoPedido_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EventoPedido_pedidoId_createdAt_idx"
  ON "EventoPedido" ("pedidoId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EventoPedido_pedidoId_fkey'
  ) THEN
    ALTER TABLE "EventoPedido"
      ADD CONSTRAINT "EventoPedido_pedidoId_fkey"
      FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 3) Auditoría del core: velocidad GPS en Ubicacion (hallazgo #4)
ALTER TABLE "Ubicacion" ADD COLUMN IF NOT EXISTS "velocidad" DOUBLE PRECISION;

-- 4) Unificar el estado por defecto de Ruta con el catálogo de la API (#3)
ALTER TABLE "Ruta" ALTER COLUMN "estado" SET DEFAULT 'planificada';
