# RuteAI — Sistema de Gestión Logística

> **Plataforma fullstack de despacho inteligente** con arquitectura de microservicios, tracking GPS en tiempo real, scoring de riesgo IA y evidencia fotográfica de entrega.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)](https://prisma.io)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com)

## Repositorios

| Componente | URL |
|---|---|
| **Principal (monorepo)** | https://github.com/cristian102711/RuteAI |
| **Frontend + BFF** | https://github.com/cristian102711/RuteAI/tree/main/apps/web |
| **Microservicio IA** | https://github.com/cristian102711/RuteAI/tree/main/apps/ai-service |
| **Base de datos** | https://github.com/cristian102711/RuteAI/tree/main/packages/database |

## Arquitectura de Microservicios

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser/Mobile)                      │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────────┐
│                    BFF — apps/web (Next.js 16)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │
│  │  App Router  │  │  API Routes  │  │   Server Actions          │  │
│  │  (SSR/RSC)   │  │  (REST API)  │  │   (Mutations)             │  │
│  └──────────────┘  └──────┬───────┘  └────────────┬──────────────┘  │
└──────────────────────────┬┘────────────────────────┼────────────────┘
                           │                         │
          ┌────────────────┼─────────────────────────┤
          │                │                         │
┌─────────▼──────┐  ┌──────▼──────────┐  ┌──────────▼─────────────┐
│  Microservicio │  │  Microservicio  │  │  Supabase (PaaS)        │
│  IA (Python)   │  │  Notificaciones │  │  ┌────────────────────┐ │
│  FastAPI       │  │  (Twilio SMS)   │  │  │ PostgreSQL (Prisma) │ │
│  /score        │  │  /api/ubicacion │  │  ├────────────────────┤ │
│  Score 0-1     │  │  GPS tracking   │  │  │ Auth (JWT)          │ │
└────────────────┘  └─────────────────┘  │  ├────────────────────┤ │
                                         │  │ Storage (S3-like)   │ │
                                         │  │ Realtime (WS)       │ │
                                         │  └────────────────────┘ │
                                         └───────────────────────────┘
```

## Estructura del Monorepo

```
RuteAI/
├── apps/
│   ├── web/                    # BFF + Frontend (Next.js 16)
│   │   ├── app/                # App Router
│   │   │   ├── api/            # REST API endpoints
│   │   │   ├── dashboard/      # Panel encargado
│   │   │   ├── repartidor/     # Portal repartidor
│   │   │   └── tracking/[id]/  # Tracking público del cliente
│   │   ├── __tests__/          # Pruebas unitarias Jest
│   │   └── coverage/           # Reportes de cobertura HTML
│   ├── ai-service/             # Microservicio IA (Python/FastAPI)
│   └── mobile/                 # App móvil (React Native/Expo)
└── packages/
    └── database/               # Prisma schema + cliente compartido
        └── prisma/
            └── schema.prisma   # Modelos: Empresa, Usuario, Pedido, etc.
```

## Instalación y Ejecución

### Prerrequisitos
- Node.js 20+
- pnpm 9+
- PostgreSQL (via Supabase)

### Variables de entorno
```bash
cp apps/web/.env.example apps/web/.env
```

Variables requeridas:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXT_PUBLIC_APP_URL=http://localhost:3000
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
FLOW_API_KEY=...
FLOW_SECRET_KEY=...
```

### Instalar dependencias
```bash
pnpm install
```

### Ejecutar en desarrollo
```bash
# Frontend + BFF
pnpm --filter web dev

# Microservicio IA (Python)
cd apps/ai-service && pip install -r requirements.txt && uvicorn main:app --reload
```

### Base de datos
```bash
# Sincronizar schema
pnpm --filter @ruteai/database exec prisma db push

# Ver datos
pnpm --filter @ruteai/database exec prisma studio
```

## Pruebas Unitarias

```bash
# Ejecutar todos los tests
pnpm --filter web exec jest

# Con reporte de cobertura (texto)
pnpm --filter web exec jest --coverage --coverageReporters=text

# Con reporte HTML (abrir en coverage/index.html)
pnpm --filter web exec jest --coverage --coverageReporters=html
```

**Resultado:** 69 tests ✅ — Cobertura: **61.45%** (supera el mínimo del 60%)

```
Suite de Tests          | Tests | Estado
------------------------|-------|-------
KPICard.test.tsx        |   5   |  ✅
StatusBadge.test.tsx    |   7   |  ✅
ScoreBadge.test.tsx     |  11   |  ✅
NotificationBell.test.tsx| 10   |  ✅
BotonesTabla.test.tsx   |   9   |  ✅
businessLogic.test.ts   |  27   |  ✅
TOTAL                   |  69   |  ✅
```

## API Documentation

Swagger UI disponible en: **`/docs`**

JSON spec en: **`/api/docs`**

Endpoints principales:
- `GET /api/pedidos` — Listar pedidos
- `POST /api/pedidos` — Crear pedido
- `PATCH /api/pedidos/{id}/estado` — Actualizar estado
- `GET /api/alertas/count` — Conteo de alertas sin leer
- `PATCH /api/alertas` — Marcar todas como leídas
- `POST /api/evidencia` — Generar URL firmada de subida
- `POST /api/ai/score` — Calcular score de riesgo IA
- `POST /api/ubicacion` — Registrar ping GPS
- `POST /api/flow/crear` — Crear pago Flow.cl

## Deploy

```bash
# Build de producción
pnpm --filter web build

# Desplegado en Vercel (automático desde main)
```

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Estilos | Tailwind CSS 4, Glassmorphism |
| BFF | Next.js App Router (Server Actions + API Routes) |
| Base de Datos | PostgreSQL via Supabase (Prisma ORM) |
| Auth | Supabase Auth (OAuth Google + email/password) |
| Storage | Supabase Storage (S3-compatible) |
| Realtime | Supabase Realtime (WebSockets) |
| IA | Python FastAPI (scoring de riesgo) |
| SMS | Twilio (notificaciones cliente) |
| Pagos | Flow.cl (planes SaaS en CLP) |
| Tests | Jest + Testing Library |
| API Docs | OpenAPI 3.0 + SwaggerUI CDN |
| Deploy | Vercel (Edge Network) |
