# @ruteai/auth — Microservicio de Autenticación

## ¿Qué es?
Express + Supabase Auth. Única fuente de autenticación del sistema.
Emite y valida JWT para todos los microservicios.

## Puerto
- Local: http://localhost:3002
- Producción: https://ruteai-auth.vercel.app

## Stack
- Express 4 · TypeScript · Supabase Auth · Zod

## Instalación
```powershell
pnpm install
```

## Variables de entorno
```
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role>
PORT=3002
```

## Ejecución
```powershell
pnpm --filter @ruteai/auth dev
```

## Pruebas
```powershell
pnpm --filter @ruteai/auth test
pnpm --filter @ruteai/auth test -- --coverage
```
Cobertura actual: 100% statements · 81.81% branches · 100% functions

## Endpoints
| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | /health | No | Health check |
| POST | /api/auth/login | No | Login → JWT |
| POST | /api/auth/signup | No | Registro → JWT |
| POST | /api/auth/refresh | No | Refresh token |
| POST | /api/auth/logout | No | Revocar sesión |
| GET | /api/auth/validate | No | Validar JWT (usado por core) |
| GET | /api/v1/users | JWT | Listar usuarios de la empresa |
| POST | /api/users/invite | JWT | Invitar repartidor por email |

## Swagger UI
http://localhost:3002/api/docs

## Seguridad
- GET /api/v1/users requiere JWT válido
- Filtra por empresaId del token (nunca del body)
- Fix DEF-001: aislamiento multi-tenant corregido y blindado con test de regresión
