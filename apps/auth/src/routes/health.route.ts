import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    success:   true,
    service:   "@ruteai/auth",
    version:   "1.0.0",
    status:    "online",
    endpoints: [
      "POST /api/v1/auth/signup",
      "POST /api/v1/auth/login",
      "POST /api/v1/auth/refresh",
      "GET  /api/v1/users",
      "GET  /api/v1/health",
    ],
    timestamp: new Date().toISOString(),
  });
});
