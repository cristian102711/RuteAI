import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { calcularScoreRiesgo } from '../services/ai.service';

export const scoreRouter = Router();

// ── Schema de validación ────────────────────────────────────
const ScoreSchema = z.object({
  pedidoId:         z.string().min(1),
  lat:              z.number().min(-90).max(90),
  lng:              z.number().min(-180).max(180),
  hora:             z.number().min(0).max(23),          // 0-23
  diasRetraso:      z.number().min(0).default(0),
  intentosFallidos: z.number().min(0).default(0),
  zonaRiesgo:       z.boolean().default(false),
});

type ScoreInput = z.infer<typeof ScoreSchema>;

// ── POST /api/score ─────────────────────────────────────────
scoreRouter.post('/', (req: Request, res: Response) => {
  const parsed = ScoreSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const input: ScoreInput = parsed.data;
  const resultado = calcularScoreRiesgo(input);

  res.json({
    success: true,
    data: {
      pedidoId:  input.pedidoId,
      score:     resultado.score,
      nivel:     resultado.nivel,
      razones:   resultado.razones,
      timestamp: new Date().toISOString(),
    },
  });
});
