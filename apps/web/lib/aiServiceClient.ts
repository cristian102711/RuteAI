// ============================================================
// AI Service Client — Conecta apps/web con apps/ai-service
// Solo se ejecuta en el SERVIDOR (Server Actions / API Routes)
// Nunca exponer AI_SERVICE_URL en el frontend.
// ============================================================

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

// ── Tipos ────────────────────────────────────────────────────

interface ScorePayload {
  pedidoId: string;
  // Modo IA — Open Router (preferido cuando están disponibles)
  producto?: string;
  direccion?: string;
  fechaEntrega?: string | null;
  // Modo heurístico — fallback determinista
  lat?: number;
  lng?: number;
  hora?: number;
  diasRetraso?: number;
  intentosFallidos?: number;
  zonaRiesgo?: boolean;
}

interface ScoreResult {
  score: number;         // 0.0 - 1.0
  nivel: 'bajo' | 'medio' | 'alto';
  razones: string[];
}

// ── Fallback determinista ────────────────────────────────────
// Si el ai-service no está disponible, usamos esta heurística
// liviana para no bloquear la creación del pedido.
function fallbackScore(payload: ScorePayload): ScoreResult {
  let score = 0;
  const razones: string[] = [];

  if ((payload.hora ?? 12) >= 22 || (payload.hora ?? 12) <= 6) {
    score += 0.25;
    razones.push('Entrega en horario nocturno');
  }
  if ((payload.diasRetraso ?? 0) >= 3) {
    score += 0.30;
    razones.push(`${payload.diasRetraso} días de retraso acumulado`);
  } else if ((payload.diasRetraso ?? 0) >= 1) {
    score += 0.15;
    razones.push(`${payload.diasRetraso} día(s) de retraso`);
  }
  if ((payload.intentosFallidos ?? 0) >= 2) {
    score += 0.25;
    razones.push(`${payload.intentosFallidos} intentos fallidos`);
  } else if ((payload.intentosFallidos ?? 0) === 1) {
    score += 0.10;
    razones.push('1 intento fallido previo');
  }
  if (payload.zonaRiesgo) {
    score += 0.20;
    razones.push('Zona de riesgo identificada');
  }

  score = Math.min(1, Math.max(0, score));
  const nivel: ScoreResult['nivel'] =
    score > 0.6 ? 'alto' : score > 0.3 ? 'medio' : 'bajo';
  if (razones.length === 0) razones.push('Sin factores de riesgo detectados');

  return { score: parseFloat(score.toFixed(2)), nivel, razones };
}

// ── Optimización de rutas (TSP nearest-neighbor / SLA en ai-service) ──

export interface PuntoRuta {
  id: string;
  lat: number;
  lng: number;
  fechaEntregaLimite?: string | null;
}

export interface ResumenRuta {
  distanciaTotalKm: number;
  duracionTotalMin: number;
  paradasEnRiesgo: number;
}

export interface OptimizacionResultado {
  rutaOptimizada: PuntoRuta[];
  algoritmo: 'sla-heuristico' | 'nearest-neighbor';
  resumen?: ResumenRuta;
  razon?: string;
}

export async function optimizarRuta(
  origen: PuntoRuta,
  puntos: PuntoRuta[],
): Promise<OptimizacionResultado> {
  if (!AI_SERVICE_URL || puntos.length === 0) {
    return { rutaOptimizada: puntos, algoritmo: 'nearest-neighbor' };
  }

  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origen, puntos }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) throw new Error(`ai-service respondió con status ${response.status}`);

    const json = (await response.json()) as {
      success: boolean;
      data: {
        rutaOptimizada: PuntoRuta[];
        algoritmo: OptimizacionResultado['algoritmo'];
        resumen?: ResumenRuta;
        razon?: string;
      };
    };

    if (!json.success) throw new Error('ai-service retornó success: false');

    return {
      rutaOptimizada: json.data.rutaOptimizada,
      algoritmo:      json.data.algoritmo ?? 'nearest-neighbor',
      resumen:        json.data.resumen,
      razon:          json.data.razon,
    };
  } catch (error) {
    console.error('[AI Client] Falló optimización, usando orden original:', error);
    return { rutaOptimizada: puntos, algoritmo: 'nearest-neighbor' };
  }
}

// ── Score de riesgo principal ────────────────────────────────
// Prefiere el modo IA (Open Router) cuando se proveen producto+dirección.
// Si el ai-service no responde, aplica el fallback heurístico para no
// bloquear la creación del pedido.
export async function obtenerScoreRiesgo(payload: ScorePayload): Promise<ScoreResult> {
  if (!AI_SERVICE_URL) {
    console.warn('[AI Client] AI_SERVICE_URL no configurada — usando fallback');
    return fallbackScore(payload);
  }

  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) throw new Error(`ai-service respondió con status ${response.status}`);

    const json = (await response.json()) as {
      success: boolean;
      data: ScoreResult;
    };

    if (!json.success) throw new Error('ai-service retornó success: false');

    console.info(
      `[AI Client] Score: ${json.data.score} (${json.data.nivel}) — ${json.data.razones.join(', ')}`,
    );

    return json.data;
  } catch (error) {
    console.error('[AI Client] Falló la llamada al ai-service, usando fallback:', error);
    return fallbackScore(payload);
  }
}

// ── Reorganización de pedidos por prioridad IA ────────────────

export interface PedidoParaReorganizar {
  id: string;
  producto: string;
  direccion: string;
  estado: string;
  scoreRiesgo?: number | null;
  fechaEntregaLimite?: string | Date | null;
  urgencia?: boolean;
}

export interface ReorganizacionResultado {
  idsOrdenados: string[];
  razon: string;
  totalPedidos: number;
}

export async function reorganizarPedidos(
  pedidos: PedidoParaReorganizar[],
): Promise<ReorganizacionResultado> {
  if (!AI_SERVICE_URL || pedidos.length === 0) {
    return {
      idsOrdenados: pedidos.map((p) => p.id),
      razon: 'Sin servicio de IA disponible — orden sin cambios.',
      totalPedidos: pedidos.length,
    };
  }

  try {
    const payload = pedidos.map((p) => ({
      id:                 p.id,
      producto:           p.producto,
      direccion:          p.direccion,
      estado:             p.estado,
      scoreRiesgo:        p.scoreRiesgo ?? 0,
      fechaEntregaLimite: p.fechaEntregaLimite instanceof Date
        ? p.fechaEntregaLimite.toISOString()
        : (p.fechaEntregaLimite ?? null),
      urgencia: p.urgencia ?? false,
    }));

    const response = await fetch(`${AI_SERVICE_URL}/api/reorganize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedidos: payload }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) throw new Error(`ai-service respondió con status ${response.status}`);

    const json = (await response.json()) as {
      success: boolean;
      data: ReorganizacionResultado;
    };

    if (!json.success) throw new Error('ai-service retornó success: false');

    return json.data;
  } catch (error) {
    console.error('[AI Client] Falló reorganización:', error);
    return {
      idsOrdenados: pedidos.map((p) => p.id),
      razon: 'Error al contactar la IA — se mantiene el orden original.',
      totalPedidos: pedidos.length,
    };
  }
}
