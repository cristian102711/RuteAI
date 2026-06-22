// ============================================================
// AI Service — Lógica de Inteligencia Artificial
// Patrón: Service Layer (la lógica de negocio está aquí,
// separada de los controladores/rutas)
// ============================================================

// ── Tipos internos ───────────────────────────────────────────
interface ScoreInput {
  pedidoId:         string;
  lat:              number;
  lng:              number;
  hora:             number;
  diasRetraso:      number;
  intentosFallidos: number;
  zonaRiesgo:       boolean;
}

interface ScoreResult {
  score:   number;          // 0.0 - 1.0
  nivel:   'bajo' | 'medio' | 'alto';
  razones: string[];
}

interface Punto {
  id:  string;
  lat: number;
  lng: number;
}

// ── Algoritmo de Score de Riesgo ─────────────────────────────
// Heurística ponderada basada en múltiples factores de riesgo
// (puede reemplazarse con un modelo ML real en el futuro)
export function calcularScoreRiesgo(input: ScoreInput): ScoreResult {
  let score = 0;
  const razones: string[] = [];

  // Factor 1: Hora de entrega (noche = más riesgo)
  if (input.hora >= 22 || input.hora <= 6) {
    score += 0.25;
    razones.push('Entrega en horario nocturno (22:00 - 06:00)');
  } else if (input.hora >= 20) {
    score += 0.10;
    razones.push('Entrega en horario tarde (20:00 - 22:00)');
  }

  // Factor 2: Días de retraso acumulados
  if (input.diasRetraso >= 3) {
    score += 0.30;
    razones.push(`Pedido con ${input.diasRetraso} días de retraso acumulado`);
  } else if (input.diasRetraso >= 1) {
    score += 0.15;
    razones.push(`Pedido con ${input.diasRetraso} día(s) de retraso`);
  }

  // Factor 3: Intentos de entrega fallidos
  if (input.intentosFallidos >= 2) {
    score += 0.25;
    razones.push(`${input.intentosFallidos} intentos de entrega fallidos`);
  } else if (input.intentosFallidos === 1) {
    score += 0.10;
    razones.push('1 intento de entrega fallido previo');
  }

  // Factor 4: Zona de alto riesgo geográfico
  if (input.zonaRiesgo) {
    score += 0.20;
    razones.push('Dirección en zona de riesgo identificada');
  }

  // Factor 5: Coordenadas fuera de rango esperado (Chile)
  const fueraDeChile = input.lat < -55 || input.lat > -17 ||
                        input.lng < -75 || input.lng > -66;
  if (fueraDeChile) {
    score += 0.15;
    razones.push('Coordenadas fuera del área de operación habitual');
  }

  // Normalizar: asegurarse que quede entre 0 y 1
  score = Math.min(1, Math.max(0, score));

  // Determinar nivel
  let nivel: ScoreResult['nivel'] = 'bajo';
  if (score > 0.6) {
    nivel = 'alto';
  } else if (score > 0.3) {
    nivel = 'medio';
  }

  if (razones.length === 0) {
    razones.push('Sin factores de riesgo detectados');
  }

  return { score: parseFloat(score.toFixed(2)), nivel, razones };
}

// ── Algoritmo de Optimización de Ruta ───────────────────────
// Nearest Neighbor Heuristic (greedy TSP approximation)
// Complejidad: O(n²) — adecuado para n ≤ 20 puntos
export function optimizarRuta(origen: Punto, puntos: Punto[]): Punto[] {
  const noVisitados = [...puntos];
  const ruta: Punto[] = [origen];
  let actual = origen;

  while (noVisitados.length > 0) {
    // Encontrar el punto más cercano al actual
    let minDist = Infinity;
    let indiceMin = 0;

    noVisitados.forEach((punto, i) => {
      const dist = distanciaEuclidiana(actual, punto);
      if (dist < minDist) {
        minDist = dist;
        indiceMin = i;
      }
    });

    actual = noVisitados[indiceMin];
    ruta.push(actual);
    noVisitados.splice(indiceMin, 1);
  }

  return ruta;
}

