import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { reorganizarPedidosConIA, type PedidoParaOrdenar } from '../services/openrouter.service';

export const reorganizeRouter = Router();

// ── Schema de validación ─────────────────────────────────────
const PedidoSchema = z.object({
  id:                 z.string().min(1),
  producto:           z.string().default('Producto'),
  direccion:          z.string().default('Sin dirección'),
  estado:             z.string().default('pendiente'),
  scoreRiesgo:        z.number().min(0).max(100).optional(),
  fechaEntregaLimite: z.string().nullable().optional(),
  urgencia:           z.boolean().optional().default(false),
});

const ReorganizeSchema = z.object({
  pedidos: z.array(PedidoSchema).min(1).max(50),
});

// ── POST /api/reorganize ─────────────────────────────────────
// Recibe lista de pedidos, consulta Open Router y devuelve
// los IDs ordenados por prioridad logística óptima.
reorganizeRouter.post('/', async (req: Request, res: Response) => {
  const parsed = ReorganizeSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const pedidos: PedidoParaOrdenar[] = parsed.data.pedidos.map((p) => ({
    id:                 p.id,
    producto:           p.producto,
    direccion:          p.direccion,
    estado:             p.estado,
    scoreRiesgo:        p.scoreRiesgo,
    fechaEntregaLimite: p.fechaEntregaLimite ?? null,
    urgencia:           p.urgencia ?? false,
  }));

  const resultado = await reorganizarPedidosConIA(pedidos);

  res.json({
    success: true,
    data: {
      idsOrdenados: resultado.idsOrdenados,
      razon:        resultado.razon,
      totalPedidos: pedidos.length,
      algoritmo:    'openrouter-ia',
      timestamp:    new Date().toISOString(),
    },
  });
});
