import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { optimizarRutaIA } from '../services/gemini.service';

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
optimizeRouter.post('/', async (req: Request, res: Response) => {
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
  // Intenta optimizar con Gemini; cae al heurístico si no hay cuota/clave.
  const { ruta, algoritmo, razon } = await optimizarRutaIA(origen, puntos);

  res.json({
    success: true,
    data: {
      rutaOptimizada: ruta,
      totalPuntos:    puntos.length,
      algoritmo,
      razon,
      timestamp:      new Date().toISOString(),
    },
  });
});