// ── Utilitarios ───────────────────────────────────────────────
function distanciaEuclidiana(a: Punto, b: Punto): number {
  // Aproximación simple — para producción usar Haversine
  const dLat = b.lat - a.lat;
  const dLng = b.lng - a.lng;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

// ============================================================
// Planificación con SLA — DETERMINISTA (sin IA externa/LLM).
// Calcula ETA por parada (distancia real Haversine + velocidad + tiempo de
// servicio) y ordena las paradas priorizando NO incumplir las horas límite.
// ============================================================

/** Distancia en km entre dos coordenadas (fórmula de Haversine). */
export function haversineKm(a: Punto, b: Punto): number {
  const R = 6371; // radio terrestre km
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export interface ParadaPlan extends Punto {
  fechaEntregaLimite?: string | null; // ISO; opcional
}

export interface OpcionesPlan {
  velocidadKmh?: number;       // velocidad promedio urbana (def. 28)
  minutosPorParada?: number;   // tiempo de servicio por entrega (def. 6)
  margenRiesgoMin?: number;    // holgura mínima antes de marcar "en riesgo" (def. 10)
  ahora?: Date;
}

export interface ParadaETA {
  id: string;
  etaMin: number;        // minutos desde el inicio hasta completar esta parada
  distanciaKm: number;   // tramo desde la parada anterior
  enRiesgo: boolean;     // llegaría después de su hora límite
}

export interface PlanRuta {
  orden: Punto[];              // origen + paradas ordenadas
  etas: ParadaETA[];
  distanciaTotalKm: number;
  duracionTotalMin: number;
  paradasEnRiesgo: number;
}

/** Calcula ETA acumulada y riesgo SLA para un orden YA definido de paradas. */
export function calcularETAs(
  origen: Punto,
  stops: ParadaPlan[],
  opts: OpcionesPlan = {}
): Omit<PlanRuta, "orden"> {
  const v = opts.velocidadKmh ?? 28;
  const serv = opts.minutosPorParada ?? 6;
  const ahora = opts.ahora ?? new Date();

  let etaMin = 0;
  let distTot = 0;
  let enRiesgo = 0;
  let prev: Punto = origen;
  const etas: ParadaETA[] = [];

  for (const s of stops) {
    const dkm = haversineKm(prev, s);
    distTot += dkm;
    etaMin += (dkm / v) * 60 + serv;
    let riesgo = false;
    if (s.fechaEntregaLimite) {
      const limiteMin = (new Date(s.fechaEntregaLimite).getTime() - ahora.getTime()) / 60_000;
      riesgo = etaMin > limiteMin;
    }
    if (riesgo) enRiesgo++;
    etas.push({ id: s.id, etaMin: Math.round(etaMin), distanciaKm: +dkm.toFixed(2), enRiesgo: riesgo });
    prev = s;
  }

  return {
    etas,
    distanciaTotalKm: +distTot.toFixed(2),
    duracionTotalMin: Math.round(etaMin),
    paradasEnRiesgo: enRiesgo,
  };
}

/**
 * Ordena las paradas con un greedy consciente del SLA: en cada paso, si alguna
 * parada está por incumplir su hora límite (holgura < margen), prioriza la más
 * cercana entre esas; si no, sigue por cercanía. Devuelve el orden + ETAs.
 */
export function planificarRuta(
  origen: Punto,
  puntos: ParadaPlan[],
  opts: OpcionesPlan = {}
): PlanRuta {
  const v = opts.velocidadKmh ?? 28;
  const serv = opts.minutosPorParada ?? 6;
  const margen = opts.margenRiesgoMin ?? 10;
  const ahora = opts.ahora ?? new Date();

  const restantes = [...puntos];
  const orden: ParadaPlan[] = [];
  let actual: Punto = origen;
  let etaMin = 0;

  while (restantes.length > 0) {
    const cand = restantes.map((r, i) => {
      const dkm = haversineKm(actual, r);
      const arribo = etaMin + (dkm / v) * 60 + serv;
      const limiteMin = r.fechaEntregaLimite
        ? (new Date(r.fechaEntregaLimite).getTime() - ahora.getTime()) / 60_000
        : Infinity;
      return { i, dkm, arribo, holgura: limiteMin - arribo };
    });

    const urgentes = cand.filter((c) => c.holgura < margen);
    const pool = urgentes.length > 0 ? urgentes : cand;
    pool.sort((a, b) => a.dkm - b.dkm);
    const elegido = pool[0];

    orden.push(restantes[elegido.i]);
    etaMin = elegido.arribo;
    actual = restantes[elegido.i];
    restantes.splice(elegido.i, 1);
  }

  return { orden: [origen, ...orden], ...calcularETAs(origen, orden, opts) };
}
