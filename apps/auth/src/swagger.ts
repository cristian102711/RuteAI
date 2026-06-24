/**
 * OpenAPI 3.0 — auth-service (Autenticación y usuarios)
 * Endpoints de login, registro, validación JWT, logs y gestión de usuarios.
 */
import swaggerUi from "swagger-ui-express";
import { Router } from "express";

const spec = {
  openapi: "3.0.0",
  info: {
    title: "RuteAI Auth Service",
    version: "1.0.0",
    description:
      "Microservicio de autenticación de RuteAI. Gestiona registro, login, validación de tokens JWT, refresh tokens, logs de acceso y CRUD de usuarios.",
    contact: { name: "Equipo RuteAI", email: "soporte@ruteai.cl" },
  },
  servers: [
    { url: "http://localhost:3001", description: "Desarrollo local" },
  ],
  tags: [
    { name: "Health", description: "Estado del servicio" },
    { name: "Autenticación", description: "Login, registro y sesiones" },
    { name: "Usuarios", description: "Gestión de usuarios de la empresa" },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Token JWT de Supabase Auth",
      },
    },
    schemas: {
      Usuario: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          nombre: { type: "string", example: "Juan Pérez" },
          email: { type: "string", format: "email", example: "juan@empresa.cl" },
          rol: { type: "string", enum: ["super_admin", "encargado", "repartidor"] },
          empresaId: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      TokenResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
          expiresIn: { type: "number", example: 3600 },
          usuario: { $ref: "#/components/schemas/Usuario" },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string", example: "Credenciales inválidas" },
        },
      },
    },
  },
  paths: {
    // ── HEALTH ──
    "/api/v1/health": {
      get: {
        tags: ["Health"],
        summary: "Estado del servicio auth",
        security: [],
        responses: {
          "200": {
            description: "Servicio operativo",
            content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", example: "ok" }, service: { type: "string", example: "auth" } } } } },
          },
        },
      },
    },
    // ── AUTENTICACIÓN ──
    "/api/v1/auth/signup": {
      post: {
        tags: ["Autenticación"],
        summary: "Registrar nuevo usuario",
        description: "Crea un usuario en Supabase Auth y en la tabla Usuario con el rol especificado.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "nuevo@empresa.cl" },
                  password: { type: "string", format: "password", minLength: 8, example: "MiClave123" },
                  nombre: { type: "string", example: "María Torres" },
                  rol: { type: "string", enum: ["encargado", "repartidor"], default: "encargado" },
                  empresaId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Usuario registrado", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { usuario: { $ref: "#/components/schemas/Usuario" } } } } } } } },
          "400": { description: "Datos inválidos" },
          "500": { description: "Error interno" },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Autenticación"],
        summary: "Iniciar sesión",
        description: "Autentica con email/password y retorna tokens JWT (access + refresh).",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "admin@empresa.cl" },
                  password: { type: "string", format: "password", example: "MiClave123" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Login exitoso", content: { "application/json": { schema: { $ref: "#/components/schemas/TokenResponse" } } } },
          "401": { description: "Credenciales inválidas" },
        },
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        tags: ["Autenticación"],
        summary: "Refrescar tokens",
        description: "Usa un refresh token para obtener nuevos access y refresh tokens.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Tokens renovados", content: { "application/json": { schema: { $ref: "#/components/schemas/TokenResponse" } } } },
          "401": { description: "Refresh token inválido o expirado" },
        },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["Autenticación"],
        summary: "Obtener perfil del usuario autenticado",
        description: "Valida el token JWT y retorna el perfil del usuario. Usado por otros microservicios para verificar identidad.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "Perfil del usuario", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { usuario: { $ref: "#/components/schemas/Usuario" } } } } } } } },
          "401": { description: "Token no proporcionado o inválido" },
        },
      },
    },
    "/api/v1/auth/logs": {
      post: {
        tags: ["Autenticación"],
        summary: "Registrar evento de autenticación",
        description: "Guarda un log de acceso (login exitoso, fallido, etc.) en la tabla LogAcceso para auditoría.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["evento", "userId", "email", "provider", "status", "timestamp"],
                properties: {
                  evento: { type: "string", example: "login" },
                  userId: { type: "string", format: "uuid" },
                  email: { type: "string", format: "email" },
                  provider: { type: "string", example: "google" },
                  status: { type: "string", enum: ["success", "error"] },
                  error: { type: "string" },
                  timestamp: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Log registrado" },
          "400": { description: "Datos inválidos" },
        },
      },
    },
    // ── USUARIOS ──
    "/api/v1/users": {
      get: {
        tags: ["Usuarios"],
        summary: "Listar usuarios de la empresa",
        description: "Retorna todos los usuarios registrados en la empresa del token autenticado.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "Lista de usuarios", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Usuario" } } } } },
          "401": { description: "No autenticado" },
        },
      },
    },
    "/api/v1/users/{id}": {
      patch: {
        tags: ["Usuarios"],
        summary: "Editar usuario",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nombre: { type: "string" },
                  rol: { type: "string", enum: ["encargado", "repartidor"] },
                  telefono: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Usuario actualizado" },
          "404": { description: "Usuario no encontrado" },
        },
      },
      delete: {
        tags: ["Usuarios"],
        summary: "Eliminar usuario",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Usuario eliminado" },
          "404": { description: "No encontrado" },
        },
      },
    },
  },
};

export const swaggerRouter = Router();
swaggerRouter.use("/", swaggerUi.serve, swaggerUi.setup(spec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "RuteAI Auth — API Docs",
  customCssUrl: "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css",
  customJs: [
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js"
  ]
}));

export { spec as authSwaggerSpec };
