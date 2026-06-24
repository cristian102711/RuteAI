# @ruteai/web — BFF + Frontend

## ¿Qué es?
Next.js 16 (App Router). Actúa como Backend for Frontend (BFF): orquesta
geocoding, IA y autenticación, y delega la persistencia en apps/core.
Expone el dashboard del encargado y el portal del repartidor.

## Puertos y URLs
- Local: http://localhost:3000
- Producción: https://ruteai.vercel.app (configurar en ENV)

## Stack
- Next.js 16 · React 19 · TypeScript · Tailwind CSS
- Server Actions + API Routes como BFF
- Google Maps (@vis.gl/react-google-maps)
- Supabase Auth (JWT en cookies)
- Prisma (acceso directo en Server Actions)

## Instalación
```powershell
pnpm install
```

## Variables de entorno
Copia .env.example a .env y completa:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ruteai
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/ruteai
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role>
AUTH_SERVICE_URL=http://localhost:3002
CORE_SERVICE_URL=http://localhost:3003
AI_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_MAPS_KEY=<key>
```

## Ejecución
```powershell
pnpm --filter @ruteai/web dev
```

## Pruebas
```powershell
pnpm --filter @ruteai/web test
pnpm --filter @ruteai/web test -- --coverage
```
Cobertura actual: 88.33% statements · 80.61% branches · 87.50% functions

## API Routes principales (BFF)
| Método | Path | Descripción |
|--------|------|-------------|
| POST | /api/auth/login | Proxy a auth-service |
| POST | /api/pedidos | Crear pedido (geo + IA + core) |
| PATCH | /api/pedidos/[id]/estado | Actualizar estado |
| POST | /api/rutas | Optimizar + persistir ruta del día |
| GET | /api/ubicaciones | Últimas posiciones GPS |
| POST | /api/ai/reorganize | Reorganizar pedidos por IA |
| GET | /api/ai/score | Score de riesgo (modo dual) |

## Notas arquitectónicas
- Nunca expone URLs de microservicios al navegador
- empresaId siempre del JWT, nunca del body
- "atrasado" es estado calculado en runtime, no persistido
