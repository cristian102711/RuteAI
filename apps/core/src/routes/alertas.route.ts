import { Router } from "express";
import type { Request, Response, RequestHandler } from "express";
import { AlertasService } from "../modules/alertas/services/alertas.service";
import { requireAuth } from "../middlewares/auth.middleware";
import { z } from "zod";

export const alertasRouter = Router();

alertasRouter.use(requireAuth as RequestHandler);

const CrearAlertaSchema = z.object({
  tipo: z.enum(["desvio", "retraso", "riesgo_alto"]),
  mensaje: z.string().min(5),
  repartidorId: z.string().optional(),
  pedidoId: z.string().optional(),
});

const MarcarLeidaSchema = z.object({
  alertaId: z.string().uuid(),
});

// GET /api/v1/alertas
alertasRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const soloNoLeidas = req.query["noLeidas"] === "true";
    const alertas = await AlertasService.listar(req.user!.empresaId, soloNoLeidas);
    res.json({ success: true, data: alertas, total: alertas.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error interno" });
  }
});

// POST /api/v1/alertas
alertasRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = CrearAlertaSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Datos inválidos", details: parsed.error.flatten() });
      return;
    }
    const alerta = await AlertasService.crear({
      ...parsed.data,
      empresaId: req.user!.empresaId,
    });
    res.status(201).json({ success: true, data: alerta });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error interno" });
  }
});

// PATCH /api/v1/alertas
alertasRouter.patch("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = MarcarLeidaSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Datos inválidos", details: parsed.error.flatten() });
      return;
    }
    const alerta = await AlertasService.marcarLeida(parsed.data.alertaId, req.user!.empresaId);
    res.json({ success: true, data: alerta });
  } catch (error) {
    res.status(404).json({ success: false, error: error instanceof Error ? error.message : "No encontrado" });
  }
});
