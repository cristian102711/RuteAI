import { OrdersRepository } from "../repositories/orders.repository";
import type { Prisma } from "@prisma/client";
import {
  ESTADOS_PEDIDO,
  esTerminal,
  minutosAtraso,
} from "../logistica";

// ── Service Layer ─────────────────────────────────────────────

interface Actor {
  id?: string;
  nombre?: string;
}

interface TransicionOpts {
  motivo?: string;
  sinFoto?: boolean;
  actor?: Actor;
}

export const OrdersService = {
  async listar(
    empresaId: string,
    filtros?: { estado?: string; repartidorId?: string }
  ) {
    return OrdersRepository.findAll(empresaId, filtros);
  },

  async obtener(id: string) {
    const pedido = await OrdersRepository.findById(id);
    if (!pedido) throw new Error(`Pedido ${id} no encontrado.`);
    return pedido;
  },

  async eventos(id: string) {
    await this.obtener(id); // verifica que existe
    return OrdersRepository.listarEventos(id);
  },

  async crear(
    data: {
      empresaId:        string;
      nombreCliente:    string;
      clienteTelefono?: string;
      direccion:        string;
      producto:         string;
      horarioPreferido?: string;
      fechaEntregaLimite?: Date;
      lat?:             number;
      lng?:             number;
      scoreRiesgo?:     number;
      repartidorId?:    string;
    },
    actor?: Actor
  ) {
    if (!data.nombreCliente || !data.direccion || !data.producto) {
      throw new Error("nombreCliente, direccion y producto son requeridos.");
    }
    return OrdersRepository.create(data, {
      tipo: "creado",
      estadoNuevo: "pendiente",
      descripcion: "Pedido creado",
      actorId: actor?.id ?? null,
      actorNombre: actor?.nombre ?? null,
      ...(data.fechaEntregaLimite && {
        metadata: { fechaEntregaLimite: data.fechaEntregaLimite.toISOString() },
      }),
    });
  },

  /**
   * Transición de estado con reglas logísticas:
   *  - Bloquea cualquier cambio sobre un pedido en estado terminal
   *    (entregado / cancelado): "no se puede cambiar un cancelado".
   *  - Sella las marcas de tiempo (despachadoEn / entregadoEn / canceladoEn).
   *  - Incrementa intentosEntrega cuando una entrega falla.
   *  - Registra el evento de auditoría en el timeline.
   */
  async actualizarEstado(
    id: string,
    estado: string,
    opts: TransicionOpts = {}
  ) {
    if (!(ESTADOS_PEDIDO as readonly string[]).includes(estado)) {
      throw new Error(
        `Estado inválido. Válidos: ${ESTADOS_PEDIDO.join(", ")}`
      );
    }

    const actual = await OrdersRepository.findById(id);
    if (!actual) throw new Error(`Pedido ${id} no encontrado.`);

    if (esTerminal(actual.estado)) {
      throw new Error(
        actual.estado === "cancelado"
          ? "El pedido está cancelado y no admite más cambios."
          : "El pedido ya fue entregado y no admite más cambios."
      );
    }

    const ahora = new Date();
    const data: Prisma.PedidoUpdateInput = { estado };
    const metadata: Record<string, unknown> = {};

    switch (estado) {
      case "en_ruta":
        if (!actual.despachadoEn) data.despachadoEn = ahora;
        break;
      case "entregado": {
        data.entregadoEn = ahora;
        data.scoreRiesgo = 0; // un pedido entregado ya no tiene riesgo
        if (opts.sinFoto) data.entregaSinFoto = true;
        const atraso = minutosAtraso(actual.fechaEntregaLimite, ahora, ahora);
        metadata.minutosAtraso = atraso;
        metadata.aTiempo = atraso === 0;
        if (opts.sinFoto) metadata.sinFoto = true;
        break;
      }
      case "fallido":
        data.intentosEntrega = (actual.intentosEntrega ?? 0) + 1;
        if (opts.motivo) data.motivoFallo = opts.motivo;
        metadata.intentos = (actual.intentosEntrega ?? 0) + 1;
        break;
      case "cancelado":
        data.canceladoEn = ahora;
        if (opts.motivo) data.motivoCancelacion = opts.motivo;
        break;
    }

    return OrdersRepository.transicionEstado(id, data, {
      tipo: estado === "fallido" && (actual.intentosEntrega ?? 0) > 0 ? "reintento" : estado,
      estadoAnterior: actual.estado,
      estadoNuevo: estado,
      motivo: opts.motivo ?? null,
      actorId: opts.actor?.id ?? null,
      actorNombre: opts.actor?.nombre ?? null,
      ...(Object.keys(metadata).length > 0 && {
        metadata: metadata as Prisma.InputJsonValue,
      }),
    });
  },

  async eliminar(id: string) {
    await this.obtener(id); // verifica que existe
    return OrdersRepository.delete(id);
  },
};
