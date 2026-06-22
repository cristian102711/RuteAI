// ── auth.service.test.ts ─────────────────────────────────────────────────────
// Tests unitarios para AuthService.
// Mockea AuthRepository y supabaseAdmin (usado en registrarLog).

jest.mock("../src/modules/auth/repositories/auth.repository", () => ({
  AuthRepository: {
    signUp:          jest.fn(),
    signIn:          jest.fn(),
    refreshSession:  jest.fn(),
    verifyToken:     jest.fn(),
    getUserById:     jest.fn(),
    listUsers:       jest.fn(),
    deleteUser:      jest.fn(),
  },
}));

jest.mock("../src/lib/supabase", () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
  supabasePublic: {},
}));

import { AuthService }    from "../src/modules/auth/services/auth.service";
import { AuthRepository } from "../src/modules/auth/repositories/auth.repository";
import { supabaseAdmin }  from "../src/lib/supabase";

const mockRepo = AuthRepository as jest.Mocked<typeof AuthRepository>;

// Helper: configura el mock de supabaseAdmin.from('LogAcceso').insert(...)
function setupLogMock(returnError: any = null) {
  const mockInsert = jest.fn().mockResolvedValue({ error: returnError });
  (supabaseAdmin.from as jest.Mock).mockReturnValue({ insert: mockInsert });
  return mockInsert;
}

beforeEach(() => jest.clearAllMocks());

// ─── registrarLog ─────────────────────────────────────────────────────────────
describe("AuthService.registrarLog", () => {
  it("inserta log en LogAcceso cuando Supabase responde OK", async () => {
    const insertMock = setupLogMock(null);

    await AuthService.registrarLog("u@u.com", "exito", "Login OK");

    expect(supabaseAdmin.from).toHaveBeenCalledWith("LogAcceso");
    expect(insertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ email: "u@u.com", estado: "exito" }),
      ]),
    );
  });

  it("no lanza excepción si Supabase devuelve error al insertar", async () => {
    setupLogMock({ message: "Insert failed" });
    await expect(
      AuthService.registrarLog("x@x.com", "error", "fallo"),
    ).resolves.toBeUndefined();
  });

  it("no lanza excepción si supabaseAdmin.from() lanza una excepción", async () => {
    (supabaseAdmin.from as jest.Mock).mockImplementationOnce(() => {
      throw new Error("DB connection refused");
    });
    await expect(
      AuthService.registrarLog("x@x.com", "error", "fallo"),
    ).resolves.toBeUndefined();
  });
});

// ─── registrarUsuario ─────────────────────────────────────────────────────────
describe("AuthService.registrarUsuario", () => {
  const META = { nombre: "Nora", rol: "encargado" as const, empresaId: "emp1" };
  const fakeUser = { id: "u1", email: "n@n.com", created_at: "2024-01-01" };

  it("registra usuario exitosamente y devuelve datos de perfil", async () => {
    setupLogMock();
    mockRepo.signUp.mockResolvedValueOnce(fakeUser as any);

    const result = await AuthService.registrarUsuario("n@n.com", "password123", META);

    expect(mockRepo.signUp).toHaveBeenCalledWith("n@n.com", "password123", META);
    expect(result).toMatchObject({
      id:        "u1",
      email:     "n@n.com",
      nombre:    "Nora",
      rol:       "encargado",
      empresaId: "emp1",
    });
  });

  it("lanza error si la contraseña tiene menos de 8 caracteres", async () => {
    await expect(
      AuthService.registrarUsuario("x@x.com", "short", META),
    ).rejects.toThrow("La contraseña debe tener al menos 8 caracteres.");
    expect(mockRepo.signUp).not.toHaveBeenCalled();
  });

  it("propaga error del repositorio (ej. email duplicado)", async () => {
    setupLogMock();
    mockRepo.signUp.mockRejectedValueOnce(new Error("Email ya registrado"));

    await expect(
      AuthService.registrarUsuario("dup@dup.com", "password123", META),
    ).rejects.toThrow("Email ya registrado");
  });
});

