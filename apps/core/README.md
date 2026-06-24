# @ruteai/core — Microservicio de Negocio y Datos

## ¿Qué es?
Express + Prisma. Dueño único de los datos del sistema.
Implementa multi-tenancy: empresaId siempre derivado del JWT.

## Puerto
- Local: http://localhost:3003
- Producción: https://ruteai-core.vercel.app

## Stack
- Express 4 · TypeScript · Prisma 5 · PostgreSQL / Supabase · Zod

## Instalación
```powershell
pnpm install
```

## Variables de entorno
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ruteai
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/ruteai
AUTH_SERVICE_URL=http://localhost:3002
PORT=3003
```

## Ejecución
```powershell
pnpm --filter @ruteai/core dev
```

## Pruebas
```powershell
pnpm --filter @ruteai/core test
pnpm --filter @ruteai/core test -- --coverage
```
Cobertura actual: 100% statements · 83.33% branches · 100% functions

## Endpoints principales
| Método | Path | Descripción |
|--------|------|-------------|
| GET | /api/v1/orders | Listar pedidos de la empresa |
| POST | /api/v1/orders | Crear pedido |
| PATCH | /api/v1/orders/:id/estado | Cambiar estado |
| GET | /api/v1/locations | Últimas ubicaciones GPS |
| POST | /api/v1/locations | Registrar ping GPS |
| GET | /api/v1/routes | Listar rutas |
| POST | /api/v1/routes | Crear ruta del día |
| GET | /api/v1/empresas/me | Datos de la empresa |

## Swagger UI
http://localhost:3003/api/docs

## Persistencia
Ver packages/database/README.md para el modelo completo.
Equivalencia académica: Prisma ORM ≡ JPA · migrations SQL ≡ Stored Procedures
