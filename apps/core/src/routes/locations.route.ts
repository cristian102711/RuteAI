import { Router } from "express";
import type { Request, Response, RequestHandler } from "express";
import { LocationsService } from "../modules/locations/services/locations.service";
import { requireAuth } from "../middlewares/auth.middleware";
import { z } from "zod";

export const locationsRouter = Router();

// Todas las rutas de ubicaciones requieren estar autenticado
locationsRouter.use(requireAuth as RequestHandler);

const RegisterLocationSchema = z.object({
  empresaId:    z.string().uuid(),
  repartidorId: z.string().uuid(),
  lat:          z.number().min(-90).max(90),
  lng:          z.number().min(-180).max(180),
  velocidad:    z.number().optional(),
});

// GET /api/v1/locations
locationsRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const empresaId = req.user!.empresaId;
    if (!empresaId) {
      res.status(403).json({ success: false, error: "Usuario sin empresa asignada" });
      return;
    }
    const locations = await LocationsService.listar(empresaId);
    res.json({ success: true, data: locations, total: locations.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error interno" });
  }
});

// GET /api/v1/locations/repartidor/:id
locationsRouter.get("/repartidor/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const empresaId = req.user!.empresaId;
    const ubicacion = await LocationsService.ultimaUbicacion(req.params["id"] ?? "", empresaId);
    res.json({ success: true, data: ubicacion });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Sin ubicación";
    const status = errMsg.includes("No autorizado") ? 403 : 404;
    res.status(status).json({ success: false, error: errMsg });
  }
});

// POST /api/v1/locations
locationsRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = RegisterLocationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Datos inválidos", details: parsed.error.flatten() });
      return;
    }
    const empresaId = req.user!.empresaId;
    const location = await LocationsService.registrar(parsed.data, empresaId);
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Error interno";
    const status = errMsg.includes("No autorizado") ? 403 : 500;
    res.status(status).json({ success: false, error: errMsg });
  }
});
