/**
 * OpenAPI 3.0 — ai-service (Inteligencia Artificial)
 * Scoring de riesgo (Open Router / heurístico), reorganización de pedidos por
 * prioridad (Open Router) y optimización de rutas consciente de SLA (determinista).
 */
import swaggerUi from "swagger-ui-express";
import { Router } from "express";

const spec = {
  openapi: "3.0.0",
  info: {
    title: "RuteAI AI Service",
    version: "1.0.0",
    description:
      "Microservicio de inteligencia artificial de RuteAI. Calcula scores de riesgo de entrega y reorganiza pedidos por prioridad logística usando Open Router (LLM), con fallback heurístico determinista. Optimiza rutas con un planificador consciente de SLA.",
    contact: { name: "Equipo RuteAI", email: "soporte@ruteai.cl" },
  },
  servers: [
    { url: "http://localhost:3001", description: "Desarrollo local" },
    { url: "https://ruteai-ai-service.vercel.app", description: "Producción (Vercel)" },
  ],
  tags: [
    { name: "Health", description: "Estado del servicio" },
    { name: "Score", description: "Scoring de riesgo de entrega (Open Router / heurístico)" },
    { name: "Reorganización", description: "Reorden de pedidos por prioridad logística (Open Router)" },
    { name: "Optimización", description: "Planificación de rutas consciente de SLA (determinista)" },
  ],
  components: {
    schemas: {
      // ── Score: modo IA (Open Router) ──────────────────────────
      ScoreIARequest: {
        type: "object",
        required: ["producto", "direccion"],
        description:
          "Modo IA (Open Router). Se activa cuando el body trae 'producto' y 'direccion'.",
        properties: {
          pedidoId: { type: "string", default: "new", example: "a1b2c3d4-..." },
          producto: { type: "string", example: "Laptop frágil", description: "Producto o SKU del pedido" },
          direccion: { type: "string", example: "Av. Providencia 1234, Santiago" },
          fechaEntrega: {
            type: "string", format: "date-time", nullable: true,
            description: "Hora límite de entrega (ISO). Opcional.",
          },
        },
      },
      // ── Score: modo heurístico (determinista, legacy) ─────────
      ScoreHeuristicoRequest: {
        type: "object",
        required: ["pedidoId", "lat", "lng", "hora"],
        description:
          "Modo heurístico determinista. Se usa cuando NO hay producto+dirección.",
        properties: {
          pedidoId: { type: "string", format: "uuid", example: "a1b2c3d4-e5f6-..." },
          lat: { type: "number", minimum: -90, maximum: 90, example: -33.4489 },
          lng: { type: "number", minimum: -180, maximum: 180, example: -70.6693 },
          hora: { type: "integer", minimum: 0, maximum: 23, example: 14, description: "Hora del día (0-23)" },
          diasRetraso: { type: "integer", minimum: 0, default: 0, description: "Días desde la fecha límite" },
          intentosFallidos: { type: "integer", minimum: 0, default: 0, description: "Intentos previos fallidos" },
          zonaRiesgo: { type: "boolean", default: false, description: "Si la zona es conocida como riesgosa" },
        },
      },
      ScoreResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              pedidoId: { type: "string" },
              score: {
                type: "number", format: "float", minimum: 0, maximum: 1, example: 0.35,
                description: "Score de riesgo (0.0 = seguro, 1.0 = riesgo máximo)",
              },
              nivel: { type: "string", enum: ["bajo", "medio", "alto"], example: "medio" },
              razones: {
                type: "array", items: { type: "string" },
                example: ["La entrega es urgente y el producto es frágil; riesgo moderado."],
              },
              algoritmo: { type: "string", enum: ["openrouter-ia", "heuristico"], example: "openrouter-ia" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
      // ── Reorganización por prioridad (Open Router) ────────────
      ReorganizeRequest: {
        type: "object",
        required: ["pedidos"],
        properties: {
          pedidos: {
            type: "array", minItems: 1, maxItems: 50,
            items: {
              type: "object",
              required: ["id"],
              properties: {
                id: { type: "string", example: "dc481cf0-f52b-4d73-8d4a-6543d66eb8da" },
                producto: { type: "string", example: "Medicamentos urgentes" },
                direccion: { type: "string", example: "Ruta 68 km 5, Pudahuel" },
                estado: { type: "string", example: "en_ruta" },
                scoreRiesgo: { type: "number", minimum: 0, maximum: 100, example: 85, description: "Riesgo en escala 0-100" },
                fechaEntregaLimite: { type: "string", format: "date-time", nullable: true },
                urgencia: { type: "boolean", example: true },
              },
            },
          },
        },
      },
      ReorganizeResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              idsOrdenados: {
                type: "array", items: { type: "string" },
                description: "IDs originales reordenados por prioridad (permutación exacta de la entrada).",
              },
              razon: { type: "string", example: "Se priorizó la fecha límite más próxima y luego el mayor riesgo." },
              totalPedidos: { type: "integer", example: 3 },
              algoritmo: { type: "string", example: "openrouter-ia" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
      // ── Optimización de rutas (determinista) ──────────────────
      OptimizeRequest: {
        type: "object",
        required: ["origen", "puntos"],
        properties: {
          origen: {
            type: "object",
            required: ["id", "lat", "lng"],
            properties: {
              id: { type: "string", example: "bodega-central" },
              lat: { type: "number", example: -33.4489 },
              lng: { type: "number", example: -70.6693 },
            },
          },
          puntos: {
            type: "array", minItems: 1, maxItems: 20,
            items: {
              type: "object",
              required: ["id", "lat", "lng"],
              properties: {
                id: { type: "string", example: "pedido-001" },
                lat: { type: "number", example: -33.4312 },
                lng: { type: "number", example: -70.6114 },
                fechaEntregaLimite: { type: "string", format: "date-time", nullable: true, description: "Hora límite SLA (activa priorización)" },
              },
            },
          },
          velocidadKmh: { type: "number", example: 30, description: "Velocidad promedio del vehículo (default 28 km/h)" },
        },
      },
      OptimizeResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              rutaOptimizada: { type: "array", items: { type: "object" }, description: "Origen + puntos reordenados óptimamente" },
              etas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    etaMin: { type: "integer", description: "Minutos desde el inicio hasta completar la parada" },
                    distanciaKm: { type: "number", description: "Tramo desde la parada anterior" },
                    enRiesgo: { type: "boolean", description: "Llegaría después de su hora límite" },
                  },
                },
              },
              resumen: {
                type: "object",
                properties: {
                  distanciaTotalKm: { type: "number", example: 15.3 },
                  duracionTotalMin: { type: "number", example: 45 },
                  paradasEnRiesgo: { type: "integer", example: 1 },
                },
              },
              totalPuntos: { type: "integer" },
              algoritmo: { type: "string", enum: ["nearest-neighbor", "sla-heuristico"], description: "Según si hay deadlines" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string" },
          details: { type: "object" },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Estado del servicio IA",
        responses: {
          "200": {
            description: "Servicio operativo",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, service: { type: "string", example: "@ruteai/ai-service" }, status: { type: "string", example: "online" }, version: { type: "string", example: "1.0.0" } } } } },
          },
        },
      },
    },
    "/api/score": {
      post: {
        tags: ["Score"],
        summary: "Calcular score de riesgo de un pedido",
        description:
          "Dos modos según el body:\n\n" +
          "• **Modo IA (Open Router)** — si llegan `producto` + `direccion`. Evalúa el riesgo con un LLM (`openai/gpt-oss-120b:free` por defecto). Si la key no está configurada o falla, cae a un score de precaución.\n\n" +
          "• **Modo heurístico** — si llegan `lat`/`lng`/`hora`. Algoritmo determinista que pondera horario, retraso, intentos fallidos y zona.\n\n" +
          "Ambos modos devuelven score 0.0-1.0, nivel (bajo/medio/alto) y razones.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { oneOf: [{ $ref: "#/components/schemas/ScoreIARequest" }, { $ref: "#/components/schemas/ScoreHeuristicoRequest" }] },
              examples: {
                modoIA: { summary: "Modo IA (Open Router)", value: { producto: "Laptop frágil", direccion: "Av. Providencia 1234, Santiago", fechaEntrega: "2026-06-23T22:00:00Z" } },
                modoHeuristico: { summary: "Modo heurístico", value: { pedidoId: "p1", lat: -33.4489, lng: -70.6693, hora: 23, diasRetraso: 2 } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Score calculado exitosamente", content: { "application/json": { schema: { $ref: "#/components/schemas/ScoreResponse" } } } },
          "400": { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/reorganize": {
      post: {
        tags: ["Reorganización"],
        summary: "Reorganizar pedidos por prioridad logística (IA)",
        description:
          "Recibe una lista de pedidos y devuelve sus IDs reordenados por prioridad usando Open Router. " +
          "Criterios: fecha límite más próxima, urgencia, mayor score de riesgo y estado 'en_ruta' antes que 'pendiente'.\n\n" +
          "Internamente el prompt usa índices numéricos (no los UUID) para evitar que el modelo altere los identificadores; el servicio mapea el resultado de vuelta a los IDs reales. " +
          "Si la key no está configurada o la respuesta es inválida, mantiene el orden original.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ReorganizeRequest" } } },
        },
        responses: {
          "200": { description: "Pedidos reorganizados (o sin cambios si la IA no está disponible)", content: { "application/json": { schema: { $ref: "#/components/schemas/ReorganizeResponse" } } } },
          "400": { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/optimize": {
      post: {
        tags: ["Optimización"],
        summary: "Optimizar ruta de entrega",
        description:
          "Planifica el orden óptimo de paradas usando nearest-neighbor o SLA-heurístico (si hay fechas límite). Calcula ETA por parada, distancia total y paradas en riesgo de incumplir SLA. Algoritmo 100% determinista (sin LLM).",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/OptimizeRequest" } } },
        },
        responses: {
          "200": { description: "Ruta optimizada", content: { "application/json": { schema: { $ref: "#/components/schemas/OptimizeResponse" } } } },
          "400": { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
  },
};

export const swaggerRouter = Router();
swaggerRouter.use("/", swaggerUi.serve, swaggerUi.setup(spec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "RuteAI AI — API Docs",
  customCssUrl: "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css",
  customJs: [
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js"
  ]
}));

export { spec as aiSwaggerSpec };
