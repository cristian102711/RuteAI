import { createClient } from "@supabase/supabase-js";

// Supabase Admin client (service role — solo en servidor)
const supabaseUrl  = process.env.SUPABASE_URL!;
const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
