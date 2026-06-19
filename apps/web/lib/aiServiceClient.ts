// ============================================================
// AI Service Client — Conecta apps/web con apps/ai-service
// Solo se ejecuta en el SERVIDOR (Server Actions / API Routes)
// Nunca exponer AI_SERVICE_URL en el frontend.
// ============================================================

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

// ── Tipos ────────────────────────────────────────────────────
interface ScorePayload {
  pedidoId: string;
  lat: number;
  lng: number;
  hora: number;
  diasRetraso: number;
  intentosFallidos: number;
  zonaRiesgo: boolean;
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

  if (payload.hora >= 22 || payload.hora <= 6) {
    score += 0.25;
    razones.push('Entrega en horario nocturno');
  }
  if (payload.diasRetraso >= 3) {
    score += 0.30;
    razones.push(`${payload.diasRetraso} días de retraso acumulado`);
  } else if (payload.diasRetraso >= 1) {
    score += 0.15;
    razones.push(`${payload.diasRetraso} día(s) de retraso`);
  }
  if (payload.intentosFallidos >= 2) {
    score += 0.25;
    razones.push(`${payload.intentosFallidos} intentos fallidos`);
  } else if (payload.intentosFallidos === 1) {
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

// ── Optimización de rutas (TSP nearest-neighbor en ai-service) ──
export interface PuntoRuta {
  id: string;
  lat: number;
  lng: number;
  fechaEntregaLimite?: string | null; // ISO; habilita la planificación con SLA
}

export interface ResumenRuta {
  distanciaTotalKm: number;
  duracionTotalMin: number;
  paradasEnRiesgo: number;
}

export interface OptimizacionResultado {
  rutaOptimizada: PuntoRuta[];
  algoritmo: 'gemini' | 'sla-heuristico' | 'nearest-neighbor';
  resumen?: ResumenRuta;
  razon?: string;
}

// Devuelve los puntos reordenados + el algoritmo usado (Gemini o heurístico).
// Si ai-service no está disponible, devuelve el orden original (no bloqueante).
export async function optimizarRuta(
  origen: PuntoRuta,
  puntos: PuntoRuta[]
): Promise<OptimizacionResultado> {
  if (!AI_SERVICE_URL || puntos.length === 0) {
    return { rutaOptimizada: puntos, algoritmo: 'nearest-neighbor' };
  }

  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origen, puntos }),
      // La IA puede tardar; damos margen pero con tope.
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`ai-service respondió con status ${response.status}`);
    }

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
      algoritmo: json.data.algoritmo ?? 'nearest-neighbor',
      resumen: json.data.resumen,
      razon: json.data.razon,
    };
  } catch (error) {
    console.error('[AI Client] Falló optimización, usando orden original:', error);
    return { rutaOptimizada: puntos, algoritmo: 'nearest-neighbor' };
  }
}

// ── Cliente principal ────────────────────────────────────────
export async function obtenerScoreRiesgo(
  payload: ScorePayload
): Promise<ScoreResult> {
  // Si no hay URL configurada, usar fallback directamente
  if (!AI_SERVICE_URL) {
    console.warn('[AI Client] AI_SERVICE_URL no configurada — usando fallback');
    return fallbackScore(payload);
  }

  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Timeout de 5 segundos para no bloquear la UX
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`ai-service respondió con status ${response.status}`);
    }

    const json = await response.json() as {
      success: boolean;
      data: ScoreResult;
    };

    if (!json.success) {
      throw new Error('ai-service retornó success: false');
    }

    console.info(
      `[AI Client] Score calculado: ${json.data.score} (${json.data.nivel}) — ${json.data.razones.join(', ')}`
    );

    return json.data;
  } catch (error) {
    // Log del error pero NO interrumpimos el flujo del pedido
    console.error('[AI Client] Falló la llamada al ai-service, usando fallback:', error);
    return fallbackScore(payload);
  }
}
