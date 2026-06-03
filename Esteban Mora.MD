# RuteAI — Documentación Completa del Proyecto
> Preparado para implementación de Google Maps en apps/mobile
> Fecha: Junio 2026 | Stack: Next.js · Express · Expo · Supabase · Vercel

---

## 1. VISIÓN GENERAL

**RuteAI** es una plataforma SaaS de optimización logística de última milla para LATAM. Permite a empresas gestionar pedidos, optimizar rutas de reparto con IA, rastrear conductores en tiempo real y recibir alertas automatizadas.

- **Arquitectura**: Monorepo (pnpm workspaces + Turbo)
- **Patrón principal**: Backend-for-Frontend (BFF) — la app web actúa de intermediario entre el cliente y los microservicios
- **Multi-tenant**: cada empresa (`empresaId`) tiene datos aislados por RLS en Supabase
- **Deployment**: Vercel (web + microservicios Express) + Supabase (DB + Edge Functions)

---

## 2. ESTRUCTURA DEL MONOREPO

```
RuteAI/
├── apps/
│   ├── web/              → Dashboard web (Next.js 16, App Router)
│   ├── mobile/           → App conductores (Expo + React Native)
│   ├── core/             → API REST principal (Express)
│   ├── auth/             → Servicio de autenticación (Express + Supabase Auth)
│   └── ai-service/       → Microservicio de IA (Express, TSP + scoring)
│
├── packages/
│   ├── database/         → Prisma schema + cliente singleton
│   ├── shared-types/     → Interfaces TypeScript compartidas
│   └── shared/           → Utilidades: errores, respuestas HTTP, constantes
│
├── supabase/
│   └── functions/
│       └── daily-report/ → Edge Function CRON (reporte diario 00:05 UTC)
│
├── turbo.json            → Orquestación de builds y caché
├── pnpm-workspace.yaml   → Declaración de workspaces
├── tsconfig.base.json    → Config TypeScript base
├── .env.example          → Template de variables de entorno
├── BRANCHING.md          → Estrategia Git Flow
└── README.md             → Guía de instalación y despliegue
```

---

## 3. STACK TECNOLÓGICO

### Lenguajes
| Lenguaje | Uso |
|---|---|
| TypeScript 5 | Todo el proyecto (web, mobile, APIs) |
| SQL | Prisma migrations en Supabase/PostgreSQL |
| Deno (TypeScript) | Supabase Edge Functions |

### Apps Web (`apps/web`)
| Tecnología | Versión | Rol |
|---|---|---|
| Next.js | 16.2.1 | Framework principal, App Router |
| React | 19.2.4 | UI |
| Tailwind CSS | v4 | Estilos |
| Leaflet / React Leaflet | 1.9.4 / 5.0.0 | Mapas actuales (OSM) → **a reemplazar con Google Maps** |
| Framer Motion | — | Animaciones |
| Recharts | — | Gráficos KPI |
| Sonner | — | Notificaciones toast |
| SweetAlert2 | — | Modales de confirmación |
| React Hook Form + Zod | — | Formularios y validación |
| Supabase SSR | — | Auth + Realtime en servidor |
| Twilio | — | SMS/WhatsApp a clientes |

### App Mobile (`apps/mobile`)
| Tecnología | Versión | Rol |
|---|---|---|
| Expo | 54.0.34 | Build toolchain iOS/Android |
| Expo Router | — | Navegación basada en archivos |
| React Native | 0.81.5 | UI nativa |
| NativeWind | — | Tailwind en React Native |
| React Native Maps | 1.20.1 | Mapa nativo → **target de Google Maps** |
| Expo Location | — | GPS del conductor |
| Zustand | — | Estado global |
| TanStack React Query v5 | — | Cache de datos del servidor |
| React Hook Form + Zod | — | Formularios |
| Supabase JS | — | Auth + Storage (evidencias) |

### APIs / Backend
| App | Framework | Puerto | Rol |
|---|---|---|---|
| `apps/core` | Express 4.18.2 | — | CRUD pedidos, rutas, ubicaciones, empresas |
| `apps/auth` | Express | — | Signup, login, refresh, /me, logs |
| `apps/ai-service` | Express | — | Scoring de riesgo + optimización TSP |

