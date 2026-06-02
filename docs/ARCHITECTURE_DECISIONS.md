# Decisiones Arquitectónicas — RuteAI

## ADR-001: BFF accede a la base de datos directamente (Core Service bypaseado)

**Fecha:** 2026-06-01  
**Estado:** Pendiente de decisión formal  

### Contexto

El proyecto tiene tres microservicios (`auth`, `ai-service`, `core`) y un BFF en Next.js (`apps/web`). El `core-service` expone endpoints REST completos para órdenes, rutas, ubicaciones y empresas, con middleware de autenticación, controladores y repositorios listos.

Sin embargo, el BFF (`apps/web/app/api/`) **no llama al Core Service**. En cambio, accede a Prisma (la base de datos) directamente desde los API routes y Server Components de Next.js. La variable de entorno `CORE_SERVICE_URL` está definida en `.env.example` pero no se utiliza en ningún archivo del BFF.

### Situación actual

| Endpoint BFF | Lo que hace hoy | Lo que haría con Core |
|---|---|---|
| `GET/POST /api/pedidos` | Prisma directo | `GET/POST CORE_SERVICE_URL/api/v1/orders` |
| `POST /api/ubicaciones` | Prisma directo | `POST CORE_SERVICE_URL/api/v1/locations` |
| `GET /api/ubicaciones` | Prisma directo | `GET CORE_SERVICE_URL/api/v1/locations` |
| `dashboard/rutas/page.tsx` | Prisma directo (Server Component) | `GET CORE_SERVICE_URL/api/v1/routes` |
| `admin/*` pages | Prisma directo | `GET/POST CORE_SERVICE_URL/api/v1/empresas` |

El Core Service (`apps/core`) contiene código funcional y desplegado en Vercel, pero no recibe tráfico real.

### Opciones

**Opción A — Mantener Prisma directo en BFF (estado actual)**
- Pro: Menos latencia (sin hop extra), menos complejidad en producción, transacciones más simples.
- Con: Lógica de negocio duplicada entre Core y BFF. Core Service es código muerto.

**Opción B — Migrar BFF para consumir el Core Service**
- Pro: Separación clara de responsabilidades. Core como única fuente de verdad para lógica de negocio.
- Con: Latencia adicional (BFF → Core → DB). Requiere que Core maneje auth tokens del usuario final. Trabajo de migración.

**Opción C — Eliminar Core Service, consolidar todo en BFF**
- Pro: Simplifica el monorepo. BFF con Prisma es el patrón estándar en Next.js + Supabase.
- Con: No aplica — app mobile eliminada del proyecto (2026-06-01).

### Decisión

> **Pendiente** — Se mantiene el estado actual (Opción A). Con la eliminación de `apps/mobile`, el único consumidor del BFF es la web. La decisión de migrar a Core Service queda abierta si en el futuro se requiere otra app cliente.

### Impacto en desarrollo

- No usar `CORE_SERVICE_URL` desde el BFF hasta que se tome una decisión.
- Cualquier lógica de negocio nueva se implementa en el BFF (Server Actions o API routes) hasta que se defina la estrategia.

---

## ADR-002: Realtime GPS via Supabase Postgres Changes (no Broadcast manual)

**Fecha:** 2026-06-01  
**Estado:** Implementado  

### Decisión

El mapa live en `dashboard/rutas` usa **Supabase Postgres Changes** para recibir actualizaciones GPS en tiempo real. Cuando el móvil hace `POST /api/ubicaciones`, Prisma inserta una fila en la tabla `Ubicacion`. Supabase Realtime detecta el INSERT y notifica automáticamente a todos los clientes suscritos al canal `ubicaciones:{empresaId}`.

No se necesita emitir un broadcast manual desde el API route. El hook `useRealtimeGPS` en [RealtimeGPSPin.tsx](../apps/web/app/dashboard/components/RealtimeGPSPin.tsx) maneja la suscripción.

**Requisito de infraestructura:** La tabla `Ubicacion` debe tener Realtime habilitado en el dashboard de Supabase (Tables → Replication).

### Pendiente

La visualización del mapa se mejorará con Google Maps (API key pendiente). El mecanismo de transporte (Postgres Changes) no cambiará, solo la capa visual.

---

## ADR-003: Geocodificación con Google Geocoding API

**Fecha:** 2026-06-01  
**Estado:** Implementado  

### Decisión

La creación de pedidos usa **Google Geocoding API** para convertir direcciones a coordenadas lat/lng. Ofrece mayor precisión que Nominatim para direcciones chilenas y soporte de idioma español vía `language=es`.

### Implementación

- Servicio centralizado: [geocodingService.ts](../apps/web/lib/geocodingService.ts)
- Utilizado en: `POST /api/pedidos` y `dashboard/actions.ts` (agregarPedidoNuevo, editarPedido)
- API key: `NEXT_PUBLIC_GOOGLE_MAPS_KEY` (configurada en Vercel)
- Fallback: si la key no está configurada o la API falla, el pedido se crea sin coordenadas
- Timeout: 5 segundos (AbortSignal.timeout)