// ─── iniciarSesion ────────────────────────────────────────────────────────────
describe("AuthService.iniciarSesion", () => {
  it("retorna usuario y tokens con credenciales válidas y metadata completa", async () => {
    setupLogMock();
    mockRepo.signIn.mockResolvedValueOnce({
      user: {
        id: "u2",
        email: "l@l.com",
        user_metadata: { nombre: "Luis", rol: "encargado", empresaId: "emp2" },
      },
      session: { access_token: "tok", refresh_token: "ref", expires_in: 3600 },
    } as any);

    const result = await AuthService.iniciarSesion("l@l.com", "pass");

    expect(result.usuario.id).toBe("u2");
    expect(result.usuario.nombre).toBe("Luis");
    expect(result.usuario.rol).toBe("encargado");
    expect(result.usuario.empresaId).toBe("emp2");
    expect(result.tokens.accessToken).toBe("tok");
    expect(result.tokens.expiresIn).toBe(3600);
  });

  it("usa valores por defecto cuando la metadata está vacía (branches de ??)", async () => {
    setupLogMock();
    mockRepo.signIn.mockResolvedValueOnce({
      user: { id: "u3", email: "empty@meta.com", user_metadata: {} },
      session: { access_token: "tok2", refresh_token: "ref2", expires_in: 3600 },
    } as any);

    const result = await AuthService.iniciarSesion("empty@meta.com", "pass");

    expect(result.usuario.rol).toBe("repartidor");       // ?? fallback
    expect(result.usuario.nombre).toBe("empty");          // email.split('@')[0]
    expect(result.usuario.empresaId).toBe("");             // ?? fallback
  });

  it("lanza error 'Credenciales inválidas' cuando user o session son null", async () => {
    setupLogMock();
    mockRepo.signIn.mockResolvedValueOnce({ user: null, session: null } as any);

    await expect(
      AuthService.iniciarSesion("null@null.com", "pass"),
    ).rejects.toThrow("Credenciales inválidas.");
  });

  it("propaga el error del repositorio y registra log de fallo", async () => {
    setupLogMock();
    mockRepo.signIn.mockRejectedValueOnce(new Error("Invalid login credentials"));

    await expect(
      AuthService.iniciarSesion("bad@bad.com", "wrong"),
    ).rejects.toThrow("Invalid login credentials");

    // El bloque catch debe haber llamado a registrarLog con estado 'error'
    expect(supabaseAdmin.from).toHaveBeenCalledWith("LogAcceso");
  });
});

// ─── refrescarSesion ──────────────────────────────────────────────────────────
describe("AuthService.refrescarSesion", () => {
  it("devuelve nuevos tokens con refresh token válido", async () => {
    mockRepo.refreshSession.mockResolvedValueOnce({
      session: { access_token: "new_tok", refresh_token: "new_ref", expires_in: 7200 },
      user: null,
    } as any);

    const result = await AuthService.refrescarSesion("valid_refresh");

    expect(result.accessToken).toBe("new_tok");
    expect(result.refreshToken).toBe("new_ref");
    expect(result.expiresIn).toBe(7200);
  });

  it("lanza error cuando la sesión es null (token expirado o inválido)", async () => {
    mockRepo.refreshSession.mockResolvedValueOnce({ session: null, user: null } as any);

    await expect(AuthService.refrescarSesion("expired_token")).rejects.toThrow(
      "Token de refresco inválido o expirado.",
    );
  });
});

// ─── verificarToken ───────────────────────────────────────────────────────────
describe("AuthService.verificarToken", () => {
  it("devuelve perfil completo del usuario con token válido y metadata completa", async () => {
    mockRepo.verifyToken.mockResolvedValueOnce({
      id: "u4",
      email: "v@v.com",
      user_metadata: { nombre: "Vera", rol: "super_admin", empresaId: "emp3" },
    } as any);

    const result = await AuthService.verificarToken("valid_jwt");

    expect(result).toMatchObject({
      id:        "u4",
      email:     "v@v.com",
      nombre:    "Vera",
      rol:       "super_admin",
      empresaId: "emp3",
    });
  });

  it("usa fallbacks cuando la metadata está vacía (branches de ??)", async () => {
    mockRepo.verifyToken.mockResolvedValueOnce({
      id: "u5",
      email: "minimal@test.com",
      user_metadata: {},
    } as any);

    const result = await AuthService.verificarToken("jwt_minimal");

    expect(result.nombre).toBe("minimal");    // email.split('@')[0]
    expect(result.rol).toBe("repartidor");    // ?? fallback
    expect(result.empresaId).toBe("");         // ?? fallback
  });
});