### Infraestructura
| Servicio | Uso |
|---|---|
| Supabase | PostgreSQL, Auth, Storage, Realtime, Edge Functions |
| Vercel | Deploy de web + los 3 microservicios Express |
| pgBouncer | Connection pooling (DATABASE_URL puerto 6543) |
| Prisma 5.22.0 | ORM + migrations |
| pnpm 9.15.0 | Package manager |
| Turbo | Build orchestration y caché |

---

## 4. DETALLE DE CADA APLICACIÓN

---

### 4.1 `apps/web` — Dashboard Web (Next.js)

**Descripción**: Panel de gestión para encargados de empresa. Muestra KPIs, mapa en vivo, pedidos, rutas, equipo y configuración.

#### Estructura de archivos

```
apps/web/
├── app/
│   ├── layout.tsx                    → Layout raíz (fuentes Geist, dark theme)
│   ├── page.tsx                      → Landing page pública
│   ├── login/
│   │   └── page.tsx                  → Login + Register (email/password + Google OAuth)
│   ├── auth/
│   │   └── callback/route.ts         → Manejador OAuth Supabase
│   ├── onboarding/
│   │   └── page.tsx                  → Wizard de configuración inicial de empresa
│   ├── dashboard/
│   │   ├── layout.tsx                → Layout del dashboard (sidebar, header)
│   │   ├── page.tsx                  → Página principal: KPIs, mapa, alertas IA
│   │   ├── components/
│   │   │   ├── MapaRutasRender.tsx   → Mapa Leaflet con rutas y conductores en tiempo real
│   │   │   ├── DashboardKPIs.tsx     → Cards de métricas (pedidos, entregas, etc.)
│   │   │   ├── GraficoSemanal.tsx    → Gráfico Recharts de la semana
│   │   │   └── AlertasIA.tsx         → Panel de sugerencias de la IA
│   │   ├── pedidos/
│   │   │   ├── page.tsx              → Lista de pedidos con filtros
│   │   │   ├── crear/page.tsx        → Formulario crear pedido (geocoding Nominatim)
│   │   │   └── [id]/editar/page.tsx  → Formulario editar pedido
│   │   ├── rutas/
│   │   │   └── page.tsx              → Gestión de rutas (crear, asignar, optimizar)
│   │   ├── reportes/
│   │   │   └── page.tsx              → Reportes y analytics
│   │   ├── equipo/
│   │   │   └── page.tsx              → Gestión de conductores
│   │   └── configuracion/
│   │       └── page.tsx              → Configuración de la empresa
│   ├── admin/
│   │   └── page.tsx                  → Panel administrador interno
│   ├── super-admin/
│   │   └── page.tsx                  → Vista multi-empresa
│   ├── tracking/
│   │   └── [id]/page.tsx             → Tracking público para clientes (sin auth)
│   └── api/
│       ├── pedidos/route.ts          → GET lista / POST crear pedido
│       ├── ubicacion/route.ts        → GET última ubicación / POST ping GPS
│       ├── ai/score/route.ts         → BFF proxy → ai-service /api/score
│       ├── auth/
│       │   ├── login/route.ts        → BFF proxy → auth-service /login
│       │   └── logs/route.ts         → POST log evento auth
│       ├── alertas/route.ts          → GET/POST alertas
│       └── evidencia/route.ts        → POST subir foto/firma a Supabase Storage
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 → createBrowserClient (lado cliente)
│   │   └── server.ts                 → createServerClient (Server Components / cookies)
│   ├── prisma.ts                     → Singleton PrismaClient (re-export de @ruteai/database)
│   ├── geocodingService.ts           → Geocoding con Nominatim (OSM, sin API key)
│   ├── twilioService.ts              → Envío de SMS/WhatsApp con Twilio
│   └── aiClient.ts                   → Cliente HTTP hacia ai-service
│
├── hooks/
│   ├── useAlertasRealtime.ts         → Suscripción Supabase Realtime a alertas
│   └── useDebounce.ts                → Debounce para búsqueda
│
├── __tests__/                        → Tests Jest + Testing Library
├── public/                           → Assets estáticos
├── next.config.ts                    → Config Next.js
├── tailwind.config.ts                → Config Tailwind v4
├── postcss.config.mjs                → PostCSS con @tailwindcss/postcss
└── tsconfig.json                     → Extiende tsconfig.base.json
```

