if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import dotenv from 'dotenv';
import path from 'path';

// Cascada de carga: local tiene prioridad, root .env actúa como fallback.
// Garantiza que DATABASE_URL y AUTH_SERVICE_URL estén disponibles antes
// de que Prisma y los routes se inicialicen.
dotenv.config();                                                     // 1. apps/core/.env (prioridad)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });   // 2. root .env (fallback)
