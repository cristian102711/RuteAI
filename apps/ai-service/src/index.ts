// Node.js portátil en Windows carece de CAs del sistema; esto permite HTTPS en dev.
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Carga cascada: local tiene prioridad, el root del monorepo actúa como fallback.
// Esto permite que OPENROUTER_API_KEY del .env raíz llegue al servicio
// cuando no existe apps/ai-service/.env propio.
dotenv.config();                                                        // 1. apps/ai-service/.env (prioridad)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });      // 2. root .env (fallback)

import { healthRouter }    from './routes/health.route';
import { scoreRouter }     from './routes/score.route';
import { optimizeRouter }  from './routes/optimize.route';
import { reorganizeRouter } from './routes/reorganize.route';
import { swaggerRouter }   from './swagger';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://ruteai.vercel.app',
    process.env.WEB_URL ?? '*',
  ],
}));
app.use(express.json());

// ── Rutas ─────────────────────────────────────────────────────
app.use('/api/health',     healthRouter);
app.use('/api/score',      scoreRouter);
app.use('/api/optimize',   optimizeRouter);
app.use('/api/reorganize', reorganizeRouter);
app.use('/docs',           swaggerRouter);

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint no encontrado' });
});

// ── Start ─────────────────────────────────────────────────────
// Solo escuchar en local; en Vercel serverless basta con el export default
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🤖 AI Service corriendo en http://localhost:${PORT}`);
  });
}

export default app;
