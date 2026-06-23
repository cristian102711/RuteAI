# Feature IA — Integración de Open Router en RuteAI

> Rama: `feature/IA` · Microservicio: `apps/ai-service` · BFF: `apps/web`

Documenta la integración de IA basada en **Open Router** para (1) score de riesgo
de entrega, (2) reorganización de pedidos por prioridad logística y (3) optimización
de rutas consciente de SLA. Incluye la arquitectura, los endpoints, los problemas
resueltos, cómo correrlo en local y qué se necesita para desplegar en Vercel.

---

## 1. Resumen de lo que se hizo

| Área | Cambio |
|------|--------|
| **Modelo IA** | Se integró Open Router con el modelo `openai/gpt-oss-120b:free` (configurable por env). |
| **Score de riesgo** | `POST /api/score` ahora tiene **doble modo**: IA (producto + dirección) y heurístico determinista (lat/lng/hora) como fallback. |
| **Reorganización** | Nuevo `POST /api/reorganize`: ordena pedidos por prioridad (SLA, urgencia, riesgo, estado) usando el LLM. |
| **Optimización de rutas** | `POST /api/optimize` (determinista, sin LLM) — sin cambios de lógica, documentado. |
| **Frontend** | Botones "Optimizar Rutas con IA" y "Reorganizar Prioridad IA" en el dashboard, conectados vía BFF. |
| **Limpieza** | Se eliminó el servicio muerto `gemini.service.ts` (+ su test) y las variables `GEMINI_*`. |
| **Swagger** | Documentación OpenAPI actualizada y corregida (puerto, schemas, nuevo endpoint). |
| **Tests** | Suite Jest ampliada: unit tests de Open Router (con `fetch` mockeado) + integración de score IA y reorganize. |

---

## 2. Arquitectura

```
┌─────────────┐   HTTP    ┌──────────────────────┐   HTTP   ┌─────────────────────┐
│  Navegador  │ ───────►  │  apps/web (BFF)      │ ───────► │  apps/ai-service    │
│  (React)    │           │  Next.js · :3000     │          │  Express · :3001    │
└─────────────┘           │  - Auth Supabase     │          │  - /api/score       │
                          │  - Prisma (datos)    │          │  - /api/reorganize  │
                          │  - aiServiceClient   │          │  - /api/optimize    │
                          └──────────┬───────────┘          └──────────┬──────────┘
                                     │                                  │
                                     │ server-to-server                 │ REST
                                     ▼                                  ▼
                          ┌──────────────────────┐          ┌─────────────────────┐
                          │ apps/auth  · :3002   │          │   Open Router API    │
                          │ apps/core  · :3003   │          │ openrouter.ai/api/v1 │
                          └──────────────────────┘          └─────────────────────┘
```

**Patrón BFF**: el navegador nunca llama al ai-service directamente. La capa web
(`apps/web`) autentica con Supabase, obtiene los datos vía Prisma/core y reenvía la
petición al ai-service a través de `lib/aiServiceClient.ts`. `AI_SERVICE_URL` nunca
se expone al cliente.

### Puertos en desarrollo

| Servicio | Puerto | Health |
|----------|--------|--------|
| web (Next.js) | 3000 | — |
| ai-service | 3001 | `GET /api/health` |
| auth | 3002 | `GET /api/v1/health` |
| core | 3003 | `GET /api/v1/health` |

---

## 3. Endpoints del ai-service

Swagger interactivo: **`http://localhost:3001/docs`**

### `POST /api/score` — Score de riesgo (doble modo)

**Modo IA** (cuando llegan `producto` + `direccion`):
```json
// Request
{ "producto": "Laptop frágil", "direccion": "Av. Providencia 1234, Santiago", "fechaEntrega": "2026-06-23T22:00:00Z" }
// Response
{ "success": true, "data": { "score": 0.35, "nivel": "medio", "razones": ["..."], "algoritmo": "openrouter-ia" } }
```