#### Rutas de página

| Ruta | Tipo | Descripción |
|---|---|---|
| `/` | Public | Landing page |
| `/login` | Public | Autenticación |
| `/auth/callback` | Public | OAuth redirect |
| `/onboarding` | Protected | Setup inicial |
| `/dashboard` | Protected | KPIs + mapa en vivo |
| `/dashboard/pedidos` | Protected | Lista de pedidos |
| `/dashboard/pedidos/crear` | Protected | Crear pedido |
| `/dashboard/pedidos/[id]/editar` | Protected | Editar pedido |
| `/dashboard/rutas` | Protected | Gestión de rutas |
| `/dashboard/reportes` | Protected | Analytics |
| `/dashboard/equipo` | Protected | Equipo |
| `/dashboard/configuracion` | Protected | Settings |
| `/tracking/[id]` | Public | Tracking para cliente final |

#### Rutas API (BFF)

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/pedidos` | GET, POST | Listar / crear pedidos |
| `/api/ubicacion` | GET, POST | Última ubicación / ping GPS |
| `/api/ai/score` | POST | Proxy → AI service (score de riesgo) |
| `/api/alertas` | GET, POST | Alertas de la empresa |
| `/api/auth/login` | POST | Proxy → Auth service |
| `/api/auth/logs` | POST | Log evento de autenticación |
| `/api/evidencia` | POST | Subir evidencia a Supabase Storage |

---

### 4.2 `apps/mobile` — App Conductores (Expo)

**Descripción**: App nativa para repartidores. Muestra sus pedidos asignados, la ruta optimizada en mapa, captura evidencias de entrega (foto + firma) y envía pings GPS cada 5 segundos.

#### Estructura de archivos

```
apps/mobile/
├── src/
│   ├── app/
│   │   ├── _layout.tsx               → Layout raíz (providers: Query, Supabase)
│   │   ├── (auth)/
│   │   │   └── login.tsx             → Pantalla de login del conductor
│   │   └── (app)/
│   │       ├── _layout.tsx           → Layout autenticado (tab bar)
│   │       ├── dashboard.tsx         → Resumen del conductor (pedidos del día, estado)
│   │       ├── mapa.tsx              → Mapa en vivo con ruta asignada
│   │       ├── pedidos/
│   │       │   ├── index.tsx         → Lista de pedidos asignados
│   │       │   └── [id].tsx          → Detalle + captura de evidencia
│   │       └── perfil.tsx            → Perfil del conductor
│   │
│   ├── components/
│   │   ├── MapRenderer.tsx           → Componente mapa (react-native-maps)
│   │   ├── PedidoCard.tsx            → Card de pedido en lista
│   │   ├── EvidenciaCapture.tsx      → Captura foto + firma
│   │   └── ui/                       → Componentes UI reutilizables
│   │
│   ├── lib/
│   │   ├── queryClient.ts            → TanStack Query config
│   │   ├── apiClient.ts              → Axios/fetch hacia apps/core
│   │   └── supabase.ts               → createClient Supabase (mobile)
│   │
│   └── stores/
│       ├── authStore.ts              → Estado de autenticación (Zustand)
│       ├── locationStore.ts          → Estado GPS en tiempo real
│       └── pedidosStore.ts           → Estado de pedidos asignados
│
├── app.json                          → Config Expo (permisos, plugins, nombre)
├── babel.config.js                   → Babel + NativeWind preset
├── metro.config.js                   → Metro bundler config
├── tailwind.config.js                → NativeWind config
└── tsconfig.json                     → TypeScript config
```

#### Pantallas (Expo Router)

| Ruta | Descripción |
|---|---|
| `/(auth)/login` | Login del conductor |
| `/(app)/dashboard` | Resumen del día |
| `/(app)/mapa` | Mapa en vivo con ruta |
| `/(app)/pedidos` | Lista de pedidos asignados |
| `/(app)/pedidos/[id]` | Detalle + evidencia (foto/firma) |
| `/(app)/perfil` | Perfil del conductor |

#### Permisos Android (app.json)
- `LOCATION` — GPS preciso del conductor
- `CAMERA` — Foto de evidencia de entrega
- `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` — Guardar evidencias

#### Mapas
- Librería: `react-native-maps v1.20.1` con `PROVIDER_GOOGLE`
- La API Key se inyecta en `AndroidManifest.xml` via `app.config.js` (ver sección 13)

---

### 4.3 `apps/core` — API Core (Express)

**Descripción**: Microservicio REST principal. Maneja CRUD de pedidos, rutas, ubicaciones y empresas. Usa Prisma para acceder a la base de datos.

```
apps/core/src/
├── routes/
│   ├── orders.routes.ts      → /api/v1/orders (GET, POST, PATCH /:id/estado)
│   ├── routes.routes.ts      → /api/v1/routes
│   ├── locations.routes.ts   → /api/v1/locations (ping GPS)
│   └── empresas.routes.ts    → /api/v1/empresas
│
├── modules/
│   ├── orders/
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts
│   │   └── orders.repository.ts
│   ├── routes/
│   │   ├── routes.controller.ts
│   │   ├── routes.service.ts
│   │   └── routes.repository.ts
│   └── locations/
│       ├── locations.controller.ts
│       ├── locations.service.ts
│       └── locations.repository.ts
│
└── middlewares/
    ├── auth.middleware.ts    → Valida token Supabase en Authorization header
    └── error.middleware.ts   → Manejador de errores centralizado
