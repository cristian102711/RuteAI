import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    success:   true,
    service:   "@ruteai/core",
    version:   "1.0.0",
    status:    "online",
    endpoints: [
      "GET    /api/v1/orders",
      "POST   /api/v1/orders",
      "GET    /api/v1/orders/:id",
      "PATCH  /api/v1/orders/:id",
      "DELETE /api/v1/orders/:id",
      "GET    /api/v1/routes",
      "POST   /api/v1/routes",
      "GET    /api/v1/locations",
      "GET    /api/v1/health",
    ],
    timestamp: new Date().toISOString(),
  });
});
