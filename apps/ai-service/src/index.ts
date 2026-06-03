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

// ── Rutas ─────────────────────────────────────────────────────
app.use('/api/health',   healthRouter);

// Middleware de Autenticación
const requireAiAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const key = req.headers['x-api-key'];
  if (!process.env.AI_SERVICE_SECRET || key !== process.env.AI_SERVICE_SECRET) {
    res.status(401).json({ success: false, error: 'No autorizado' });
    return;
  }
  next();
};

app.use('/api/score',    requireAiAuth, scoreRouter);
app.use('/api/optimize', requireAiAuth, optimizeRouter);

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