```

#### Endpoints

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/v1/orders` | GET | Lista pedidos de la empresa |
| `/api/v1/orders` | POST | Crear pedido |
| `/api/v1/orders/:id/estado` | PATCH | Actualizar estado (en_ruta, entregado, fallido) |
| `/api/v1/routes` | GET, POST | Listar / crear rutas |
| `/api/v1/locations` | GET, POST | Última ubicación / registrar ping GPS |
| `/api/v1/empresas` | GET | Info de la empresa |

---

### 4.4 `apps/auth` — Servicio de Autenticación (Express)

**Descripción**: Microservicio de autenticación sobre Supabase Auth. Añade lógica de negocio (roles, LogAcceso, validación de empresa).

```
apps/auth/src/
├── routes/
│   └── auth.routes.ts        → /api/v1/auth/*
│
└── modules/
    ├── auth/
    │   ├── auth.controller.ts
    │   └── auth.service.ts    → Supabase signUp, signIn, refresh, getUser
    └── users/
        ├── users.controller.ts
        └── users.service.ts   → Consultas de usuario con rol/empresa
```

#### Endpoints

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/v1/auth/signup` | POST | Registro de usuario |
| `/api/v1/auth/login` | POST | Login (email/password) |
| `/api/v1/auth/refresh` | POST | Renovar access token |
| `/api/v1/auth/me` | GET | Validar token + devolver usuario |
| `/api/v1/auth/logs` | POST | Registrar evento en LogAcceso |
| `/api/v1/users` | GET | Listar usuarios de una empresa |

---

### 4.5 `apps/ai-service` — Microservicio de IA (Express)

**Descripción**: Servicio stateless de cálculo. No tiene base de datos propia. Expone dos endpoints para scoring de riesgo y optimización de rutas.

```
apps/ai-service/src/
├── routes/
│   ├── score.routes.ts       → POST /api/score
│   └── optimize.routes.ts    → POST /api/optimize
│
└── services/
    └── ai.service.ts         → calcularScoreRiesgo() + optimizarRuta()
```

#### Algoritmos

**calcularScoreRiesgo()** — Heurística (0.0 – 1.0):
- Hora de entrega (alta demanda → riesgo mayor)
- Historial de retrasos del conductor
- Intentos fallidos en esa dirección
- Zona de riesgo (JSON de configuración de empresa)
- Fuera del área de servicio

**optimizarRuta()** — Nearest-Neighbor Greedy TSP:
- Complejidad: O(n²), válido hasta n ≤ 20 paradas
- Input: punto de origen + lista de coordenadas
- Output: orden optimizado de visitas

#### Endpoints

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/score` | POST | Calcular score de riesgo de un pedido |
| `/api/optimize` | POST | Optimizar orden de una ruta |

