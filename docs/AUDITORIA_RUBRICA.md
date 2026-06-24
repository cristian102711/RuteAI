# AUDITORIA_RUBRICA — RuteAI Monorepo
**Fecha:** 2026-06-19 | **Rama auditada:** `feature/auditar`

---

## 1. COBERTURA DE TESTS

### @ruteai/web
Comando: `jest --coverage` (script `test:coverage`)

| Archivo              | % Stmts | % Branch | % Funcs | % Lines |
|----------------------|---------|----------|---------|---------|
| BotonesTabla.tsx     | 32.75   | 68.18    | 20.00   | 34.54   |
| KPICard.tsx          | 100.00  | 100.00   | 100.00  | 100.00  |
| NotificationBell.tsx | 70.83   | 55.88    | 72.72   | 72.09   |
| ScoreBadge.tsx       | 100.00  | 100.00   | 100.00  | 100.00  |
| StatusBadge.tsx      | 100.00  | 88.88    | 100.00  | 100.00  |
| **All files**        | **55.83** | **69.38** | **54.16** | **56.75** |

> **Estado:** FALLA umbrales globales configurados (60% en Stmts, Lines y Funcs).
> Test Suites: 7 | Tests: **101 passed**

---

### @ruteai/core
Comando: `npx jest --coverage`

| Archivo      | % Stmts | % Branch | % Funcs | % Lines |
|--------------|---------|----------|---------|---------|
| logistica.ts | 100.00  | 83.33    | 100.00  | 100.00  |
| **All files**| **100.00** | **83.33** | **100.00** | **100.00** |

> **Estado:** PASA. Línea no cubierta: L42 (rama de branch).
> Test Suites: 1 | Tests: **10 passed**

---

### @ruteai/ai-service
Comando: `npx jest --coverage`

| Archivo             | % Stmts | % Branch | % Funcs | % Lines |
|---------------------|---------|----------|---------|---------|
| src/index.ts        | 89.47   | 40.00    | 50.00   | 89.47   |
| health.route.ts     | 100.00  | 100.00   | 100.00  | 100.00  |
| optimize.route.ts   | 43.75   | 0.00     | 0.00    | 46.66   |
| score.route.ts      | 100.00  | 100.00   | 100.00  | 100.00  |
| ai.service.ts       | 93.75   | 88.63    | 100.00  | 93.51   |
| gemini.service.ts   | 100.00  | 76.19    | 100.00  | 100.00  |
| **All files**       | **91.08** | **78.37** | **88.88** | **91.00** |

> **Estado:** PASA. Punto débil: `optimize.route.ts` (L25-40 sin cubrir).
> Test Suites: 4 | Tests: **28 passed**

---

### @ruteai/auth
Comando: `npx jest --coverage`

| Archivo                | % Stmts | % Branch | % Funcs | % Lines |
|------------------------|---------|----------|---------|---------|
| src/index.ts           | 88.88   | 33.33    | 0.00    | 88.88   |
| src/lib/supabase.ts    | 100.00  | 100.00   | 100.00  | 100.00  |
| auth.repository.ts     | 6.66    | 0.00     | 0.00    | 8.69    |
| auth.service.ts        | 7.69    | 0.00     | 0.00    | 8.10    |
| auth.route.ts          | 37.70   | 8.00     | 40.00   | 37.70   |
| health.route.ts        | 100.00  | 100.00   | 100.00  | 100.00  |
| users.route.ts         | 44.44   | 0.00     | 0.00    | 44.44   |
| **All files**          | **34.73** | **3.61** | **13.04** | **36.70** |

> **Estado:** MUY BAJA. `auth.repository.ts` y `auth.service.ts` casi sin cobertura (sólo 3 tests de humo HTTP).
> Test Suites: 1 | Tests: **3 passed**

---

### Resumen Global (agregado manual entre 4 apps)

| App          | Tests | Suites | Stmts  | Branch | Funcs  | Lines  |
|--------------|-------|--------|--------|--------|--------|--------|
| web          | 101   | 7      | 55.83% | 69.38% | 54.16% | 56.75% |
| core         | 10    | 1      | 100%   | 83.33% | 100%   | 100%   |
| ai-service   | 28    | 4      | 91.08% | 78.37% | 88.88% | 91%    |
| auth         | 3     | 1      | 34.73% | 3.61%  | 13.04% | 36.70% |
| **TOTAL**    | **142** | **13** | — | — | — | — |

