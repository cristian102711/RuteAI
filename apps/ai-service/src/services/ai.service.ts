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
