import request from "supertest";
import app from "../src/index";

describe("ai-service API (supertest)", () => {
  it("GET /api/health → online", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe("@ruteai/ai-service");
  });

  it("POST /api/score con datos válidos → score y nivel", async () => {
    const res = await request(app)
      .post("/api/score")
      .send({ pedidoId: "p1", lat: -33.45, lng: -70.66, hora: 12 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.score).toBe("number");
    expect(["bajo", "medio", "alto"]).toContain(res.body.data.nivel);
  });

  it("POST /api/score con datos inválidos → 400", async () => {
    const res = await request(app).post("/api/score").send({ lat: 999 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("ruta desconocida → 404", async () => {
    const res = await request(app).get("/api/ruta-inexistente");
    expect(res.status).toBe(404);
  });
});