> No existe un runner unificado de cobertura cross-app; los % globales son aproximados por ponderación de archivos.

---

## 2. DOCUMENTACIÓN API

| App          | swagger.json | openapi.yaml | Postman collection | Ruta /api/docs | Observaciones |
|--------------|:---:|:---:|:---:|:---:|---------------|
| **web**      | ✗   | ✗   | ✗   | ✓  | `GET /api/docs` sirve OpenAPI 3.0 JSON generado desde `apps/web/lib/swaggerSpec.ts`. Página `/docs` con SwaggerUI (CDN). |
| **auth**     | ✗   | ✗   | ✗   | ✗  | Sin documentación API. Sólo `/api/v1/health`. |
| **core**     | ✗   | ✗   | ✗   | ✗  | Sin documentación API. |
| **ai-service** | ✗ | ✗   | ✗   | ✗  | Sin documentación API formal. Route `/health` no documentada. |

**Hallazgo:** El spec OpenAPI está embebido como objeto JS (`swaggerSpec.ts`) en vez de un archivo `openapi.json/yaml` versionado. Los microservicios `auth`, `core` y `ai-service` carecen de toda documentación formal de API.

---

## 3. README

| Ubicación                   | Estado    | Contenido (primeros 15 renglones) |
|-----------------------------|-----------|-----------------------------------|
| `apps/web/README.md`        | NO EXISTE | —                                 |
| `apps/auth/README.md`       | NO EXISTE | —                                 |
| `apps/core/README.md`       | NO EXISTE | —                                 |
| `apps/ai-service/README.md` | NO EXISTE | —                                 |
| `packages/database/README.md` | NO EXISTE | —                               |

**Hallazgo:** Ninguna app ni el paquete de base de datos tiene README. El único README presente es el del **monorepo raíz** (`README.md`).

---

## 4. PERSISTENCIA

### Ubicación del schema

- **schema.prisma:** `packages/database/prisma/schema.prisma`
- Proveedor: PostgreSQL (Supabase)
- Variables: `DATABASE_URL`, `DIRECT_URL`

### Migraciones

| Tipo | Carpeta | Archivos encontrados |
|------|---------|----------------------|
| Manual SQL (Supabase) | `packages/database/migrations/` | `2026-06-17_sla_pedidos.sql` |
| Prisma migrate | `packages/database/prisma/migrations/` | **NO EXISTE** — no se usa `prisma migrate` |

> Las migraciones son SQL manual aplicadas vía Supabase SQL Editor. No hay historial de Prisma Migrate.

### Stored Procedures / Triggers

Búsqueda de `CREATE FUNCTION`, `CREATE TRIGGER`, `CREATE PROCEDURE` en todos los archivos `.sql` de `packages/database/migrations/`:

**NINGUNO encontrado.** La migración `2026-06-17_sla_pedidos.sql` usa sólo `ALTER TABLE`, `CREATE TABLE`, `CREATE INDEX`, y un bloque `DO $$ ... $$` para añadir FK idempotente (no es una función persistente).

---

## 5. REPOSITORIO GIT

```
git remote -v
origin  https://github.com/cristian102711/RuteAI.git (fetch)
origin  https://github.com/cristian102711/RuteAI.git (push)
```

```
git log --oneline -5
cc1ef2f feat(ai): planificación de rutas consciente del SLA (determinista, sin LLM) + ETA por parada
148218f feat(ai): optimización de rutas con Gemini (fallback heurístico) + ruta/camión en el mapa
2920e65 feat(mapa): tracking en vivo de repartidores + simulación de movimiento; elimina Leaflet muerto
4be2e36 chore(web): actualiza next-env.d.ts (ruta de tipos del build de producción)
4f326fb feat: portal repartidor (login propio + portal rico + SLA), tests microservicios y mejoras de pedidos
```

**Estructura:**
- Un único repositorio Git (monorepo) con un solo remoto `origin`.
- **Sin submódulos** (`git submodule status` sin salida).
- Sin remotos separados por app; todas las apps conviven en el mismo árbol de commits.

---

## 6. PAGOS

### Flow.cl — **ACTIVO**

Integración confirmada por código fuente real (no docs):

