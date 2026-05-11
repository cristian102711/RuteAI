import { AuthRepository } from "../repositories/auth.repository";

// ── Service Layer ─────────────────────────────────────────────
// Contiene la lógica de negocio de autenticación.

export const AuthService = {
  async registrarUsuario(email: string, password: string) {
    if (password.length < 8) {
      throw new Error("La contraseña debe tener al menos 8 caracteres.");
    }
    const user = await AuthRepository.signUp(email, password);
    return { id: user.id, email: user.email, creadoEn: user.created_at };
  },

  async iniciarSesion(email: string, password: string) {
    const { user, session } = await AuthRepository.signIn(email, password);
    if (!user || !session) throw new Error("Credenciales inválidas.");
    return {
      usuario: { id: user.id, email: user.email },
      tokens: {
        accessToken:  session.access_token,
        refreshToken: session.refresh_token,
        expiresIn:    session.expires_in,
      },
    };
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

  async obtenerUsuario(userId: string) {
    const user = await AuthRepository.getUserById(userId);
    return { id: user.id, email: user.email, rol: user.user_metadata?.role ?? "repartidor" };
  },

  async listarUsuarios() {
    const users = await AuthRepository.listUsers();
    return users.map((u) => ({
      id:    u.id,
      email: u.email,
      rol:   u.user_metadata?.role ?? "repartidor",
    }));
  },
};