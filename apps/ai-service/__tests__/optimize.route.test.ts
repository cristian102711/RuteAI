// ── optimize.route.test.ts ───────────────────────────────────────────────────
// Tests de integración HTTP para POST /api/optimize.
// planificarRuta está mockeada: el algoritmo ya se testa en planificacion.test.ts.

jest.mock("../src/services/ai.service", () => ({
  planificarRuta:       jest.fn(),
  calcularScoreRiesgo:  jest.fn(), // requerido por score.route cuando app carga
}));

import request       from "supertest";
import app           from "../src/index";
import { planificarRuta } from "../src/services/ai.service";

const fn = planificarRuta as jest.Mock;

// Respuesta fija que simula lo que devolvería planificarRuta real
const MOCK_PLAN = {
  orden: [
    { id: "p1", lat: -33.46, lng: -70.65, fechaEntregaLimite: null },
  ],
  etas: [
    { id: "p1", etaMin: 8, etaISO: "2026-06-19T12:08:00.000Z", enRiesgo: false },
  ],
  distanciaTotalKm: 1.2,
  duracionTotalMin: 10,
  paradasEnRiesgo:  0,
};

const ORIGEN = { id: "origen", lat: -33.45, lng: -70.66 };
const PUNTO  = { id: "p1",     lat: -33.46, lng: -70.65 };
const PUNTO_DEADLINE = {
  id: "p1",
  lat: -33.46,
  lng: -70.65,
  fechaEntregaLimite: "2026-06-19T14:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  fn.mockReturnValue(MOCK_PLAN);
});

