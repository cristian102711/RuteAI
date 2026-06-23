import 'dotenv/config';
import express from "express";
import cors from "cors";
import "dotenv/config";
import { healthRouter } from "./routes/health.route";
import { authRouter } from "./routes/auth.route";
import { usersRouter } from "./routes/users.route";

const app = express();
const PORT = process.env.PORT ?? 3002;

app.use(cors());
app.use(express.json());

import { swaggerRouter } from "./swagger";

// Routes
app.use("/api/v1", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1", usersRouter);
app.use("/docs", swaggerRouter);

// For Vercel serverless
export default app;

// Local dev
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`[@ruteai/auth] running on http://localhost:${PORT}`);
  });
}
