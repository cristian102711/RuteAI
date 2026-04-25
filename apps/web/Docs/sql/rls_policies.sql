-- ============================================================
--  RouteAI — Políticas de Row Level Security (RLS)
--  Ejecutar en: Supabase Dashboard → SQL Editor
--  Fecha de generación: 2026-04-17
-- ============================================================
-- IMPORTANTE: Las tablas son gestionadas por Prisma y viven en
-- el schema "public". Supabase Auth vive en "auth.users".
-- El JWT del usuario logueado expone auth.uid() para las policies.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 0. HABILITAR RLS EN TODAS LAS TABLAS CRITICAS
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public."Empresa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Usuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Pedido"  ENABLE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────────────────────
-- 1. HELPER FUNCTION: Obtener la empresaId del usuario logueado
-- Evita repetir la sub-query en cada policy.
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_empresa_id_del_usuario()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER -- Ejecuta con permisos del owner, no del llamador (evita recursión RLS)
AS $$
  SELECT "empresaId"
  FROM public."Usuario"
  WHERE id = auth.uid()::text
  LIMIT 1;
$$;


-- ──────────────────────────────────────────────────────────────
-- 2. TABLA: Empresa
-- Regla: Un usuario solo puede VER su propia empresa.
-- Regla: Solo el sistema (service_role) puede CREAR empresas.
-- ──────────────────────────────────────────────────────────────

-- Limpiar policies anteriores si existen
DROP POLICY IF EXISTS "usuarios ven su empresa" ON public."Empresa";

-- Policy de SELECT
CREATE POLICY "usuarios ven su empresa"
  ON public."Empresa"
  FOR SELECT
  TO authenticated
  USING (id = public.get_empresa_id_del_usuario());


-- ──────────────────────────────────────────────────────────────
-- 3. TABLA: Usuario
-- Regla: Un usuario solo puede VER los miembros de su empresa.
-- Regla: Solo puede EDITAR su propio perfil.
-- ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "usuarios ven compañeros de empresa" ON public."Usuario";
DROP POLICY IF EXISTS "usuario edita su propio perfil"     ON public."Usuario";

-- Policy de SELECT (Ver todos los de tu empresa)
CREATE POLICY "usuarios ven compañeros de empresa"
  ON public."Usuario"
  FOR SELECT
  TO authenticated
  USING ("empresaId" = public.get_empresa_id_del_usuario());

-- Policy de UPDATE (Solo tu propio perfil)
CREATE POLICY "usuario edita su propio perfil"
  ON public."Usuario"
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);


-- ──────────────────────────────────────────────────────────────
-- 4. TABLA: Pedido  ← EL MÁS CRÍTICO
-- Regla: Todos los CRUD aislados por empresaId del usuario.
-- ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "empresa ve sus pedidos"    ON public."Pedido";
DROP POLICY IF EXISTS "empresa crea sus pedidos"  ON public."Pedido";
DROP POLICY IF EXISTS "empresa modifica pedidos"  ON public."Pedido";
DROP POLICY IF EXISTS "empresa elimina pedidos"   ON public."Pedido";

-- SELECT: Solo pedidos de tu empresa
CREATE POLICY "empresa ve sus pedidos"
  ON public."Pedido"
  FOR SELECT
  TO authenticated
  USING ("empresaId" = public.get_empresa_id_del_usuario());

-- INSERT: Solo puedes crear pedidos bajo tu empresaId
CREATE POLICY "empresa crea sus pedidos"
  ON public."Pedido"
  FOR INSERT
  TO authenticated
  WITH CHECK ("empresaId" = public.get_empresa_id_del_usuario());

-- UPDATE: Solo puedes modificar pedidos de tu empresa
CREATE POLICY "empresa modifica pedidos"
  ON public."Pedido"
  FOR UPDATE
  TO authenticated
  USING    ("empresaId" = public.get_empresa_id_del_usuario())
  WITH CHECK ("empresaId" = public.get_empresa_id_del_usuario());

-- DELETE: Solo puedes eliminar pedidos de tu empresa
CREATE POLICY "empresa elimina pedidos"
  ON public."Pedido"
  FOR DELETE
  TO authenticated
  USING ("empresaId" = public.get_empresa_id_del_usuario());


-- ──────────────────────────────────────────────────────────────
-- 5. ACCESO SERVICE_ROLE (Para Server Actions de Next.js)
-- Los Server Actions usan SUPABASE_SERVICE_ROLE_KEY que bypasea
-- el RLS por diseño. Esto es correcto e intencional.
-- Prisma también usa la connection string directa (sin RLS).
-- IMPORTANTE: Nunca exponer la SERVICE_ROLE_KEY en el frontend.
-- ──────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────
-- 6. VERIFICACIÓN FINAL
-- Ejecuta esto para confirmar que las policies existen:
-- ──────────────────────────────────────────────────────────────
-- SELECT schemaname, tablename, policyname, cmd, roles, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
