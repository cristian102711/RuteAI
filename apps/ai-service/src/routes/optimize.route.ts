import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { planificarRuta } from '../services/ai.service';

export const optimizeRouter = Router();

// ── Schema de validación ────────────────────────────────────
const PuntoSchema = z.object({
  id:  z.string(),
  lat: z.number(),
  lng: z.number(),
  fechaEntregaLimite: z.string().nullable().optional(), // ISO; habilita el SLA
});

const OptimizeSchema = z.object({
  origen:       PuntoSchema,
  puntos:       z.array(PuntoSchema).min(1).max(20),
  velocidadKmh: z.number().positive().optional(),
});

// ── POST /api/optimize ──────────────────────────────────────
// Planificación DETERMINISTA consciente del SLA: ordena para minimizar distancia
// priorizando no incumplir horas límite, y devuelve ETA por parada + resumen.
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

  const { origen, puntos, velocidadKmh } = parsed.data;
  const hayDeadlines = puntos.some((p) => !!p.fechaEntregaLimite);
  const plan = planificarRuta(origen, puntos, { velocidadKmh });

  res.json({
    success: true,
    data: {
      rutaOptimizada: plan.orden,
      etas:           plan.etas,
      resumen: {
        distanciaTotalKm: plan.distanciaTotalKm,
        duracionTotalMin: plan.duracionTotalMin,
        paradasEnRiesgo:  plan.paradasEnRiesgo,
      },
      totalPuntos: puntos.length,
      algoritmo:   hayDeadlines ? 'sla-heuristico' : 'nearest-neighbor',
      timestamp:   new Date().toISOString(),
    },
  });
});
