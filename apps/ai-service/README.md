# @ruteai/ai-service — Microservicio de Inteligencia Artificial

## ¿Qué es?
Express sin base de datos propia. Motor de IA para scoring de riesgo
y optimización/reorganización de rutas. Modo dual: LLM (OpenRouter)
con fallback determinista (heurística SLA-aware).

## Puerto
- Local: http://localhost:3001
- Producción: https://ruteai-ai-service.vercel.app

## Stack
- Express 4 · TypeScript · Zod · OpenRouter API

## Instalación
```powershell
pnpm install
```

## Variables de entorno
```
PORT=3001
OPENROUTER_API_KEY=<key>
OPENROUTER_MODEL=openai/gpt-oss-120b:free
```

## Ejecución
```powershell
pnpm --filter @ruteai/ai-service dev
```

## Pruebas
```powershell
pnpm --filter @ruteai/ai-service test
pnpm --filter @ruteai/ai-service test -- --coverage
```
Cobertura actual: 94.46% statements · 82.35% branches · 93.75% functions

## Endpoints
| Método | Path | Descripción |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /api/score | Score de riesgo (modo dual) |
| POST | /api/optimize | Optimización de ruta SLA-aware |
| POST | /api/reorganize | Reorganización de pedidos por IA |

### POST /api/score — Modo dual
Con producto+direccion → OpenRouter LLM → score semántico
Con lat+lng+hora → heurística determinista legacy
La respuesta incluye campo algoritmo: "openrouter-ia" | "heuristico"

### POST /api/reorganize
Ordena pedidos por: deadline SLA · urgencia · score riesgo · estado.
Fallback seguro: si API key falta o respuesta inválida → orden original.

## Swagger UI
http://localhost:3001/api/docs
