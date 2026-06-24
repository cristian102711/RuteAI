if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import dotenv from 'dotenv';
import path from 'path';

// Cascada de carga: local (.env propio del servicio) tiene prioridad.
// El root .env del monorepo actúa como fallback para SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY y SUPABASE_ANON_KEY cuando no existe apps/auth/.env.
dotenv.config();                                                     // 1. apps/auth/.env (prioridad)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });   // 2. root .env (fallback)