| Archivo | Detalle |
|---------|---------|
| `apps/web/app/api/flow/crear/route.ts` | Crea orden de pago contra `FLOW_API_URL` (producción: `https://www.flow.cl/api`) |
| `apps/web/app/api/flow/confirmar/route.ts` | Callback de confirmación; consulta `/payment/getStatus`; actualiza BD (`prisma.pago`) |
| `apps/web/app/api/flow/retorno/route.ts` | Retorno al usuario; apunta por defecto a **sandbox** (`https://sandbox.flow.cl/api`) |

> **Nota:** `retorno/route.ts` usa la URL de sandbox como default — requiere que `FLOW_API_URL` esté correctamente inyectado en producción.

### MercadoPago — **NO encontrado**

Búsqueda de `mercadopago`, `@mercadopago`, `MercadoPago` en `apps/` (excluido `.next` y `node_modules`): **sin resultados**.

---

## 7. DIAGRAMA DE ARQUITECTURA

| Ubicación buscada | Tipos buscados | Resultado |
|-------------------|----------------|-----------|
| `docs/`           | `.drawio`, `.excalidraw`, `.mermaid`, imágenes | **Carpeta no existe** |
| `.github/`        | ídem           | **Carpeta no existe** |
| Raíz del repo     | ídem           | **Sin archivos de diagrama** |
| Todo el repo      | `*.drawio`, `*.excalidraw`, `*.mermaid`, `*.postman_collection.json` | **NINGUNO encontrado** |

**Hallazgo:** No existe ningún diagrama de arquitectura en el repositorio (ni imagen, ni formato vectorial, ni Mermaid embebido).

---

## 8. CONTEO REAL DE TESTS vs. DOCUMENTADO

| App | Archivos de test | Tests reales | Tests documentados |
|-----|-----------------|-------------|-------------------|
| `@ruteai/web`        | 7 (`__tests__/*.test.{ts,tsx}`) | **101** | — |
| `@ruteai/core`       | 1                               | **10**  | — |
| `@ruteai/ai-service` | 4                               | **28**  | — |
| `@ruteai/auth`       | 1                               | **3**   | — |
| **TOTAL**            | **13 archivos**                 | **142** | ~142 |

**Veredicto:** El conteo documentado de **~142 tests totales está actualizado y es exacto** (142 real vs. ~142 documentado). Sin desactualización detectada.

### Desglose por archivo (web — el más numeroso)

| Archivo de test               | App |
|-------------------------------|-----|
| `logistica.test.ts`           | web |
| `businessLogic.test.ts`       | web |
| `ScoreBadge.test.tsx`         | web |
| `StatusBadge.test.tsx`        | web |
| `KPICard.test.tsx`            | web |
| `BotonesTabla.test.tsx`       | web |
| `NotificationBell.test.tsx`   | web |
| `logistica.test.ts`           | core |
| `planificacion.test.ts`       | ai-service |
| `ai.service.test.ts`          | ai-service |
| `gemini.service.test.ts`      | ai-service |
| `api.test.ts`                 | ai-service |
| `auth.test.ts`                | auth |

---

## RESUMEN EJECUTIVO DE HALLAZGOS

| # | Área | Hallazgo | Severidad |
|---|------|----------|-----------|
| 1 | Tests | `@ruteai/auth` tiene cobertura crítica baja (34.73% Stmts, 3.61% Branch) | 🔴 Alta |
| 2 | Tests | `@ruteai/web` no alcanza umbrales configurados (55.83% < 60%) | 🟡 Media |
| 3 | Docs API | `auth`, `core` y `ai-service` sin documentación de API | 🟡 Media |
| 4 | README | Ninguna app tiene README | 🟡 Media |
| 5 | Migraciones | Sin `prisma migrate`; migraciones manuales sin historial versionado | 🟡 Media |
| 6 | Diagrama | Sin ningún diagrama de arquitectura en el repo | 🟡 Media |
| 7 | Pagos | `flow/retorno/route.ts` usa sandbox por defecto (requiere env var en prod) | 🟡 Media |
| 8 | Docs API | OpenAPI sólo en `web`; spec embebida en TS en vez de archivo YAML independiente | 🟢 Baja |
| 9 | Tests | Conteo total (142) coincide con lo documentado — sin deuda oculta | ✅ OK |
| 10 | Git | Monorepo limpio, un solo remoto, sin submódulos | ✅ OK |
