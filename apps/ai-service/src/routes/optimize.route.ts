import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { optimizarRuta } from '../services/ai.service';

export const optimizeRouter = Router();

// ── Schema de validación ────────────────────────────────────
const PuntoSchema = z.object({
  id:  z.string(),
  lat: z.number(),
  lng: z.number(),
});

const OptimizeSchema = z.object({
  origen:  PuntoSchema,
  puntos:  z.array(PuntoSchema).min(1).max(20),
});

// ── POST /api/optimize ──────────────────────────────────────
optimizeRouter.post('/', (req: Request, res: Response) => {
  const parsed = OptimizeSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { origen, puntos } = parsed.data;
  const rutaOptimizada = optimizarRuta(origen, puntos);

  res.json({
    success: true,
    data: {
      rutaOptimizada,
      totalPuntos:   puntos.length,
      algoritmo:     'nearest-neighbor',
      timestamp:     new Date().toISOString(),
    },
  });
});
