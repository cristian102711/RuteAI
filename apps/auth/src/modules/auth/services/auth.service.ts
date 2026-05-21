import { AuthRepository, type UserMeta } from "../repositories/auth.repository";

// ── Service Layer ─────────────────────────────────────────────
// Contiene la lógica de negocio de autenticación.
// NOTA: Los logs se emiten con console.log/error (visibles en Vercel)
// para evitar dependencia de @ruteai/database en el entorno serverless.

export const AuthService = {
  async registrarUsuario(
    email: string,
    password: string,
    meta: UserMeta,
  ) {
    if (password.length < 8) {
      throw new Error("La contraseña debe tener al menos 8 caracteres.");
    }
    const user = await AuthRepository.signUp(email, password, meta);

    console.log(JSON.stringify({
      event: "auth.signup.success",
      email,
      rol: meta.rol,
      timestamp: new Date().toISOString()
    }));

    return {
      id:        user.id,
      email:     user.email,
      nombre:    meta.nombre,
      rol:       meta.rol,
      empresaId: meta.empresaId,
      creadoEn:  user.created_at,
    };
  },

  async iniciarSesion(email: string, password: string) {
    try {
      const { user, session } = await AuthRepository.signIn(email, password);
      if (!user || !session) throw new Error("Credenciales inválidas.");

      // Datos de perfil guardados en user_metadata en el momento del registro
      const meta = user.user_metadata as Partial<UserMeta>;

      // Log de éxito visible en consola de Vercel (ruteai-auth)
      console.log(JSON.stringify({
        event: "auth.login.success",
        email,
        rol: meta.rol ?? "repartidor",
        timestamp: new Date().toISOString()
      }));

      return {
        usuario: {
          id:        user.id,
          email:     user.email ?? "",
          nombre:    meta.nombre    ?? (user.email?.split("@")[0] ?? "Usuario"),
          rol:       meta.rol       ?? "repartidor",
          empresaId: meta.empresaId ?? "",
        },
        tokens: {
          accessToken:  session.access_token,
          refreshToken: session.refresh_token,
          expiresIn:    session.expires_in,
        },
      };
    } catch (error: any) {
      // Log de fallo visible en consola de Vercel (ruteai-auth)
      console.error(JSON.stringify({
        event: "auth.login.failure",
        email,
        error: error.message || "Error desconocido",
        timestamp: new Date().toISOString()
      }));

      throw error;
    }
  },

  async refrescarSesion(refreshToken: string) {
    const { session } = await AuthRepository.refreshSession(refreshToken);
    if (!session) throw new Error("Token de refresco inválido o expirado.");
    return {
      accessToken:  session.access_token,
      refreshToken: session.refresh_token,
      expiresIn:    session.expires_in,
    };
  },

  async verificarToken(token: string) {
    const user = await AuthRepository.verifyToken(token);
    const meta = user.user_metadata as Partial<UserMeta>;
    return {
      id:        user.id,
      email:     user.email ?? "",
      nombre:    meta.nombre    ?? user.email?.split("@")[0] ?? "Usuario",
      rol:       meta.rol       ?? "repartidor",
      empresaId: meta.empresaId ?? "",
    };
  },

  async obtenerUsuario(userId: string) {
    const user = await AuthRepository.getUserById(userId);
    const meta = user.user_metadata as Partial<UserMeta>;
    return {
      id:        user.id,
      email:     user.email,
      nombre:    meta.nombre    ?? user.email?.split("@")[0] ?? "Usuario",
      rol:       meta.rol       ?? "repartidor",
      empresaId: meta.empresaId ?? "",
    };
  },

  async listarUsuarios() {
    const users = await AuthRepository.listUsers();
    return users.map((u) => {
      const meta = u.user_metadata as Partial<UserMeta>;
      return {
        id:        u.id,
        email:     u.email,
        nombre:    meta.nombre    ?? u.email?.split("@")[0] ?? "Usuario",
        rol:       meta.rol       ?? "repartidor",
        empresaId: meta.empresaId ?? "",
      };
    });
  },
};