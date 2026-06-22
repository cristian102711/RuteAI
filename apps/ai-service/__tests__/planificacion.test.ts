import { haversineKm, calcularETAs, planificarRuta } from "../src/services/ai.service";

const origen = { id: "o", lat: -33.45, lng: -70.66 };

describe("haversineKm", () => {
  it("mismo punto = 0", () => {
    expect(haversineKm(origen, origen)).toBe(0);
  });
  it("distancia positiva, simétrica y en rango esperado (~8 km)", () => {
    const a = { id: "a", lat: -33.45, lng: -70.66 };
    const b = { id: "b", lat: -33.40, lng: -70.60 };
    const d1 = haversineKm(a, b);
    const d2 = haversineKm(b, a);
    expect(d1).toBeGreaterThan(0);
    expect(d1).toBeCloseTo(d2, 6);
    expect(d1).toBeGreaterThan(5);
    expect(d1).toBeLessThan(12);
  });
});

describe("calcularETAs", () => {
  const ahora = new Date("2026-06-17T12:00:00Z");

  it("la ETA acumula y crece por cada parada", () => {
    const stops = [
      { id: "a", lat: -33.46, lng: -70.66 },
      { id: "b", lat: -33.48, lng: -70.66 },
    ];
    const r = calcularETAs(origen, stops, { ahora, velocidadKmh: 30, minutosPorParada: 5 });
    expect(r.etas).toHaveLength(2);
    expect(r.etas[1].etaMin).toBeGreaterThan(r.etas[0].etaMin);
    expect(r.distanciaTotalKm).toBeGreaterThan(0);
    expect(r.duracionTotalMin).toBeGreaterThan(0);
    expect(r.paradasEnRiesgo).toBe(0); // sin horas límite → sin riesgo
  });

  it("marca 'en riesgo' si la ETA supera la hora límite", () => {
    const stops = [
      {
        id: "a",
        lat: -34.0,
        lng: -71.2, // lejos
        fechaEntregaLimite: new Date(ahora.getTime() + 5 * 60_000).toISOString(), // en 5 min
      },
    ];
    const r = calcularETAs(origen, stops, { ahora, velocidadKmh: 20 });
    expect(r.paradasEnRiesgo).toBe(1);
    expect(r.etas[0].enRiesgo).toBe(true);
  });
});

describe("planificarRuta (SLA-aware)", () => {
  it("incluye el origen primero y todas las paradas exactamente una vez", () => {
    const puntos = [
      { id: "a", lat: -33.46, lng: -70.66 },
      { id: "b", lat: -33.50, lng: -70.66 },
      { id: "c", lat: -33.48, lng: -70.66 },
    ];
    const plan = planificarRuta(origen, puntos);
    expect(plan.orden[0].id).toBe("o");
    expect(plan.orden).toHaveLength(4);
    expect(plan.orden.slice(1).map((p) => p.id).sort()).toEqual(["a", "b", "c"]);
  });

  it("prioriza una parada urgente aunque esté más lejos que otra sin SLA", () => {
    const ahora = new Date("2026-06-17T12:00:00Z");
    const cerca = { id: "cerca", lat: -33.46, lng: -70.66 }; // ~1 km, sin límite
    const urgente = {
      id: "urgente",
      lat: -33.55,
      lng: -70.66, // ~11 km
      fechaEntregaLimite: new Date(ahora.getTime() + 8 * 60_000).toISOString(), // inminente
    };
    const plan = planificarRuta(origen, [cerca, urgente], { ahora, velocidadKmh: 30, margenRiesgoMin: 30 });
    expect(plan.orden[1].id).toBe("urgente"); // visita primero la que está por incumplir
  });
});
