import { supabaseAdmin } from "@/lib/supabase";

// ── Repository Layer ─────────────────────────────────────────
// Encapsula TODAS las llamadas a Supabase Auth.
// El Service Layer no sabe cómo se conecta, solo llama al repo.

export const AuthRepository = {
  async signUp(email: string, password: string) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,  // auto-confirmar para MVP
    });
    if (error) throw new Error(error.message);
    return data.user;
  },

  async getUserById(userId: string) {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error) throw new Error(error.message);
    return data.user;
  },

  async listUsers() {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw new Error(error.message);
    return data.users;
  },

  async deleteUser(userId: string) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return true;
  },
};