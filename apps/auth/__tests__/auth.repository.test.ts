// ── auth.repository.test.ts ──────────────────────────────────────────────────
// Tests unitarios para AuthRepository.
// Mockea src/lib/supabase para evitar llamadas reales a Supabase.

jest.mock("../src/lib/supabase", () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: jest.fn(),
        getUserById: jest.fn(),
        listUsers: jest.fn(),
        deleteUser: jest.fn(),
      },
    },
  },
  supabasePublic: {
    auth: {
      signInWithPassword: jest.fn(),
      refreshSession: jest.fn(),
      getUser: jest.fn(),
    },
  },
}));

import { supabaseAdmin, supabasePublic } from "../src/lib/supabase";
import { AuthRepository } from "../src/modules/auth/repositories/auth.repository";

const adminMock  = supabaseAdmin.auth.admin  as jest.Mocked<typeof supabaseAdmin.auth.admin>;
const publicMock = supabasePublic.auth       as jest.Mocked<typeof supabasePublic.auth>;

const META = { nombre: "Ana", rol: "encargado" as const, empresaId: "emp1" };

beforeEach(() => jest.clearAllMocks());

// ─── signUp ──────────────────────────────────────────────────────────────────
describe("AuthRepository.signUp", () => {
  it("devuelve el usuario creado en Supabase", async () => {
    const fakeUser = { id: "u1", email: "a@b.com", created_at: "2024-01-01" };
    (adminMock.createUser as jest.Mock).mockResolvedValueOnce({
      data: { user: fakeUser },
      error: null,
    });

    const result = await AuthRepository.signUp("a@b.com", "pass1234", META);

    expect(adminMock.createUser).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "pass1234",
      email_confirm: true,
      user_metadata: META,
    });
    expect(result).toBe(fakeUser);
  });

  it("lanza error cuando Supabase devuelve error (email duplicado)", async () => {
    (adminMock.createUser as jest.Mock).mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Email ya registrado" },
    });

    await expect(
      AuthRepository.signUp("dup@b.com", "pass1234", META),
    ).rejects.toThrow("Email ya registrado");
  });
});

// ─── signIn ──────────────────────────────────────────────────────────────────
describe("AuthRepository.signIn", () => {
  it("devuelve { user, session } con credenciales correctas", async () => {
    const fakeData = {
      user:    { id: "u2", email: "x@y.com", user_metadata: { rol: "encargado" } },
      session: { access_token: "tok", refresh_token: "ref", expires_in: 3600 },
    };
    (publicMock.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: fakeData,
      error: null,
    });

    const result = await AuthRepository.signIn("x@y.com", "pass");
    expect(result).toEqual(fakeData);
  });

  it("lanza error con credenciales incorrectas", async () => {
    (publicMock.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: {},
      error: { message: "Invalid login credentials" },
    });

    await expect(AuthRepository.signIn("bad@bad.com", "wrong")).rejects.toThrow(
      "Invalid login credentials",
    );
  });
});

// ─── refreshSession ───────────────────────────────────────────────────────────
describe("AuthRepository.refreshSession", () => {
  it("devuelve nueva sesión con refresh token válido", async () => {
    const fakeData = {
      session: { access_token: "new_tok", refresh_token: "new_ref", expires_in: 3600 },
      user: { id: "u3" },
    };
    (publicMock.refreshSession as jest.Mock).mockResolvedValueOnce({
      data: fakeData,
      error: null,
    });

    const result = await AuthRepository.refreshSession("old_refresh");
    expect(result).toEqual(fakeData);
  });

  it("lanza error con refresh token inválido o expirado", async () => {
    (publicMock.refreshSession as jest.Mock).mockResolvedValueOnce({
      data: {},
      error: { message: "Invalid Refresh Token" },
    });

    await expect(AuthRepository.refreshSession("bad_token")).rejects.toThrow(
      "Invalid Refresh Token",
    );
  });
});

// ─── verifyToken ─────────────────────────────────────────────────────────────
describe("AuthRepository.verifyToken", () => {
  it("devuelve usuario con JWT válido", async () => {
    const fakeUser = { id: "u4", email: "v@v.com", user_metadata: {} };
    (publicMock.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: fakeUser },
      error: null,
    });

    const result = await AuthRepository.verifyToken("valid_jwt");
    expect(result).toBe(fakeUser);
  });

  it("lanza error con JWT inválido o expirado", async () => {
    (publicMock.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: null },
      error: { message: "JWT expired" },
    });

    await expect(AuthRepository.verifyToken("expired_jwt")).rejects.toThrow(
      "JWT expired",
    );
  });
});

// ─── getUserById ─────────────────────────────────────────────────────────────
describe("AuthRepository.getUserById", () => {
  it("devuelve usuario existente por ID", async () => {
    const fakeUser = { id: "u5", email: "g@g.com", user_metadata: { rol: "super_admin" } };
    (adminMock.getUserById as jest.Mock).mockResolvedValueOnce({
      data: { user: fakeUser },
      error: null,
    });

    const result = await AuthRepository.getUserById("u5");
    expect(result).toBe(fakeUser);
  });

  it("lanza error si el usuario no existe", async () => {
    (adminMock.getUserById as jest.Mock).mockResolvedValueOnce({
      data: { user: null },
      error: { message: "User not found" },
    });

    await expect(AuthRepository.getUserById("no-existe")).rejects.toThrow(
      "User not found",
    );
  });
});

// ─── listUsers ───────────────────────────────────────────────────────────────
describe("AuthRepository.listUsers", () => {
  it("devuelve lista completa de usuarios", async () => {
    const fakeUsers = [
      { id: "u6", email: "a@a.com", user_metadata: { rol: "encargado" } },
      { id: "u7", email: "b@b.com", user_metadata: { rol: "repartidor" } },
    ];
    (adminMock.listUsers as jest.Mock).mockResolvedValueOnce({
      data: { users: fakeUsers },
      error: null,
    });

    const result = await AuthRepository.listUsers();
    expect(result).toEqual(fakeUsers);
    expect(result).toHaveLength(2);
  });

  it("lanza error si Supabase falla al listar", async () => {
    (adminMock.listUsers as jest.Mock).mockResolvedValueOnce({
      data: { users: [] },
      error: { message: "Database unavailable" },
    });

    await expect(AuthRepository.listUsers()).rejects.toThrow("Database unavailable");
  });
});

// ─── deleteUser ──────────────────────────────────────────────────────────────
describe("AuthRepository.deleteUser", () => {
  it("elimina usuario y devuelve true", async () => {
    (adminMock.deleteUser as jest.Mock).mockResolvedValueOnce({ error: null });

    const result = await AuthRepository.deleteUser("u8");
    expect(result).toBe(true);
    expect(adminMock.deleteUser).toHaveBeenCalledWith("u8");
  });

  it("lanza error si el usuario no se puede eliminar", async () => {
    (adminMock.deleteUser as jest.Mock).mockResolvedValueOnce({
      error: { message: "Cannot delete user: has active sessions" },
    });

    await expect(AuthRepository.deleteUser("locked")).rejects.toThrow(
      "Cannot delete user: has active sessions",
    );
  });
});
