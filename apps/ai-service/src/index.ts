import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { healthRouter } from './routes/health.route';
import { scoreRouter } from './routes/score.route';
import { optimizeRouter } from './routes/optimize.route';

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

import { swaggerRouter } from './swagger';

// ── Rutas ─────────────────────────────────────────────────────
app.use('/api/health',   healthRouter);
app.use('/api/score',    scoreRouter);
app.use('/api/optimize', optimizeRouter);
app.use('/docs',         swaggerRouter);

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
