import { Router } from "express";
import type { Request, Response } from "express";

export const healthRouter = Router();

healthRouter.get("/health", (_req: Request, res: Response) => {
  res.json({
    success:   true,
    service:   "@ruteai/core",
    version:   "1.0.0",
    status:    "online",
    endpoints: [
      "GET    /api/v1/orders",
      "POST   /api/v1/orders",
      "GET    /api/v1/orders/:id",
      "GET    /api/v1/orders/:id/eventos",
      "PATCH  /api/v1/orders/:id/estado",
      "DELETE /api/v1/orders/:id",
      "GET    /api/v1/routes",
      "GET    /api/v1/routes/:id",
      "POST   /api/v1/routes",
      "PATCH  /api/v1/routes/:id/estado",
      "GET    /api/v1/locations",
      "POST   /api/v1/locations",
      "GET    /api/v1/locations/repartidor/:id",
      "GET    /api/v1/empresas            (rol super_admin)",
      "POST   /api/v1/empresas            (rol super_admin)",
      "PATCH  /api/v1/empresas/:id/toggle (rol super_admin)",
      "GET    /api/v1/health",
    ],
    timestamp: new Date().toISOString(),
  });
});
