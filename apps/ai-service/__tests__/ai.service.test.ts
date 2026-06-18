import { calcularScoreRiesgo, optimizarRuta } from "../src/services/ai.service";

const base = {
  pedidoId: "p1",
  lat: -33.45,
  lng: -70.66,
  hora: 12,
  diasRetraso: 0,
  intentosFallidos: 0,
  zonaRiesgo: false,
};

describe("calcularScoreRiesgo — heurística ponderada", () => {
  it("sin factores → score 0 y nivel bajo", () => {
    const r = calcularScoreRiesgo(base);
    expect(r.score).toBe(0);
    expect(r.nivel).toBe("bajo");
    expect(r.razones).toContain("Sin factores de riesgo detectados");
  });

  it("horario nocturno aumenta el riesgo", () => {
    const r = calcularScoreRiesgo({ ...base, hora: 23 });
    expect(r.score).toBeGreaterThan(0);
    expect(r.razones.some((x) => x.includes("nocturno"))).toBe(true);
  });

  it("múltiples factores acumulan y suben a nivel alto", () => {
    const r = calcularScoreRiesgo({
      ...base,
      hora: 2,
      diasRetraso: 3,
      intentosFallidos: 2,
      zonaRiesgo: true,
    });
    expect(r.nivel).toBe("alto");
    expect(r.score).toBeGreaterThan(0.6);
    expect(r.razones.length).toBeGreaterThan(1);
  });

  it("el score nunca supera 1.0 aunque se acumulen factores", () => {
    const r = calcularScoreRiesgo({
      ...base,
      hora: 2,
      diasRetraso: 99,
      intentosFallidos: 99,
      zonaRiesgo: true,
      lat: 0,
      lng: 0,
    });
    expect(r.score).toBeLessThanOrEqual(1);
    expect(r.score).toBeGreaterThanOrEqual(0);
  });

  it("coordenadas fuera de Chile suman riesgo", () => {
    const r = calcularScoreRiesgo({ ...base, lat: 40.41, lng: -3.7 }); // Madrid
    expect(r.razones.some((x) => x.includes("fuera del área"))).toBe(true);
  });
});

describe("optimizarRuta — nearest-neighbor (TSP greedy)", () => {
  const origen = { id: "origen", lat: 0, lng: 0 };
  const puntos = [
    { id: "a", lat: 0, lng: 2 },
    { id: "b", lat: 0, lng: 1 },
    { id: "c", lat: 0, lng: 3 },
  ];

  it("empieza en el origen e incluye todos los puntos", () => {
    const ruta = optimizarRuta(origen, puntos);
    expect(ruta[0].id).toBe("origen");
    expect(ruta).toHaveLength(4);
    expect(ruta.map((p) => p.id).sort()).toEqual(["a", "b", "c", "origen"]);
  });

  it("ordena por cercanía: origen → b → a → c", () => {
    const ruta = optimizarRuta(origen, puntos);
    expect(ruta.map((p) => p.id)).toEqual(["origen", "b", "a", "c"]);
  });

  it("sin puntos devuelve solo el origen", () => {
    expect(optimizarRuta(origen, [])).toEqual([origen]);
  });
});
