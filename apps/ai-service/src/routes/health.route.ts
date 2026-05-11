import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    success: true,
    service: '@ruteai/ai-service',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});