---

## 5. PAQUETES COMPARTIDOS (`packages/`)

### `packages/database`
- **Propósito**: Fuente única del schema Prisma y del cliente singleton
- **Archivo clave**: `prisma/schema.prisma`
- **Export**: `import { prisma } from '@ruteai/database'`

### `packages/shared-types`
- **Propósito**: Interfaces TypeScript usadas por todos los apps y paquetes
- **Interfaces principales**:
  - `IEmpresa` — Empresa multi-tenant
  - `IPedido` — Pedido de entrega
  - `IUsuario` — Usuario/conductor
  - `IRuta` — Ruta de reparto
  - `IUbicacion` — Ping GPS
  - `IAlerta` — Alerta automática

### `packages/shared`
- **Propósito**: Utilidades reutilizables
- **Contenido**:
  - `AppError` — Clase de error con código HTTP
  - `ApiResponse` — Helper para respuestas estandarizadas
  - `HTTP_STATUS` — Constantes de códigos HTTP

---

## 6. BASE DE DATOS (Schema Prisma)

### Modelos y relaciones

```
Empresa (1) ──< Usuario (muchos)
Empresa (1) ──< Pedido (muchos)
Empresa (1) ──< Ruta (muchos)
Empresa (1) ──< Alerta (muchos)
Empresa (1) ──< ReporteCache (muchos)

Usuario (1) ──< Pedido (muchos, como repartidor asignado)
Usuario (1) ──< Ruta (muchos, como repartidor)
Usuario (1) ──< Ubicacion (muchos, pings GPS)
Usuario (1) ──< Alerta (muchos)

Ruta (1) ──< Pedido (muchos)
```

### Tablas

| Tabla | Descripción | Campos clave |
|---|---|---|
| `Empresa` | Tenant principal | id, nombre, plan, configuracion (JSON) |
| `Usuario` | Conductor o encargado | id (Supabase Auth UUID), rol, telefono, empresaId |
| `Pedido` | Orden de entrega | estado, lat, lng, scoreRiesgo, fotoEntregaUrl, firmaEntregaUrl |
| `Ruta` | Agrupación de pedidos | estado, rutaOptimizada (JSON), repartidorId |
| `Ubicacion` | Historial GPS | lat, lng, timestamp, repartidorId — index por (repartidorId, timestamp) |
| `Alerta` | Alertas automáticas | tipo (desvio/retraso/riesgo_alto), leida, empresaId |
| `ReporteCache` | Snapshot diario | datos (JSON), unique (empresaId, fecha) |
| `LogAcceso` | Auditoría de auth | email, ip, timestamp, estado |

### Estados del Pedido

```
pendiente → en_ruta → entregado
                    ↘ fallido
```

### Estados de la Ruta

```
pendiente → activa → completada
                   ↘ cancelada
```

---

## 7. AUTENTICACIÓN Y SEGURIDAD

### Flujo de autenticación

1. Usuario ingresa email/password en `/login`
2. Next.js hace POST a `/api/auth/login` (BFF)
3. BFF llama a `apps/auth` → Supabase Auth
4. Supabase devuelve `access_token` + `refresh_token`
5. Tokens guardados en cookies httpOnly (Supabase SSR)
6. Server Components leen la sesión via `createServerClient(cookies())`

### OAuth Google

1. Click "Continuar con Google"
2. Redirect a Supabase OAuth
3. Callback en `/auth/callback/route.ts`
4. Supabase intercambia code por session
5. Redirect a `/dashboard`

### Seguridad por capas

| Capa | Mecanismo |
|---|---|
| Base de datos | Supabase RLS (Row-Level Security) por empresaId |
| API | Auth middleware valida Supabase JWT |
| BFF | Server-side session check en Server Components |
| Secrets | Service role key solo en servidor, nunca al browser |
| Input | Validación Zod en cada endpoint |
| Audit | LogAcceso registra todos los eventos |

---

## 8. TIEMPO REAL (Supabase Realtime)

### Canal de tracking GPS

