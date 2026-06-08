import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_LIMIT = 100; // Máximo de 100 peticiones por IP en la ventana

interface RateLimitData {
  count: number;
  resetTime: number;
}

const cache = new Map<string, RateLimitData>();

// Limpieza periódica para evitar fugas de memoria
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of cache.entries()) {
    if (now > data.resetTime) {
      cache.delete(ip);
    }
  }
}, WINDOW_MS);

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  const record = cache.get(ip);

  if (!record || now > record.resetTime) {
    cache.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    res.setHeader("X-RateLimit-Limit", MAX_LIMIT);
    res.setHeader("X-RateLimit-Remaining", MAX_LIMIT - 1);
    res.setHeader("X-RateLimit-Reset", Math.ceil((now + WINDOW_MS) / 1000));
    next();
    return;
  }

  if (record.count >= MAX_LIMIT) {
    logger.warn("Rate limit excedido por IP", { ip, count: record.count });
    res.setHeader("X-RateLimit-Limit", MAX_LIMIT);
    res.setHeader("X-RateLimit-Remaining", 0);
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));
    res.status(429).json({
      success: false,
      error: "Demasiadas peticiones. Por favor, intente de nuevo más tarde (Rate limit excedido).",
    });
    return;
  }

  record.count += 1;
  res.setHeader("X-RateLimit-Limit", MAX_LIMIT);
  res.setHeader("X-RateLimit-Remaining", MAX_LIMIT - record.count);
  res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));
  next();
}
