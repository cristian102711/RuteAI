// OpenAPI 3.0 spec definido como objeto TypeScript puro
// Sin dependencias externas — compatible con Vercel serverless
export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "RouteAI Core API",
    version: "1.0.0",
    description:
      "Microservicio principal de RouteAI — gestiona pedidos, rutas, ubicaciones en vivo y empresas. Todos los endpoints protegidos requieren un Bearer Token de Supabase Auth.",
    contact: {
      name: "RouteAI Team",
      url: "https://ruteai.vercel.app",
    },
  },
  servers: [
    { url: "https://ruteai-core.vercel.app", description: "Producción (Vercel)" },
    { url: "http://localhost:3003", description: "Desarrollo local" },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Token JWT emitido por Supabase Auth",
      },
    },
    schemas: {
      Pedido: {
        type: "object",
        properties: {
          id: { type: "string", example: "RA-5E15F" },
          empresaId: { type: "string", format: "uuid" },
          nombreCliente: { type: "string", example: "Cristian Ríos" },
          clienteTelefono: { type: "string", example: "+56912345678" },
          direccion: { type: "string", example: "Av. Providencia 123, Santiago" },
          producto: { type: "string", example: "iPhone 15 Pro" },
          estado: { type: "string", enum: ["pendiente", "en_ruta", "entregado", "fallido"] },
          lat: { type: "number", example: -33.4372 },
          lng: { type: "number", example: -70.6506 },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Ruta: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          empresaId: { type: "string", format: "uuid" },
          repartidorId: { type: "string", format: "uuid" },
          estado: { type: "string", enum: ["planificada", "en_curso", "completada", "cancelada"] },
          fecha: { type: "string", format: "date-time" },
        },
      },
      Ubicacion: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          empresaId: { type: "string", format: "uuid" },
          repartidorId: { type: "string", format: "uuid" },
          lat: { type: "number" },
          lng: { type: "number" },
          velocidad: { type: "number" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string", example: "Descripción del error" },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  tags: [
    { name: "Health", description: "Estado del servicio" },
    { name: "Orders", description: "Gestión de pedidos (CRUD completo)" },
    { name: "Routes", description: "Gestión de rutas de reparto" },
    { name: "Locations", description: "Ubicaciones GPS en tiempo real" },
    { name: "Empresas", description: "Gestión multi-tenant de empresas" },
  ],
  paths: {
    "/api/v1/health": {
      get: {
        tags: ["Health"],
        summary: "Estado del microservicio",
        security: [],
        responses: {
          200: { description: "Servicio online" },
        },
      },
    },
    "/api/v1/orders": {
      get: {
        tags: ["Orders"],
        summary: "Listar pedidos de la empresa autenticada",
        responses: {
          200: { description: "Lista de pedidos" },
          401: { description: "No autorizado" },
        },
      },
      post: {
        tags: ["Orders"],
        summary: "Crear un nuevo pedido",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["empresaId", "nombreCliente", "direccion", "producto"],
                properties: {
                  empresaId: { type: "string", format: "uuid" },
                  nombreCliente: { type: "string" },
                  clienteTelefono: { type: "string" },
                  direccion: { type: "string" },
                  producto: { type: "string" },
                  lat: { type: "number" },
                  lng: { type: "number" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Pedido creado" },
          400: { description: "Datos inválidos" },
          401: { description: "No autorizado" },
        },
      },
    },
    "/api/v1/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Obtener pedido por ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Pedido encontrado" },
          404: { description: "No encontrado" },
        },
      },
      delete: {
        tags: ["Orders"],
        summary: "Eliminar un pedido",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Eliminado correctamente" },
          404: { description: "No encontrado" },
        },
      },
    },
    "/api/v1/orders/{id}/estado": {
      patch: {
        tags: ["Orders"],
        summary: "Actualizar estado de un pedido",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["estado"],
                properties: {
                  estado: { type: "string", enum: ["pendiente", "en_ruta", "entregado", "fallido"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Estado actualizado" },
          400: { description: "Estado inválido" },
        },
      },
    },
    "/api/v1/routes": {
      get: {
        tags: ["Routes"],
        summary: "Listar rutas de una empresa",
        parameters: [{ name: "empresaId", in: "query", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Lista de rutas" }, 400: { description: "empresaId requerido" } },
      },
      post: {
        tags: ["Routes"],
        summary: "Crear una nueva ruta",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["empresaId", "repartidorId", "fecha"],
                properties: {
                  empresaId: { type: "string", format: "uuid" },
                  repartidorId: { type: "string", format: "uuid" },
                  fecha: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Ruta creada" }, 400: { description: "Datos inválidos" } },
      },
    },
    "/api/v1/routes/{id}/estado": {
      patch: {
        tags: ["Routes"],
        summary: "Actualizar estado de una ruta",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["estado"],
                properties: {
                  estado: { type: "string", enum: ["planificada", "en_curso", "completada", "cancelada"] },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Estado actualizado" }, 400: { description: "Estado inválido" } },
      },
    },
    "/api/v1/locations": {
      get: {
        tags: ["Locations"],
        summary: "Listar ubicaciones GPS de una empresa",
        parameters: [{ name: "empresaId", in: "query", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Lista de ubicaciones" }, 400: { description: "empresaId requerido" } },
      },
      post: {
        tags: ["Locations"],
        summary: "Registrar ubicación GPS de un repartidor",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["empresaId", "repartidorId", "lat", "lng"],
                properties: {
                  empresaId: { type: "string", format: "uuid" },
                  repartidorId: { type: "string", format: "uuid" },
                  lat: { type: "number" },
                  lng: { type: "number" },
                  velocidad: { type: "number" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Ubicación registrada" }, 400: { description: "Datos inválidos" } },
      },
    },
    "/api/v1/locations/repartidor/{id}": {
      get: {
        tags: ["Locations"],
        summary: "Última ubicación de un repartidor",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Ubicación encontrada" }, 404: { description: "Sin ubicación registrada" } },
      },
    },
  },
};