- **Canal**: `tracking_{empresaId}`
- **Frecuencia**: cada 5 segundos desde la app mobile
- **Flujo**:
  1. Mobile POST `/api/v1/locations` → inserta en tabla `Ubicacion`
  2. Supabase Realtime broadcast notifica al dashboard web
  3. Leaflet map se actualiza con nueva posición del conductor

### Canal de alertas

- **Hook**: `useAlertasRealtime.ts` en `apps/web/hooks/`
- Se suscribe a inserciones en tabla `Alerta` filtradas por `empresaId`
- Muestra toast o actualiza panel de alertas IA en tiempo real

---

## 9. EDGE FUNCTIONS (Supabase)

### `supabase/functions/daily-report/index.ts`

- **Trigger**: CRON 00:05 UTC todos los días
- **Lógica**:
  1. Obtiene todas las empresas activas
  2. Para cada empresa calcula métricas del día anterior:
     - Total pedidos, entregados, fallidos
     - Tasa de éxito (%)
     - Score de riesgo promedio
  3. Upsert en `ReporteCache` (unique por empresaId + fecha)
- **Runtime**: Deno (TypeScript)

---

## 10. VARIABLES DE ENTORNO

### Requeridas en `apps/web` (Vercel)

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave admin (solo servidor) |
| `DATABASE_URL` | PostgreSQL via pgBouncer (port 6543) |
| `DIRECT_URL` | PostgreSQL directo para migrations (port 5432) |
| `AUTH_SERVICE_URL` | URL del servicio auth en Vercel |
| `CORE_SERVICE_URL` | URL del servicio core en Vercel |
| `AI_SERVICE_URL` | URL del servicio IA en Vercel |
| `NEXT_PUBLIC_APP_URL` | URL base del frontend |
| `TWILIO_ACCOUNT_SID` | Twilio para SMS |
| `TWILIO_AUTH_TOKEN` | Twilio auth |
| `TWILIO_PHONE_NUMBER` | Número Twilio origen |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | **Clave Google Maps (ya existe en .env.example)** |

### Requeridas en `apps/mobile` (Expo — Android únicamente)

Estas variables van en el archivo `apps/mobile/.env` (ver `apps/mobile/.env.example`).

| Variable | Descripción |
|---|---|
| `GOOGLE_MAPS_API_KEY` | Key Google Maps → se inyecta en `AndroidManifest.xml` durante prebuild. **No** lleva prefijo `EXPO_PUBLIC_`. |
| `EXPO_PUBLIC_SUPABASE_URL` | URL Supabase (usada en el bundle JS) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clave pública Supabase (usada en el bundle JS) |
| `EXPO_PUBLIC_API_URL` | URL del core service |

---

## 11. DEPLOY Y GIT FLOW

### Proyectos en Vercel

| Proyecto | App | Branch → Entorno |
|---|---|---|
| ruteai | apps/web | main → production, develop → staging |
| ruteai-auth | apps/auth | main → production |
| ruteai-core | apps/core | main → production |
| ruteai-ai-service | apps/ai-service | main → production |

### Estrategia de branches (BRANCHING.md)

```
main          → producción (protegido, requiere PR + approval)
develop       → staging (protegido, requiere PR)
feature/*     → desarrollo de features (PR → develop)
hotfix/*      → fixes urgentes (PR → main)
```

### Comandos útiles

```bash
# Instalar dependencias
pnpm install

# Desarrollo (todos los servicios en paralelo)
pnpm dev

# Solo web
pnpm --filter @ruteai/web dev

# Solo mobile
pnpm --filter @ruteai/mobile start

# Generar cliente Prisma
pnpm db:generate

# Abrir Prisma Studio
pnpm db:studio

# Build producción
pnpm build
```

---

## 12. DISEÑO Y UI

### Paleta de colores

| Color | Hex | Uso |
|---|---|---|
| Primary | `#f59e0b` (amber-500) | Botones CTA, acciones principales |
| AI/Purple | `#a78bfa` (purple-400) | Features de IA, alertas inteligentes |
| Background | `#09090b` (zinc-950) | Fondo principal (dark mode) |
| Surface | `#18181b` (zinc-900) | Cards, panels |
| Text | `#fafaf8` | Texto principal |
| Success | `#22c55e` (green-500) | Entregado, éxito |
| Error | `#ef4444` (red-500) | Fallido, error |
| Warning | `#f59e0b` (amber-500) | Riesgo alto |

