import { Router } from "express";
import type { Request, Response, RequestHandler } from "express";
import { OrdersService } from "../modules/orders/services/orders.service";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import { z } from "zod";

export const ordersRouter = Router();

// Todos los endpoints de órdenes requieren estar autenticados
ordersRouter.use(requireAuth as RequestHandler);

const CreateOrderSchema = z.object({
  empresaId:       z.string().uuid(),
  nombreCliente:   z.string().min(1),
  clienteTelefono: z.string().optional(),
  direccion:       z.string().min(1),
  producto:        z.string().min(1),
  lat:             z.number().optional(),
  lng:             z.number().optional(),
});

const UpdateEstadoSchema = z.object({
  estado: z.enum(["pendiente", "en_ruta", "entregado", "fallido"]),
});

// GET /api/v1/orders
ordersRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const empresaId = req.user!.empresaId;
    if (!empresaId) {
      res.status(403).json({ success: false, error: "Usuario sin empresa asignada" });
      return;
    }
    const orders = await OrdersService.listar(empresaId);
    res.json({ success: true, data: orders, total: orders.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error interno" });
  }
});

// GET /api/v1/orders/:id
ordersRouter.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const empresaId = req.user!.empresaId;
    const order = await OrdersService.obtener(req.params["id"] ?? "", empresaId);
    res.json({ success: true, data: order });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "No encontrado";
    const status = errMsg.includes("No autorizado") ? 403 : 404;
    res.status(status).json({ success: false, error: errMsg });
  }
});

// POST /api/v1/orders
ordersRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Datos inválidos", details: parsed.error.flatten() });
      return;
    }
    const order = await OrdersService.crear({
      ...parsed.data,
      empresaId: req.user!.empresaId,
    });
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error interno" });
  }
});

// PATCH /api/v1/orders/:id/estado
ordersRouter.patch("/:id/estado", async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = UpdateEstadoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Estado inválido" });
      return;
    }
    const empresaId = req.user!.empresaId;
    const order = await OrdersService.actualizarEstado(req.params["id"] ?? "", parsed.data.estado, empresaId);
    res.json({ success: true, data: order });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Error";
    const status = errMsg.includes("No autorizado") ? 403 : 400;
    res.status(status).json({ success: false, error: errMsg });
  }
});

// DELETE /api/v1/orders/:id
ordersRouter.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const empresaId = req.user!.empresaId;
    await OrdersService.eliminar(req.params["id"] ?? "", empresaId);
    res.json({ success: true, message: "Pedido eliminado" });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "No encontrado";
    const status = errMsg.includes("No autorizado") ? 403 : 404;
    res.status(status).json({ success: false, error: errMsg });
  }
});
