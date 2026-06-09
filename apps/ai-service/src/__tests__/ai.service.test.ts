// ================================================================
// Tests unitarios para el AI Service de RuteAI
// Cubre: calcularScoreRiesgo() y optimizarRuta()
// Patrón: AAA (Arrange - Act - Assert)
// ================================================================

import { calcularScoreRiesgo, optimizarRuta } from "../services/ai.service";

// ── Tests: calcularScoreRiesgo ─────────────────────────────────
describe("calcularScoreRiesgo", () => {
  it("devuelve score 0 y nivel 'bajo' para un pedido sin factores de riesgo", () => {
    const resultado = calcularScoreRiesgo({
      pedidoId: "test-001",
      lat: -33.45,
      lng: -70.65,
      hora: 10,
      diasRetraso: 0,
      intentosFallidos: 0,
      zonaRiesgo: false,
    });

    expect(resultado.score).toBe(0);
    expect(resultado.nivel).toBe("bajo");
    expect(resultado.razones).toContain("Sin factores de riesgo detectados");
  });

  it("devuelve nivel 'alto' para pedido nocturno con retraso y zona de riesgo", () => {
    const resultado = calcularScoreRiesgo({
      pedidoId: "test-002",
      lat: -33.45,
      lng: -70.65,
      hora: 23,
      diasRetraso: 4,
      intentosFallidos: 2,
      zonaRiesgo: true,
    });

    expect(resultado.score).toBeGreaterThan(0.6);
    expect(resultado.nivel).toBe("alto");
  });

  it("penaliza entrega en horario nocturno (22:00 - 06:00)", () => {
    const nocturno = calcularScoreRiesgo({ pedidoId: "t", lat: -33, lng: -70, hora: 23, diasRetraso: 0, intentosFallidos: 0, zonaRiesgo: false });
    const diurno   = calcularScoreRiesgo({ pedidoId: "t", lat: -33, lng: -70, hora: 10, diasRetraso: 0, intentosFallidos: 0, zonaRiesgo: false });

    expect(nocturno.score).toBeGreaterThan(diurno.score);
    expect(nocturno.razones.some((r: string) => r.includes("nocturno"))).toBe(true);
  });

  it("penaliza entrega en horario tarde (20:00 - 22:00)", () => {
    const resultado = calcularScoreRiesgo({ pedidoId: "t", lat: -33, lng: -70, hora: 21, diasRetraso: 0, intentosFallidos: 0, zonaRiesgo: false });
    expect(resultado.score).toBe(0.10);
    expect(resultado.razones.some((r: string) => r.includes("tarde"))).toBe(true);
  });

  it("penaliza >= 3 días de retraso con 0.30 al score", () => {
    const resultado = calcularScoreRiesgo({ pedidoId: "t", lat: -33, lng: -70, hora: 10, diasRetraso: 3, intentosFallidos: 0, zonaRiesgo: false });
    expect(resultado.score).toBe(0.30);
    expect(resultado.razones.some((r: string) => r.includes("3 días de retraso"))).toBe(true);
  });

  it("penaliza 1 día de retraso con 0.15 al score", () => {
    const resultado = calcularScoreRiesgo({ pedidoId: "t", lat: -33, lng: -70, hora: 10, diasRetraso: 1, intentosFallidos: 0, zonaRiesgo: false });
    expect(resultado.score).toBe(0.15);
  });

  it("penaliza >= 2 intentos fallidos con 0.25 al score", () => {
    const resultado = calcularScoreRiesgo({ pedidoId: "t", lat: -33, lng: -70, hora: 10, diasRetraso: 0, intentosFallidos: 2, zonaRiesgo: false });
    expect(resultado.score).toBe(0.25);
    expect(resultado.razones.some((r: string) => r.includes("2 intentos de entrega fallidos"))).toBe(true);
  });

  it("penaliza zona de riesgo con 0.20 al score", () => {
    const resultado = calcularScoreRiesgo({ pedidoId: "t", lat: -33, lng: -70, hora: 10, diasRetraso: 0, intentosFallidos: 0, zonaRiesgo: true });
    expect(resultado.score).toBe(0.20);
    expect(resultado.razones.some((r: string) => r.includes("zona de riesgo"))).toBe(true);
  });

  it("penaliza coordenadas fuera de Chile", () => {
    const resultado = calcularScoreRiesgo({ pedidoId: "t", lat: 40.7, lng: -74.0, hora: 10, diasRetraso: 0, intentosFallidos: 0, zonaRiesgo: false });
    expect(resultado.razones.some((r: string) => r.includes("fuera del área de operación"))).toBe(true);
  });

  it("no supera 1.0 aunque acumule muchos factores", () => {
    const resultado = calcularScoreRiesgo({ pedidoId: "t", lat: 40.7, lng: -74, hora: 2, diasRetraso: 5, intentosFallidos: 3, zonaRiesgo: true });
    expect(resultado.score).toBeLessThanOrEqual(1.0);
  });

  it("determina nivel 'medio' para score entre 0.3 y 0.6", () => {
    const resultado = calcularScoreRiesgo({ pedidoId: "t", lat: -33, lng: -70, hora: 10, diasRetraso: 2, intentosFallidos: 1, zonaRiesgo: false });
    // 0.15 + 0.10 = 0.25 → bajo; con zona_riesgo = 0.45 → medio
    const med = calcularScoreRiesgo({ pedidoId: "t", lat: -33, lng: -70, hora: 10, diasRetraso: 1, intentosFallidos: 0, zonaRiesgo: true });
    expect(med.nivel).toBe("medio");
  });
});

