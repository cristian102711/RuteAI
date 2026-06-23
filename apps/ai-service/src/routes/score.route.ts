import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { calcularScoreRiesgo } from '../services/ai.service';
import { scorePedidoConIA } from '../services/openrouter.service';

export const scoreRouter = Router();

// ── Schema IA — nuevo formato (producto + dirección + fecha) ──
const ScoreIASchema = z.object({
  pedidoId:     z.string().optional().default('new'),
  producto:     z.string().min(1),
  direccion:    z.string().min(1),
  fechaEntrega: z.string().nullable().optional(),
});

// ── Schema heurístico — formato legacy (lat/lng/hora) ────────
const ScoreHeuristicoSchema = z.object({
  pedidoId:         z.string().min(1),
  lat:              z.number().min(-90).max(90),
  lng:              z.number().min(-180).max(180),
  hora:             z.number().min(0).max(23),
  diasRetraso:      z.number().min(0).default(0),
  intentosFallidos: z.number().min(0).default(0),
  zonaRiesgo:       z.boolean().default(false),
});

// ── POST /api/score ──────────────────────────────────────────
// Modo IA  → recibe { producto, direccion, fechaEntrega? }   → Open Router
// Modo heurístico → recibe { pedidoId, lat, lng, hora, … }   → algoritmo determinista
scoreRouter.post('/', async (req: Request, res: Response) => {
  const body = req.body;

  // Si el body trae "producto" y "direccion" → modo IA con Open Router
  if (typeof body.producto === 'string' && typeof body.direccion === 'string') {
    const parsed = ScoreIASchema.safeParse(body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { pedidoId, producto, direccion, fechaEntrega } = parsed.data;
    const resultado = await scorePedidoConIA(producto, direccion, fechaEntrega ?? null);
    const nivel = resultado.score > 0.6 ? 'alto' : resultado.score > 0.3 ? 'medio' : 'bajo';

    res.json({
      success: true,
      data: {
        pedidoId,
        score:     resultado.score,
        nivel,
        razones:   [resultado.justificacion],
        algoritmo: 'openrouter-ia',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Modo heurístico (backward compatible con el payload lat/lng)
  const parsed = ScoreHeuristicoSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const input = parsed.data;
  const resultado = calcularScoreRiesgo(input);

  res.json({
    success: true,
    data: {
      pedidoId:  input.pedidoId,
      score:     resultado.score,
      nivel:     resultado.nivel,
      razones:   resultado.razones,
      algoritmo: 'heuristico',
      timestamp: new Date().toISOString(),
    },
  });
});