// ─── Caminos exitosos ────────────────────────────────────────────────────────
describe("POST /api/optimize — éxito", () => {
  it("200 con puntos SIN deadline → algoritmo 'nearest-neighbor'", async () => {
    const res = await request(app)
      .post("/api/optimize")
      .send({ origen: ORIGEN, puntos: [PUNTO] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.algoritmo).toBe("nearest-neighbor");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("200 con puntos CON fechaEntregaLimite → algoritmo 'sla-heuristico'", async () => {
    const res = await request(app)
      .post("/api/optimize")
      .send({ origen: ORIGEN, puntos: [PUNTO_DEADLINE] });

    expect(res.status).toBe(200);
    expect(res.body.data.algoritmo).toBe("sla-heuristico");
  });

  it("200 mezcla de puntos (solo uno con deadline) → 'sla-heuristico'", async () => {
    const res = await request(app)
      .post("/api/optimize")
      .send({
        origen: ORIGEN,
        puntos: [PUNTO, PUNTO_DEADLINE, { id: "p2", lat: -33.47, lng: -70.64 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.algoritmo).toBe("sla-heuristico");
  });

  it("response shape completo: rutaOptimizada, etas, resumen, totalPuntos, timestamp", async () => {
    const res = await request(app)
      .post("/api/optimize")
      .send({ origen: ORIGEN, puntos: [PUNTO, { id: "p2", lat: -33.47, lng: -70.64 }] });

    expect(res.status).toBe(200);
    const { data } = res.body;

    // Forma de la respuesta
    expect(Array.isArray(data.rutaOptimizada)).toBe(true);
    expect(Array.isArray(data.etas)).toBe(true);
    expect(data.resumen).toMatchObject({
      distanciaTotalKm: expect.any(Number),
      duracionTotalMin: expect.any(Number),
      paradasEnRiesgo:  expect.any(Number),
    });
    expect(data.totalPuntos).toBe(2);           // puntos.length
    expect(typeof data.timestamp).toBe("string");
    expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format

    // Valores del mock
    expect(data.rutaOptimizada).toEqual(MOCK_PLAN.orden);
    expect(data.etas).toEqual(MOCK_PLAN.etas);
    expect(data.resumen.distanciaTotalKm).toBe(1.2);
    expect(data.resumen.duracionTotalMin).toBe(10);
    expect(data.resumen.paradasEnRiesgo).toBe(0);
  });

  it("pasa velocidadKmh opcional a planificarRuta", async () => {
    const res = await request(app)
      .post("/api/optimize")
      .send({ origen: ORIGEN, puntos: [PUNTO], velocidadKmh: 45 });

    expect(res.status).toBe(200);
    expect(fn).toHaveBeenCalledWith(
      expect.objectContaining({ id: "origen" }),
      expect.arrayContaining([expect.objectContaining({ id: "p1" })]),
      { velocidadKmh: 45 },
    );
  });

  it("velocidadKmh ausente → planificarRuta recibe {velocidadKmh: undefined}", async () => {
    await request(app)
      .post("/api/optimize")
      .send({ origen: ORIGEN, puntos: [PUNTO] });

    expect(fn).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { velocidadKmh: undefined },
    );
  });

  it("totalPuntos refleja el número exacto de puntos enviados", async () => {
    const tresPuntos = [
      { id: "a", lat: -33.46, lng: -70.65 },
      { id: "b", lat: -33.47, lng: -70.64 },
      { id: "c", lat: -33.48, lng: -70.63 },
    ];

    const res = await request(app)
      .post("/api/optimize")
      .send({ origen: ORIGEN, puntos: tresPuntos });

    expect(res.status).toBe(200);
    expect(res.body.data.totalPuntos).toBe(3);
  });
});

// ─── Validación — 400 ────────────────────────────────────────────────────────
describe("POST /api/optimize — validación 400", () => {
  it("400 → falta origen en el body", async () => {
    const res = await request(app)
      .post("/api/optimize")
      .send({ puntos: [PUNTO] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/inválidos/i);
    expect(res.body.details).toBeDefined();
    expect(fn).not.toHaveBeenCalled();
  });

  it("400 → puntos es array vacío [] (min(1) violado)", async () => {
    const res = await request(app)
      .post("/api/optimize")
      .send({ origen: ORIGEN, puntos: [] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(fn).not.toHaveBeenCalled();
  });

  it("400 → puntos supera el límite de 20 (max(20) violado)", async () => {
    const muchosPuntos = Array.from({ length: 21 }, (_, i) => ({
      id: `p${i}`, lat: -33.46 - i * 0.001, lng: -70.65,
    }));

    const res = await request(app)
      .post("/api/optimize")
      .send({ origen: ORIGEN, puntos: muchosPuntos });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(fn).not.toHaveBeenCalled();
  });

  it("400 → velocidadKmh negativa (positive() violado)", async () => {
    const res = await request(app)
      .post("/api/optimize")
      .send({ origen: ORIGEN, puntos: [PUNTO], velocidadKmh: -10 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(fn).not.toHaveBeenCalled();
  });

  it("400 → velocidadKmh = 0 (positive() no acepta cero)", async () => {
    const res = await request(app)
      .post("/api/optimize")
      .send({ origen: ORIGEN, puntos: [PUNTO], velocidadKmh: 0 });

    expect(res.status).toBe(400);
    expect(fn).not.toHaveBeenCalled();
  });

  it("400 → velocidadKmh es string en lugar de number", async () => {
    const res = await request(app)
      .post("/api/optimize")
      .send({ origen: ORIGEN, puntos: [PUNTO], velocidadKmh: "rapido" });

    expect(res.status).toBe(400);
    expect(fn).not.toHaveBeenCalled();
  });

  it("400 → un punto del array no tiene lat (Zod rechaza)", async () => {
    const res = await request(app)
      .post("/api/optimize")
      .send({ origen: ORIGEN, puntos: [{ id: "p1", lng: -70.65 }] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(fn).not.toHaveBeenCalled();
  });

  it("400 → origen no tiene id (Zod rechaza)", async () => {
    const res = await request(app)
      .post("/api/optimize")
      .send({ origen: { lat: -33.45, lng: -70.66 }, puntos: [PUNTO] });

    expect(res.status).toBe(400);
    expect(fn).not.toHaveBeenCalled();
  });

  it("400 → body completamente vacío", async () => {
    const res = await request(app).post("/api/optimize").send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── Manejo de error del servicio ────────────────────────────────────────────
// HALLAZGO: optimize.route.ts no tiene try/catch alrededor de planificarRuta().
// Si la función lanza, Express usa su handler de error por defecto → 500.
// La respuesta NO es JSON estructurado con { success: false, error: "..." }.
describe("POST /api/optimize — error del servicio", () => {
  // Express loguea el error de forma asíncrona; silenciamos durante todo el describe
  // para evitar el warning "Cannot log after tests are done" de Jest.
  let consoleSpy: jest.SpyInstance;
  beforeAll(() => { consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined); });
  afterAll(async () => {
    // Flush de microtasks pendientes antes de restaurar para que Express termine de loguear
    await new Promise<void>((resolve) => setImmediate(resolve));
    consoleSpy.mockRestore();
  });

  it("500 → planificarRuta lanza excepción (Express maneja el error sin JSON)", async () => {
    fn.mockImplementationOnce(() => {
      throw new Error("Memoria insuficiente");
    });

    const res = await request(app)
      .post("/api/optimize")
      .send({ origen: ORIGEN, puntos: [PUNTO] });

    // El status SÍ es 500 (Express default error handler)
    expect(res.status).toBe(500);
    // La capa de route NO produce { success: false } porque no hay try/catch propio
    // (Comportamiento documentado, no un bug corregido aquí)
  });
});
