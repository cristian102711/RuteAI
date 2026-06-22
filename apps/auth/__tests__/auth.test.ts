import request from "supertest";
import app from "../src/index";

describe("auth-service API (supertest)", () => {
  it("GET /api/v1/health → online con lista de endpoints", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe("@ruteai/auth");
    expect(Array.isArray(res.body.endpoints)).toBe(true);
  });

  it("POST /api/v1/auth/login con body inválido → 400 (sin tocar Supabase)", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/v1/auth/signup con email inválido → 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({ email: "no-es-un-email", password: "12345678" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
