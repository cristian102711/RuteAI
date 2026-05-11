import { createClient } from "@supabase/supabase-js";

const supabaseUrl      = process.env.SUPABASE_URL!;
const serviceKey       = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey  = process.env.SUPABASE_ANON_KEY!;

// Admin client → Admin API (crear/borrar usuarios, listar, etc.)
export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Public client → signIn / refreshSession (user-facing)
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