**Modo heurístico** (cuando llegan `lat`/`lng`/`hora`): algoritmo determinista que
pondera horario nocturno, días de retraso, intentos fallidos y zona. `algoritmo: "heuristico"`.

- `score` es un float **0.0–1.0** (no 0–100). En la BD se persiste como entero 0–100.
- Si Open Router no está configurado o falla, devuelve un **score de precaución** (no rompe el flujo de creación de pedido).

### `POST /api/reorganize` — Reorganización por prioridad (IA)

```json
// Request
{ "pedidos": [ { "id": "<uuid>", "producto": "...", "direccion": "...", "estado": "en_ruta", "scoreRiesgo": 85, "fechaEntregaLimite": "...", "urgencia": true } ] }
// Response
{ "success": true, "data": { "idsOrdenados": ["<uuid>", ...], "razon": "...", "totalPedidos": 3, "algoritmo": "openrouter-ia" } }
```

Criterios de prioridad: (1) fecha límite más próxima, (2) urgencia, (3) mayor score
de riesgo, (4) `en_ruta` antes que `pendiente`.

> **Detalle clave**: el prompt envía **índices numéricos** (1, 2, 3…) en lugar de los
> UUID. El modelo solo reordena números pequeños y el servicio los mapea de vuelta a
> los UUID reales. Esto arregla el bug donde el LLM alteraba/truncaba los UUID largos
> y la validación caía siempre al fallback. Ver §5.

### `POST /api/optimize` — Optimización de ruta (determinista)

Planificador consciente de SLA (nearest-neighbor + priorización por hora límite).
**No usa LLM**: es 100% determinista. Devuelve la ruta ordenada, ETA por parada,
distancia total y paradas en riesgo de incumplir SLA.

---

## 4. Flujo en el frontend

| Acción UI | Componente | Ruta BFF | Endpoint ai-service |
|-----------|-----------|----------|---------------------|
| Crear pedido (score automático) | `dashboard/actions.ts` → `agregarPedidoNuevo` | `aiServiceClient.obtenerScoreRiesgo` | `/api/score` |
| "Optimizar Rutas con IA" | `OptimizarRutasButton.tsx` | `POST /api/rutas` | `/api/optimize` |
| "Reorganizar Prioridad IA" | `PedidosPageClient.tsx` | `POST /api/ai/reorganize` | `/api/reorganize` |

Todas las llamadas al ai-service están centralizadas en
[`apps/web/lib/aiServiceClient.ts`](../apps/web/lib/aiServiceClient.ts) con fallback
seguro: si el ai-service no responde, la UI no se bloquea (mantiene orden original /
aplica score heurístico).

---

## 5. Problemas resueltos

1. **Modelo gratuito retirado** — `google/gemini-2.5-flash:free` dejó de ser gratuito
   (Open Router devuelve 404). Se cambió a `openai/gpt-oss-120b:free`, configurable
   con la env `OPENROUTER_MODEL`.

