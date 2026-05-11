import { Router, Request, Response } from "express";
import { OrdersService } from "../modules/orders/services/orders.service";
import { z } from "zod";

export const ordersRouter = Router();

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

// GET /api/v1/orders?empresaId=xxx
ordersRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { empresaId } = req.query;
    if (!empresaId || typeof empresaId !== "string") {
      res.status(400).json({ success: false, error: "empresaId requerido" });
      return;
    }
    const orders = await OrdersService.listar(empresaId);
    res.json({ success: true, data: orders, total: orders.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error interno" });
  }
});

// GET /api/v1/orders/:id
ordersRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const order = await OrdersService.obtener(req.params.id);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(404).json({ success: false, error: error instanceof Error ? error.message : "No encontrado" });
  }
});

// POST /api/v1/orders
ordersRouter.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Datos inválidos", details: parsed.error.flatten() });
      return;
    }
    const order = await OrdersService.crear(parsed.data);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error interno" });
  }
});

// PATCH /api/v1/orders/:id/estado
ordersRouter.patch("/:id/estado", async (req: Request, res: Response) => {
  try {
    const parsed = UpdateEstadoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Estado inválido" });
      return;
    }
    const order = await OrdersService.actualizarEstado(req.params.id, parsed.data.estado);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : "Error" });
  }
});

// DELETE /api/v1/orders/:id
ordersRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    await OrdersService.eliminar(req.params.id);
    res.json({ success: true, message: "Pedido eliminado" });
  } catch (error) {
    res.status(404).json({ success: false, error: error instanceof Error ? error.message : "No encontrado" });
  }
});
