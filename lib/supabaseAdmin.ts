import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Admin de Supabase con service_role key.
 * 
 * ⚠️  ADVERTENCIA DE SEGURIDAD:
 * Este cliente BYPASEA todas las políticas RLS de Supabase.
 * - NUNCA exponer la SUPABASE_SERVICE_ROLE_KEY en el frontend.
 * - SOLO usar en Server Actions o Route Handlers del servidor.
 * - Usar ÚNICAMENTE cuando necesites ejecutar operaciones que
 *   el usuario no podría hacer por limitaciones de RLS (ej: crear empresa nueva).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
