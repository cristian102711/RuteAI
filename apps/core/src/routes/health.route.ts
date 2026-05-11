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
      "PATCH  /api/v1/orders/:id/estado",
      "DELETE /api/v1/orders/:id",
      "GET    /api/v1/routes",
      "POST   /api/v1/routes",
      "PATCH  /api/v1/routes/:id/estado",
      "GET    /api/v1/locations",
      "POST   /api/v1/locations",
      "GET    /api/v1/locations/repartidor/:id",
      "GET    /api/v1/health",
    ],
    timestamp: new Date().toISOString(),
  });
});