2. **TLS en Node.js portátil (Windows)** — el Node portátil de desarrollo no tiene
   los CA del sistema, por lo que `fetch` a Open Router/Supabase fallaba con
   `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Se añadió, **solo en desarrollo**, el guard:
   ```ts
   if (process.env.NODE_ENV !== 'production') process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
   ```
   en `ai-service/src/index.ts`, `auth/src/env.ts` y `core/src/env.ts`.
   **No afecta producción** (Vercel corre con `NODE_ENV=production`).

3. **El LLM alteraba los UUID** — al reorganizar, el modelo modificaba los UUID en su
   respuesta y la validación de permutación fallaba siempre, mostrando *"La IA no
   pudo reorganizar…"* aunque la lista cambiara. Solución: índices numéricos en el
   prompt + mapeo de vuelta a UUID (ver §3).

4. **Carga de variables de entorno** — cada microservicio carga su `.env` local con
   fallback al `.env` raíz del monorepo (cascada en `env.ts`). Next.js carga
   `apps/web/.env.local`.

---

## 6. Cómo correr en local

Requisitos: las 4 apps levantadas. Con Node portátil en Windows, asegurar el PATH.

```bash
# Levantar cada servicio (en terminales separadas o con el orquestador del monorepo)
pnpm --filter @ruteai/auth        run dev   # :3002
pnpm --filter @ruteai/core        run dev   # :3003
pnpm --filter @ruteai/ai-service  run dev   # :3001
pnpm --filter @ruteai/web         run dev   # :3000
```

Verificar el ai-service:
```bash
curl http://localhost:3001/api/health
# Swagger: http://localhost:3001/docs
```

---

## 7. Tests

```bash
pnpm --filter @ruteai/ai-service run test   # 48 tests (5 suites)
pnpm --filter @ruteai/web        run test   # 123 tests (7 suites)
```

Cobertura IA en el ai-service:
- `__tests__/openrouter.service.test.ts` — unit tests con `fetch` mockeado: parseo de
  score, clamp 0–1, fallbacks, y el **mapeo índice → UUID exacto** de la reorganización.
- `__tests__/api.test.ts` — integración (supertest) de `/api/score` (ambos modos) y
  `/api/reorganize`. **Hermético**: fuerza la ausencia de `OPENROUTER_API_KEY` para no
  depender de la red.
- `__tests__/ai.service.test.ts`, `optimize.route.test.ts`, `planificacion.test.ts` —
  algoritmos deterministas (heurística, nearest-neighbor, SLA).

---

## 8. Despliegue en Vercel (production-ready)

El código ya está listo para Vercel + Supabase. No hay nada hardcodeado que rompa
producción (el guard de TLS está limitado a `NODE_ENV !== 'production'`).

### Variables de entorno requeridas

**Proyecto `ruteai-ai-service`:**

| Variable | Requerida | Notas |
|----------|-----------|-------|
| `OPENROUTER_API_KEY` | ✅ | **El equipo debe actualizar el valor** en la variable ya existente. |
| `OPENROUTER_MODEL` | ⬜ | Opcional. Default: `openai/gpt-oss-120b:free`. |
| `WEB_URL` | ⬜ | Para el CORS (origen del frontend). |

**Proyecto `ruteai` (web):**

| Variable | Requerida | Notas |
|----------|-----------|-------|
| `AI_SERVICE_URL` | ✅ | Apunta a la URL del ai-service en Vercel (`https://ruteai-ai-service.vercel.app`). |

> ℹ️ La `OPENROUTER_API_KEY` ya existe como variable en Vercel; solo hay que
> **reemplazar su valor** por la key vigente. El resto de variables (Supabase, DB)
> no cambian con esta feature.

---

## 9. Archivos principales

| Archivo | Rol |
|---------|-----|
| [`apps/ai-service/src/services/openrouter.service.ts`](../apps/ai-service/src/services/openrouter.service.ts) | Cliente Open Router (score + reorganize). |
| [`apps/ai-service/src/services/ai.service.ts`](../apps/ai-service/src/services/ai.service.ts) | Algoritmos deterministas (heurística, TSP, SLA). |
| [`apps/ai-service/src/routes/`](../apps/ai-service/src/routes/) | Rutas `score`, `reorganize`, `optimize`, `health`. |
| [`apps/ai-service/src/swagger.ts`](../apps/ai-service/src/swagger.ts) | OpenAPI 3.0. |
| [`apps/web/lib/aiServiceClient.ts`](../apps/web/lib/aiServiceClient.ts) | Cliente BFF hacia el ai-service. |
| [`apps/web/app/api/ai/reorganize/route.ts`](../apps/web/app/api/ai/reorganize/route.ts) | BFF de reorganización. |
| [`apps/web/app/api/rutas/route.ts`](../apps/web/app/api/rutas/route.ts) | BFF de optimización de rutas. |
