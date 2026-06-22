import { Router } from "express";
import type { Request, Response, RequestHandler } from "express";
import { OrdersService } from "../modules/orders/services/orders.service";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import {
  MOTIVOS_FALLO_VALORES,
  MOTIVOS_CANCELACION_VALORES,
} from "../modules/orders/logistica";
import { z } from "zod";

export const ordersRouter = Router();

// Todos los endpoints de órdenes requieren estar autenticados
ordersRouter.use(requireAuth as RequestHandler);

const CreateOrderSchema = z.object({
  empresaId:       z.string().uuid().optional(),
  nombreCliente:   z.string().min(1),
  clienteTelefono: z.string().optional(),
  direccion:        z.string().min(1),
  producto:         z.string().min(1),
  horarioPreferido: z.string().optional(),
  fechaEntregaLimite: z.string().datetime().optional(),
  lat:              z.number().optional(),
  lng:              z.number().optional(),
  scoreRiesgo:      z.number().optional(),
  repartidorId:     z.string().uuid().optional(),
});

const MOTIVOS_VALIDOS = [
  ...new Set([...MOTIVOS_FALLO_VALORES, ...MOTIVOS_CANCELACION_VALORES]),
] as [string, ...string[]];

const UpdateEstadoSchema = z.object({
  estado: z.enum(["pendiente", "en_ruta", "entregado", "fallido", "cancelado"]),
  motivo: z.enum(MOTIVOS_VALIDOS).optional(),
  sinFoto: z.boolean().optional(),
});

// GET /api/v1/orders
ordersRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const empresaId = req.user!.empresaId;
    if (!empresaId) {
      res.status(403).json({ success: false, error: "Usuario sin empresa asignada" });
      return;
    }
    const estado = typeof req.query["estado"] === "string" ? req.query["estado"] : undefined;
    const repartidorId = typeof req.query["repartidorId"] === "string" ? req.query["repartidorId"] : undefined;
    const orders = await OrdersService.listar(empresaId, { estado, repartidorId });
    res.json({ success: true, data: orders, total: orders.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error interno" });
  }
});

// GET /api/v1/orders/:id
ordersRouter.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await OrdersService.obtener(req.params["id"] ?? "");
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(404).json({ success: false, error: error instanceof Error ? error.message : "No encontrado" });
  }
});

// GET /api/v1/orders/:id/eventos — timeline de auditoría del pedido
ordersRouter.get("/:id/eventos", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params["id"] ?? "";
    const pedido = await OrdersService.obtener(id);
    if (pedido.empresaId !== req.user!.empresaId) {
      res.status(403).json({ success: false, error: "Pedido fuera de tu empresa" });
      return;
    }
    const eventos = await OrdersService.eventos(id);
    res.json({ success: true, data: eventos, total: eventos.length });
  } catch (error) {
    res.status(404).json({ success: false, error: error instanceof Error ? error.message : "No encontrado" });
  }
});

// POST /api/v1/orders — solo los encargados pueden crear pedidos
ordersRouter.post("/", requireRole(["encargado"]) as RequestHandler, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Datos inválidos", details: parsed.error.flatten() });
      return;
    }
    const { fechaEntregaLimite, ...resto } = parsed.data;
    const order = await OrdersService.crear(
      {
        ...resto,
        empresaId: req.user!.empresaId,
        ...(fechaEntregaLimite && { fechaEntregaLimite: new Date(fechaEntregaLimite) }),
      },
      { id: req.user!.id, nombre: req.user!.nombre }
    );
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
    const id = req.params["id"] ?? "";

    // Verificación multi-tenant + propiedad: el pedido debe ser de la empresa
    // del usuario, y un repartidor solo puede cambiar sus pedidos asignados.
    const pedido = await OrdersService.obtener(id);
    if (pedido.empresaId !== req.user!.empresaId) {
      res.status(403).json({ success: false, error: "Pedido fuera de tu empresa" });
      return;
    }
    if (req.user!.rol === "repartidor" && pedido.repartidorId !== req.user!.id) {
      res.status(403).json({ success: false, error: "Pedido no asignado a ti" });
      return;
    }

    const order = await OrdersService.actualizarEstado(id, parsed.data.estado, {
      motivo: parsed.data.motivo,
      sinFoto: parsed.data.sinFoto,
      actor: { id: req.user!.id, nombre: req.user!.nombre },
    });
    res.json({ success: true, data: order });
  } catch (error) {
    // 409 cuando la transición es inválida (p.ej. cambiar un cancelado)
    const msg = error instanceof Error ? error.message : "Error";
    const status = /no admite más cambios|cancelado/.test(msg) ? 409 : 400;
    res.status(status).json({ success: false, error: msg });
  }
});

// DELETE /api/v1/orders/:id
ordersRouter.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    await OrdersService.eliminar(req.params["id"] ?? "");
    res.json({ success: true, message: "Pedido eliminado" });
  } catch (error) {
    res.status(404).json({ success: false, error: error instanceof Error ? error.message : "No encontrado" });
  }
});
