import 'dotenv/config';
import express from "express";
import cors from "cors";
import "dotenv/config";
import { healthRouter }  from "./routes/health.route";
import { ordersRouter }  from "./routes/orders.route";
import { routesRouter }  from "./routes/routes.route";
import { locationsRouter } from "./routes/locations.route";
import { empresasRouter } from "./routes/empresas.route";
import { alertasRouter } from "./routes/alertas.route";

const app  = express();
const PORT = process.env.PORT ?? 3003;

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'https://ruteai.vercel.app',
    process.env.WEB_URL,
  ].filter(Boolean) as string[],
  credentials: true,
}));
app.use(express.json());

app.use("/api/v1", healthRouter);
app.use("/api/v1/orders",    ordersRouter);
app.use("/api/v1/routes",    routesRouter);
app.use("/api/v1/locations", locationsRouter);
app.use("/api/v1/empresas",  empresasRouter);
app.use("/api/v1/alertas",   alertasRouter);

export default app;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () =>
    console.log(`[@ruteai/core] running on http://localhost:${PORT}`)
  );
}
