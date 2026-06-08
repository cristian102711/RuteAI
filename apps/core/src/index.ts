import 'dotenv/config';
import express from "express";
import cors from "cors";
import "dotenv/config";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./lib/swagger";
import { healthRouter }  from "./routes/health.route";
import { ordersRouter }  from "./routes/orders.route";
import { routesRouter }  from "./routes/routes.route";
import { locationsRouter } from "./routes/locations.route";
import { empresasRouter } from "./routes/empresas.route";

const app  = express();
const PORT = process.env.PORT ?? 3003;

app.use(cors());
app.use(express.json());

// ── Swagger UI ──────────────────────────────────────────────
// Documentación interactiva disponible en /api/v1/docs
app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "RouteAI Core API Docs",
  customCss: ".swagger-ui .topbar { display: none }",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
}));

// Exponer el JSON del spec para integración con herramientas externas
app.get("/api/v1/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api/v1", healthRouter);
app.use("/api/v1/orders",    ordersRouter);
app.use("/api/v1/routes",    routesRouter);
app.use("/api/v1/locations", locationsRouter);
app.use("/api/v1/empresas",  empresasRouter);

export default app;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () =>
    console.log(`[@ruteai/core] running on http://localhost:${PORT}`)
  );
}