// ── Tests: optimizarRuta ──────────────────────────────────────
describe("optimizarRuta", () => {
  const origen = { id: "origen", lat: -33.45, lng: -70.65 };

  it("devuelve una ruta que comienza con el origen", () => {
    const puntos = [
      { id: "A", lat: -33.46, lng: -70.66 },
      { id: "B", lat: -33.50, lng: -70.70 },
    ];
    const ruta = optimizarRuta(origen, puntos);
    expect(ruta[0]).toEqual(origen);
  });

  it("devuelve todos los puntos incluidos en la ruta", () => {
    const puntos = [
      { id: "A", lat: -33.46, lng: -70.66 },
      { id: "B", lat: -33.50, lng: -70.70 },
      { id: "C", lat: -33.48, lng: -70.68 },
    ];
    const ruta = optimizarRuta(origen, puntos);
    expect(ruta).toHaveLength(puntos.length + 1); // origen + todos los puntos
    expect(ruta.map((p: {id: string}) => p.id)).toContain("A");
    expect(ruta.map((p: {id: string}) => p.id)).toContain("B");
    expect(ruta.map((p: {id: string}) => p.id)).toContain("C");
  });

  it("con un solo punto, devuelve [origen, punto]", () => {
    const punto = { id: "A", lat: -33.46, lng: -70.66 };
    const ruta = optimizarRuta(origen, [punto]);
    expect(ruta).toHaveLength(2);
    expect(ruta[1]).toEqual(punto);
  });

  it("elige el vecino más cercano primero (greedy nearest-neighbor)", () => {
    // B está más cerca que A respecto al origen
    const puntos = [
      { id: "A", lat: -33.49, lng: -70.69 }, // lejos
      { id: "B", lat: -33.451, lng: -70.651 }, // cerca
    ];
    const ruta = optimizarRuta(origen, puntos);
    // El primer punto después del origen debe ser B (el más cercano)
    expect(ruta[1].id).toBe("B");
  });

  it("no modifica el array original de puntos", () => {
    const puntos = [
      { id: "A", lat: -33.46, lng: -70.66 },
      { id: "B", lat: -33.50, lng: -70.70 },
    ];
    const puntosOriginal = [...puntos];
    optimizarRuta(origen, puntos);
    expect(puntos).toEqual(puntosOriginal);
  });
});