### Tipografía
- **Geist Sans**: fuente principal (next/font/google)
- **Geist Mono**: fuente monospace para datos técnicos

### Componentes principales del dashboard
- `MapaRutasRender.tsx` — Mapa Leaflet (actualmente OpenStreetMap)
- `DashboardKPIs.tsx` — Cards de métricas
- `GraficoSemanal.tsx` — Recharts area chart
- `AlertasIA.tsx` — Panel de alertas automáticas

---

## 13. GOOGLE MAPS EN MOBILE (Android — APK)

La app mobile es **Android únicamente**. El objetivo es generar un APK, no publicar en Play Store.

### Estado del código (ya implementado)

| Archivo | Cambio realizado |
|---|---|
| [apps/mobile/app.config.js](apps/mobile/app.config.js) | Config dinámica: inyecta `GOOGLE_MAPS_API_KEY` en `AndroidManifest.xml` durante prebuild |
| [apps/mobile/src/components/domain/MapRenderer.tsx](apps/mobile/src/components/domain/MapRenderer.tsx) | `PROVIDER_GOOGLE` activado |
| [apps/mobile/.env.example](apps/mobile/.env.example) | Documenta todas las variables del mobile |
| [apps/mobile/app.json](apps/mobile/app.json) | Sección `ios` eliminada (solo Android) |

### Único paso pendiente: pegar la API Key

1. Obtener key en [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Habilitar en esa key: **Maps SDK for Android**
3. Restricción Android: Package name `com.ruteai.mobile` + SHA-1 del keystore de debug
4. Crear `apps/mobile/.env` copiando `.env.example`
5. Pegar la key: `GOOGLE_MAPS_API_KEY=tu_key_aqui`
6. Ejecutar `npx expo prebuild --clean` → la key se incrusta en `AndroidManifest.xml`
7. Build del APK: `npx expo run:android` (debug) o `eas build -p android --profile preview` (APK sin Play Store)

### Cómo obtener el SHA-1 del keystore de debug (para restringir la key)

Sin Java local, usar EAS:
```bash
# Necesita Node/EAS CLI instalados en otro equipo o en CI
eas credentials --platform android
# → Crea/muestra el keystore y su SHA-1
```

Alternativa local (si hay Java):
```bash
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android -keypass android
# Buscar la línea: SHA1: XX:XX:XX:...
```

### Generar APK con EAS (sin Play Store)

```bash
# Instalar EAS CLI (requiere Node)
npm install -g eas-cli

# Login con tu cuenta Expo
eas login

# Build APK (perfil "preview" genera .apk instalable directamente)
cd apps/mobile
eas build -p android --profile preview
```

El APK resultante se descarga desde el dashboard de Expo y se instala directamente en el dispositivo Android.

---

## 14. TESTING

| App | Herramienta | Config |
|---|---|---|
| `apps/web` | Jest + React Testing Library | `jest.config.ts` |
| `apps/mobile` | Jest + jest-expo | `jest.config.ts` con preset jest-expo |

```bash
# Correr tests web
pnpm --filter @ruteai/web test

# Correr todos los tests
pnpm test
```

---

## 15. GEOCODING

**Servicio actual**: Nominatim (OpenStreetMap)
- **Archivo**: `apps/web/lib/geocodingService.ts`
- **Sin API key**: completamente gratuito
- **Timeout**: 5 segundos (no bloquea la creación del pedido)
- **Fallback**: si falla, el pedido se crea sin coordenadas

**Relevancia para Google Maps**: Al implementar Google Maps, se puede optar por migrar a Google Geocoding API para mayor precisión, especialmente en direcciones de LATAM.

---

## 16. SMS Y NOTIFICACIONES

**Twilio** (`apps/web/lib/twilioService.ts`):
- Notifica al cliente cuando el pedido pasa a `en_ruta` o `entregado`
- Non-blocking (no detiene el flujo si falla)
- Configurable por empresa via el JSON de configuración

---

*Este documento fue generado el 3 de junio de 2026 para dar contexto completo antes de implementar Google Maps en `apps/mobile`.*
