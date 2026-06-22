// ── auth.routes.test.ts ──────────────────────────────────────────────────────
// Tests de integración HTTP (supertest) para auth.route.ts y users.route.ts.
// AuthService está completamente mockeado: sin red, sin DB.

jest.mock("../src/modules/auth/services/auth.service", () => ({
  AuthService: {
    registrarUsuario: jest.fn(),
    iniciarSesion:    jest.fn(),
    refrescarSesion:  jest.fn(),
    verificarToken:   jest.fn(),
    registrarLog:     jest.fn().mockResolvedValue(undefined),
    obtenerUsuario:   jest.fn(),
    listarUsuarios:   jest.fn(),
  },
}));

import request    from "supertest";
import app        from "../src/index";
import { AuthService } from "../src/modules/auth/services/auth.service";

const svc = AuthService as jest.Mocked<typeof AuthService>;

beforeEach(() => jest.clearAllMocks());

// ─── POST /api/v1/auth/signup ─────────────────────────────────────────────────
describe("POST /api/v1/auth/signup", () => {
  const VALID_BODY = {
    email: "test@test.com",
    password: "password123",
    nombre: "Test User",
    rol: "encargado",
    empresaId: "emp1",
  };

  it("201 → registro exitoso", async () => {
    svc.registrarUsuario.mockResolvedValueOnce({
      id: "u1", email: "test@test.com", nombre: "Test User",
      rol: "encargado", empresaId: "emp1", creadoEn: "2024-01-01",
    } as any);

    const res = await request(app).post("/api/v1/auth/signup").send(VALID_BODY);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.usuario.id).toBe("u1");
  });

  it("400 → email inválido (Zod rechaza antes de llamar al servicio)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({ email: "no-es-un-email", password: "password123" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(svc.registrarUsuario).not.toHaveBeenCalled();
  });

  it("500 → servicio lanza error (email duplicado)", async () => {
    svc.registrarUsuario.mockRejectedValueOnce(new Error("Email ya registrado"));

    const res = await request(app).post("/api/v1/auth/signup").send(VALID_BODY);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Email ya registrado");
  });
});

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────
describe("POST /api/v1/auth/login", () => {
  it("200 → login exitoso devuelve usuario y tokens", async () => {
    svc.iniciarSesion.mockResolvedValueOnce({
      usuario: { id: "u2", email: "x@x.com", nombre: "X", rol: "encargado", empresaId: "e1" },
      tokens:  { accessToken: "tok", refreshToken: "ref", expiresIn: 3600 },
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "x@x.com", password: "pass1234" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBe("tok");
  });

  it("400 → body vacío (Zod rechaza antes de llamar al servicio)", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(svc.iniciarSesion).not.toHaveBeenCalled();
  });

  it("401 → credenciales incorrectas (servicio lanza error)", async () => {
    svc.iniciarSesion.mockRejectedValueOnce(new Error("Invalid login credentials"));

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "bad@bad.com", password: "wrongpass" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Invalid login credentials");
  });
});

// ─── POST /api/v1/auth/refresh ───────────────────────────────────────────────
describe("POST /api/v1/auth/refresh", () => {
  it("200 → token renovado con refresh válido", async () => {
    svc.refrescarSesion.mockResolvedValueOnce({
      accessToken: "new_tok", refreshToken: "new_ref", expiresIn: 3600,
    });

    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: "valid_refresh" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBe("new_tok");
  });

  it("400 → refreshToken ausente en el body", async () => {
    const res = await request(app).post("/api/v1/auth/refresh").send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("refreshToken");
  });

  it("401 → token expirado (servicio lanza error)", async () => {
    svc.refrescarSesion.mockRejectedValueOnce(
      new Error("Token de refresco inválido o expirado."),
    );

    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: "expired_token" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/v1/auth/me ─────────────────────────────────────────────────────
describe("GET /api/v1/auth/me", () => {
  it("200 → token Bearer válido devuelve perfil del usuario", async () => {
    svc.verificarToken.mockResolvedValueOnce({
      id: "u3", email: "m@m.com", nombre: "María", rol: "encargado", empresaId: "e1",
    });

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer valid_jwt");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.usuario.email).toBe("m@m.com");
  });

  it("401 → sin header Authorization", async () => {
    const res = await request(app).get("/api/v1/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error).toContain("Token no proporcionado");
    expect(svc.verificarToken).not.toHaveBeenCalled();
  });

  it("401 → header Authorization sin prefijo 'Bearer '", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Basic abc123");

    expect(res.status).toBe(401);
    expect(res.body.error).toContain("Token no proporcionado");
  });

  it("401 → JWT inválido o expirado (servicio lanza error)", async () => {
    svc.verificarToken.mockRejectedValueOnce(new Error("JWT expirado"));

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer expired_jwt");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("JWT expirado");
  });
});

// ─── POST /api/v1/auth/logs ──────────────────────────────────────────────────
describe("POST /api/v1/auth/logs", () => {
  const VALID_LOG = {
    evento:    "auth.login",
    userId:    "u1",
    email:     "a@a.com",
    provider:  "email",
    status:    "success",
    timestamp: new Date().toISOString(),
  };

  it("200 → log de éxito guardado (sin campo error opcional)", async () => {
    svc.registrarLog.mockResolvedValueOnce(undefined);

    const res = await request(app).post("/api/v1/auth/logs").send(VALID_LOG);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(svc.registrarLog).toHaveBeenCalledWith(
      "a@a.com", "exito", expect.stringContaining("auth.login"),
    );
  });

  it("200 → log de fallo con campo error opcional (cubre branch 'failure')", async () => {
    svc.registrarLog.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post("/api/v1/auth/logs")
      .send({ ...VALID_LOG, status: "failure", error: "Bad credentials" });

    expect(res.status).toBe(200);
    expect(svc.registrarLog).toHaveBeenCalledWith(
      "a@a.com", "error", expect.stringContaining("Bad credentials"),
    );
  });

  it("400 → payload inválido (faltan campos requeridos por Zod)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/logs")
      .send({ evento: "auth.login" }); // faltan userId, email, provider, status, timestamp

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(svc.registrarLog).not.toHaveBeenCalled();
  });

  it("500 → registrarLog lanza excepción inesperada", async () => {
    svc.registrarLog.mockRejectedValueOnce(new Error("DB write failed"));

    const res = await request(app).post("/api/v1/auth/logs").send(VALID_LOG);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("DB write failed");
  });
});

// ─── GET /api/v1/users ───────────────────────────────────────────────────────
describe("GET /api/v1/users", () => {
  it("401 → sin header Authorization", async () => {
    const res = await request(app).get("/api/v1/users");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("Token no proporcionado");
    expect(svc.verificarToken).not.toHaveBeenCalled();
    expect(svc.listarUsuarios).not.toHaveBeenCalled();
  });

  it("401 → header Authorization sin prefijo 'Bearer '", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", "Basic abc123");

    expect(res.status).toBe(401);
    expect(res.body.error).toContain("Token no proporcionado");
  });

  it("401 → JWT inválido o expirado (verificarToken lanza error)", async () => {
    svc.verificarToken.mockRejectedValueOnce(new Error("JWT expirado"));

    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", "Bearer expired_jwt");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("JWT expirado");
    expect(svc.listarUsuarios).not.toHaveBeenCalled();
  });

  it("401 → error no-Error de verificarToken → devuelve 'Token inválido'", async () => {
    svc.verificarToken.mockRejectedValueOnce("raw string error");

    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", "Bearer bad_jwt");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Token inválido");
  });

  it("200 → con token válido devuelve solo usuarios de la empresa del token", async () => {
    svc.verificarToken.mockResolvedValueOnce({
      id: "admin-a", email: "admin@a.com", nombre: "Admin A",
      rol: "encargado", empresaId: "emp-A",
    });
    svc.listarUsuarios.mockResolvedValueOnce([
      { id: "u1", email: "x@a.com", nombre: "X", rol: "encargado",  empresaId: "emp-A" },
      { id: "u2", email: "y@a.com", nombre: "Y", rol: "repartidor", empresaId: "emp-A" },
    ]);

    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", "Bearer token_empresa_a");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(2);
    // El servicio recibe el empresaId extraído del token, no del request
    expect(svc.listarUsuarios).toHaveBeenCalledWith("emp-A");
    expect(svc.listarUsuarios).not.toHaveBeenCalledWith("emp-B");
  });

  it("200 → token de empresa A NO devuelve usuarios de empresa B (aislamiento multi-tenant explícito)", async () => {
    svc.verificarToken.mockResolvedValueOnce({
      id: "admin-a", email: "admin@a.com", nombre: "Admin A",
      rol: "encargado", empresaId: "emp-A",
    });
    // El servicio ya filtra: devuelve solo usuarios de emp-A
    svc.listarUsuarios.mockResolvedValueOnce([
      { id: "u1", email: "solo-a@a.com", nombre: "Solo A", rol: "encargado", empresaId: "emp-A" },
    ]);

    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", "Bearer token_empresa_a");

    expect(res.status).toBe(200);
    // listarUsuarios fue invocado con emp-A (dato del token, no de la URL)
    expect(svc.listarUsuarios).toHaveBeenCalledWith("emp-A");
    // Ningún usuario del resultado pertenece a emp-B
    const empresasEnData: string[] = res.body.data.map((u: { empresaId: string }) => u.empresaId);
    expect(empresasEnData.every((e) => e === "emp-A")).toBe(true);
    expect(empresasEnData).not.toContain("emp-B");
  });

  it("500 → listarUsuarios lanza Error → devuelve su message", async () => {
    svc.verificarToken.mockResolvedValueOnce({
      id: "admin-a", email: "admin@a.com", nombre: "Admin A",
      rol: "encargado", empresaId: "emp-A",
    });
    svc.listarUsuarios.mockRejectedValueOnce(new Error("Supabase no responde"));

    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Supabase no responde");
  });

  it("500 → listarUsuarios lanza valor no-Error → devuelve 'Error interno' (cubre branch ternario)", async () => {
    svc.verificarToken.mockResolvedValueOnce({
      id: "admin-a", email: "admin@a.com", nombre: "Admin A",
      rol: "encargado", empresaId: "emp-A",
    });
    svc.listarUsuarios.mockRejectedValueOnce("fallo inesperado como string");

    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", "Bearer valid_token");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Error interno");
  });
});
