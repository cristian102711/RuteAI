import { AuthRepository } from "../repositories/auth.repository";

// ── Service Layer ─────────────────────────────────────────────
// Contiene la lógica de negocio de autenticación.
// Valida reglas, orquesta el repositorio.

export const AuthService = {
  async registrarUsuario(email: string, password: string) {
    // Regla de negocio: mínimo 8 chars en password
    if (password.length < 8) {
      throw new Error("La contraseña debe tener al menos 8 caracteres.");
    }

    const user = await AuthRepository.signUp(email, password);

    return {
      id:        user.id,
      email:     user.email,
      creadoEn:  user.created_at,
    };
  },

  async obtenerUsuario(userId: string) {
    const user = await AuthRepository.getUserById(userId);
    return {
      id:     user.id,
      email:  user.email,
      rol:    user.user_metadata?.role ?? "repartidor",
    };
  },

  async listarUsuarios() {
    const users = await AuthRepository.listUsers();
    return users.map((u) => ({
      id:     u.id,
      email:  u.email,
      rol:    u.user_metadata?.role ?? "repartidor",
    }));
  },
};