// ─── obtenerUsuario ──────────────────────────────────────────────────────────
describe("AuthService.obtenerUsuario", () => {
  it("devuelve datos mapeados del usuario por ID", async () => {
    mockRepo.getUserById.mockResolvedValueOnce({
      id: "u6",
      email: "g@g.com",
      user_metadata: { nombre: "Gabriela", rol: "encargado", empresaId: "emp4" },
    } as any);

    const result = await AuthService.obtenerUsuario("u6");

    expect(result.nombre).toBe("Gabriela");
    expect(result.rol).toBe("encargado");
  });

  it("usa fallbacks cuando la metadata está vacía", async () => {
    mockRepo.getUserById.mockResolvedValueOnce({
      id: "u7",
      email: "nometa@test.com",
      user_metadata: {},
    } as any);

    const result = await AuthService.obtenerUsuario("u7");
    expect(result.nombre).toBe("nometa");
    expect(result.rol).toBe("repartidor");
  });
});

// ─── listarUsuarios ──────────────────────────────────────────────────────────
describe("AuthService.listarUsuarios", () => {
  it("devuelve solo usuarios de la empresaId solicitada", async () => {
    mockRepo.listUsers.mockResolvedValueOnce([
      { id: "u8", email: "a@a.com", user_metadata: { nombre: "Ana",  rol: "encargado",   empresaId: "e1" } },
      { id: "u9", email: "b@b.com", user_metadata: { nombre: "Beto", rol: "repartidor",   empresaId: "e2" } },
    ] as any);

    const result = await AuthService.listarUsuarios("e1");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ nombre: "Ana", rol: "encargado", empresaId: "e1" });
  });

  it("usa fallbacks cuando la metadata falta (branches de ??)", async () => {
    mockRepo.listUsers.mockResolvedValueOnce([
      { id: "u10", email: "nometadata@test.com", user_metadata: { empresaId: "e1" } },
    ] as any);

    const result = await AuthService.listarUsuarios("e1");

    expect(result[0].nombre).toBe("nometadata");  // email.split('@')[0]
    expect(result[0].rol).toBe("repartidor");
    expect(result[0].empresaId).toBe("e1");
  });

  it("aislamiento multi-tenant: no incluye usuarios de otras empresas", async () => {
    mockRepo.listUsers.mockResolvedValueOnce([
      { id: "u1", email: "a@empresa-a.com", user_metadata: { nombre: "A", rol: "encargado",   empresaId: "emp-A" } },
      { id: "u2", email: "b@empresa-b.com", user_metadata: { nombre: "B", rol: "repartidor",  empresaId: "emp-B" } },
      { id: "u3", email: "c@empresa-a.com", user_metadata: { nombre: "C", rol: "repartidor",  empresaId: "emp-A" } },
    ] as any);

    const result = await AuthService.listarUsuarios("emp-A");

    expect(result).toHaveLength(2);
    expect(result.map((u) => u.id)).toEqual(["u1", "u3"]);
    expect(result.every((u) => u.empresaId === "emp-A")).toBe(true);
    // Ningún usuario de emp-B aparece
    expect(result.some((u) => u.empresaId === "emp-B")).toBe(false);
  });

  it("devuelve lista vacía si ningún usuario pertenece a la empresa", async () => {
    mockRepo.listUsers.mockResolvedValueOnce([
      { id: "u4", email: "x@otra.com", user_metadata: { empresaId: "otra-empresa" } },
    ] as any);

    const result = await AuthService.listarUsuarios("emp-sin-usuarios");

    expect(result).toHaveLength(0);
  });
});
