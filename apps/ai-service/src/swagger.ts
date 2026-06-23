/**
 * OpenAPI 3.0 — ai-service (Inteligencia Artificial)
 * Endpoints de scoring de riesgo y optimización de rutas.
 */
import swaggerUi from "swagger-ui-express";
import { Router } from "express";

const spec = {
  openapi: "3.0.0",
  info: {
    title: "RuteAI AI Service",
    version: "1.0.0",
    description:
      "Microservicio de inteligencia artificial de RuteAI. Calcula scores de riesgo de entrega y optimiza rutas usando algoritmos heurísticos conscientes de SLA.",
    contact: { name: "Equipo RuteAI", email: "soporte@ruteai.cl" },
  },
  servers: [
    { url: "http://localhost:3002", description: "Desarrollo local" },
  ],
  tags: [
    { name: "Health", description: "Estado del servicio" },
    { name: "Score", description: "Scoring de riesgo de entrega" },
    { name: "Optimización", description: "Planificación y optimización de rutas" },
  ],
  components: {
    schemas: {
      ScoreRequest: {
        type: "object",
        required: ["pedidoId", "lat", "lng", "hora"],
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
              pedidoId: { type: "string", format: "uuid" },
              score: { type: "integer", minimum: 0, maximum: 100, example: 72, description: "Score de riesgo (0=seguro, 100=alto riesgo)" },
              nivel: { type: "string", enum: ["bajo", "medio", "alto"], example: "alto" },
              razones: { type: "array", items: { type: "string" }, example: ["Hora pico (14h)", "Zona de riesgo"] },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
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
            type: "array",
            minItems: 1,
            maxItems: 20,
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
          velocidadKmh: { type: "number", example: 30, description: "Velocidad promedio del vehículo (default 25 km/h)" },
        },
      },
      OptimizeResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              rutaOptimizada: { type: "array", items: { type: "object" }, description: "Puntos reordenados óptimamente" },
              etas: { type: "array", items: { type: "object", properties: { id: { type: "string" }, eta: { type: "string", format: "date-time" }, enRiesgoSLA: { type: "boolean" } } } },
              resumen: {
                type: "object",
                properties: {
                  distanciaTotalKm: { type: "number", example: 15.3 },
                  duracionTotalMin: { type: "number", example: 45 },
                  paradasEnRiesgo: { type: "integer", example: 1 },
                },
              },
              totalPuntos: { type: "integer" },
              algoritmo: { type: "string", enum: ["nearest-neighbor", "sla-heuristico"], description: "Algoritmo usado según si hay deadlines" },
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
            content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", example: "ok" }, service: { type: "string", example: "ai-service" }, version: { type: "string", example: "1.0.0" } } } } },
          },
        },
      },
    },
    "/api/score": {
      post: {
        tags: ["Score"],
        summary: "Calcular score de riesgo de un pedido",
        description: "Calcula la probabilidad de fallo en la entrega usando un modelo heurístico que pondera: hora del día, zona geográfica, días de retraso e intentos fallidos. Retorna un score 0-100 con nivel (bajo/medio/alto) y las razones.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ScoreRequest" } } },
        },
        responses: {
          "200": { description: "Score calculado exitosamente", content: { "application/json": { schema: { $ref: "#/components/schemas/ScoreResponse" } } } },
          "400": { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/optimize": {
      post: {
        tags: ["Optimización"],
        summary: "Optimizar ruta de entrega",
        description: "Planifica el orden óptimo de paradas usando nearest-neighbor o SLA-heurístico (si hay fechas límite). Calcula ETA por parada, distancia total y paradas en riesgo de incumplir SLA.",
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
}));

export { spec as aiSwaggerSpec };
