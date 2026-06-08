import { Router } from "express";
import type { Request, Response, RequestHandler } from "express";
import { RoutesService } from "../modules/routes/services/routes.service";
import { requireAuth } from "../middlewares/auth.middleware";
import { z } from "zod";

export const routesRouter = Router();

// Todas las rutas requieren estar autenticado
routesRouter.use(requireAuth as RequestHandler);

const CreateRouteSchema = z.object({
  empresaId:    z.string().uuid().optional(),
  repartidorId: z.string().uuid(),
  fecha:        z.coerce.date(),
});

const UpdateEstadoSchema = z.object({
  estado: z.enum(["planificada", "en_curso", "completada", "cancelada"]),
});

// GET /api/v1/routes
routesRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const empresaId = req.user!.empresaId;
    if (!empresaId) {
      res.status(403).json({ success: false, error: "Usuario sin empresa asignada" });
      return;
    }
    const rutas = await RoutesService.listar(empresaId);
    res.json({ success: true, data: rutas, total: rutas.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error interno" });
  }
});

// GET /api/v1/routes/:id
routesRouter.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const empresaId = req.user!.empresaId;
    const ruta = await RoutesService.obtener(req.params["id"] ?? "", empresaId);
    res.json({ success: true, data: ruta });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "No encontrada";
    const status = errMsg.includes("No autorizado") ? 403 : 404;
    res.status(status).json({ success: false, error: errMsg });
  }
});

// POST /api/v1/routes
routesRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = CreateRouteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Datos inválidos", details: parsed.error.flatten() });
      return;
    }
    const ruta = await RoutesService.crear({
      ...parsed.data,
      empresaId: req.user!.empresaId,
    });
    res.status(201).json({ success: true, data: ruta });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error interno" });
  }
});

// PATCH /api/v1/routes/:id/estado
routesRouter.patch("/:id/estado", async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = UpdateEstadoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Estado inválido" });
      return;
    }
    const empresaId = req.user!.empresaId;
    const ruta = await RoutesService.actualizarEstado(req.params["id"] ?? "", parsed.data.estado, empresaId);
    res.json({ success: true, data: ruta });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Error";
    const status = errMsg.includes("No autorizado") ? 403 : 400;
    res.status(status).json({ success: false, error: errMsg });
  }
});
