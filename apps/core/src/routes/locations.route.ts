import { Router } from "express";
import type { Request, Response, RequestHandler } from "express";
import { LocationsService } from "../modules/locations/services/locations.service";
import { requireAuth } from "../middlewares/auth.middleware";
import { z } from "zod";

export const locationsRouter = Router();

locationsRouter.use(requireAuth as RequestHandler);

const RegisterLocationSchema = z.object({
  empresaId:    z.string().uuid().optional(),
  repartidorId: z.string().uuid().optional(),
  lat:          z.number().min(-90).max(90),
  lng:          z.number().min(-180).max(180),
  velocidad:    z.number().optional(),
});

// GET /api/v1/locations
locationsRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const empresaId = req.query["empresaId"] || req.user?.empresaId;
    if (!empresaId || typeof empresaId !== "string") {
      res.status(400).json({ success: false, error: "empresaId requerido" });
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
    const ubicacion = await LocationsService.ultimaUbicacion(req.params["id"] ?? "");
    res.json({ success: true, data: ubicacion });
  } catch (error) {
    res.status(404).json({ success: false, error: error instanceof Error ? error.message : "Sin ubicación" });
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
    const locationData = {
      ...parsed.data,
      empresaId: parsed.data.empresaId || req.user!.empresaId,
      repartidorId: parsed.data.repartidorId || req.user!.id,
    };
    const location = await LocationsService.registrar(locationData);
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error interno" });
  }
});
