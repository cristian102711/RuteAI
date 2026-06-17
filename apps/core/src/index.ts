import 'dotenv/config';
import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import { healthRouter }  from "./routes/health.route";
import { ordersRouter }  from "./routes/orders.route";
import { routesRouter }  from "./routes/routes.route";
import { locationsRouter } from "./routes/locations.route";
import { empresasRouter } from "./routes/empresas.route";

// ── Validación de entorno al arrancar (#7) ────────────────────
// Falla rápido con un mensaje claro si falta una variable crítica.
const REQUERIDAS = ["DATABASE_URL"];
const faltantes = REQUERIDAS.filter((k) => !process.env[k]);
if (faltantes.length > 0) {
  console.error(`[@ruteai/core] Faltan variables de entorno: ${faltantes.join(", ")}`);
  if (process.env.NODE_ENV === "production") {
    // En serverless conviene fallar el arranque antes que dar errores opacos.
    throw new Error(`Variables de entorno requeridas ausentes: ${faltantes.join(", ")}`);
  }
}

const app  = express();
const PORT = process.env.PORT ?? 3003;

// CORS restringido al origen del web (configurable por env). El core se
// consume principalmente server-to-server desde el BFF.
const ORIGENES = [
  "http://localhost:3000",
  "https://ruteai.vercel.app",
  process.env.WEB_URL,
].filter(Boolean) as string[];
app.use(cors({ origin: ORIGENES.length > 0 ? ORIGENES : true }));

app.use(express.json());

// ── Logging de requests (observabilidad #C) ───────────────────
// Una línea JSON por request, visible en Vercel → Functions → Logs.
app.use((req: Request, res: Response, next: NextFunction) => {
  const inicio = Date.now();
  res.on("finish", () => {
    console.log(JSON.stringify({
      event: "core.request",
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms: Date.now() - inicio,
      empresaId: req.user?.empresaId ?? null,
      usuarioId: req.user?.id ?? null,
      timestamp: new Date().toISOString(),
    }));
  });
  next();
});

app.use("/api/v1", healthRouter);
app.use("/api/v1/orders",    ordersRouter);
app.use("/api/v1/routes",    routesRouter);
app.use("/api/v1/locations", locationsRouter);
app.use("/api/v1/empresas",  empresasRouter);

// ── 404 handler ───────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// ── Manejador de errores global ───────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(JSON.stringify({
    event: "core.error",
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  }));
  res.status(500).json({ success: false, error: "Error interno del servidor" });
});

export default app;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () =>
    console.log(`[@ruteai/core] running on http://localhost:${PORT}`)
  );
}
