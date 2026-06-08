import 'dotenv/config';
import express from "express";
import cors from "cors";
import { swaggerSpec } from "./lib/swagger";
import { healthRouter }    from "./routes/health.route";
import { ordersRouter }    from "./routes/orders.route";
import { routesRouter }    from "./routes/routes.route";
import { locationsRouter } from "./routes/locations.route";
import { empresasRouter }  from "./routes/empresas.route";

const app  = express();
const PORT = process.env.PORT ?? 3003;

app.use(cors());
app.use(express.json());

// ── Swagger spec JSON (para Postman, herramientas externas, etc.) ──────────
app.get("/api/v1/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json(swaggerSpec);
});

// ── Swagger UI via CDN — sin dependencias npm ─────────────────────────────
app.get("/api/v1/docs", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RouteAI Core API — Documentación</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0f0f12; }
    .swagger-ui .topbar { background: #18181b; border-bottom: 1px solid #27272a; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
    .swagger-ui .info h2.title { color: #f59e0b; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/v1/docs.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
      deepLinking: true,
      displayRequestDuration: true,
      persistAuthorization: true,
      tryItOutEnabled: true,
    });
  </script>
</body>
</html>`);
});

// ── Rutas del API ─────────────────────────────────────────────────────────
app.use("/api/v1",           healthRouter);
app.use("/api/v1/orders",    ordersRouter);
app.use("/api/v1/routes",    routesRouter);
app.use("/api/v1/locations", locationsRouter);
app.use("/api/v1/empresas",  empresasRouter);

export default app;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () =>
    console.log(`[@ruteai/core] running on http://localhost:${PORT}\n📄 Docs: http://localhost:${PORT}/api/v1/docs`)
  );
}
