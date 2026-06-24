import request from "supertest";
import app from "../src/index";

// Forzamos la ausencia de OPENROUTER_API_KEY para que los modos IA caigan a su
// fallback determinista (sin red). Eso hace estas pruebas herméticas y rápidas.
describe("ai-service API (supertest)", () => {
  const keyOriginal = process.env.OPENROUTER_API_KEY;
  beforeAll(() => { delete process.env.OPENROUTER_API_KEY; });
  afterAll(() => { if (keyOriginal !== undefined) process.env.OPENROUTER_API_KEY = keyOriginal; });

  it("GET /api/health → online", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe("@ruteai/ai-service");
  });

  // ── /api/score ────────────────────────────────────────────────
  it("POST /api/score (modo heurístico) → score y nivel", async () => {
    const res = await request(app)
      .post("/api/score")
      .send({ pedidoId: "p1", lat: -33.45, lng: -70.66, hora: 12 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.algoritmo).toBe("heuristico");
    expect(typeof res.body.data.score).toBe("number");
    expect(["bajo", "medio", "alto"]).toContain(res.body.data.nivel);
  });

  it("POST /api/score (modo IA) → algoritmo openrouter-ia y score 0-1", async () => {
    const res = await request(app)
      .post("/api/score")
      .send({ producto: "Laptop frágil", direccion: "Av. Providencia 1234" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.algoritmo).toBe("openrouter-ia");
    expect(res.body.data.score).toBeGreaterThanOrEqual(0);
    expect(res.body.data.score).toBeLessThanOrEqual(1);
    expect(Array.isArray(res.body.data.razones)).toBe(true);
  });

  it("POST /api/score con datos inválidos → 400", async () => {
    const res = await request(app).post("/api/score").send({ lat: 999 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ── /api/reorganize ───────────────────────────────────────────
  it("POST /api/reorganize → devuelve una permutación de los IDs enviados", async () => {
    const pedidos = [
      { id: "id-1", producto: "A", direccion: "x", estado: "pendiente" },
      { id: "id-2", producto: "B", direccion: "y", estado: "en_ruta" },
    ];
    const res = await request(app).post("/api/reorganize").send({ pedidos });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalPedidos).toBe(2);
    expect([...res.body.data.idsOrdenados].sort()).toEqual(["id-1", "id-2"]);
  });

  it("POST /api/reorganize con lista vacía → 400", async () => {
    const res = await request(app).post("/api/reorganize").send({ pedidos: [] });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("ruta desconocida → 404", async () => {
    const res = await request(app).get("/api/ruta-inexistente");
    expect(res.status).toBe(404);
  });
});
