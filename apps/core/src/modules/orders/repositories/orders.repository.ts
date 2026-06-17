import prisma from "../../../lib/prisma";
import type { Prisma } from "@prisma/client";

// ── Repository Layer ─────────────────────────────────────────
// Encapsula todas las operaciones de Pedido en la base de datos.

interface EventoInput {
  tipo: string;
  estadoAnterior?: string | null;
  estadoNuevo?: string | null;
  motivo?: string | null;
  descripcion?: string | null;
  actorId?: string | null;
  actorNombre?: string | null;
  metadata?: Prisma.InputJsonValue;
}

export const OrdersRepository = {
  async findAll(
    empresaId: string,
    filtros?: { estado?: string; repartidorId?: string }
  ) {
    return prisma.pedido.findMany({
      where: {
        empresaId,
        ...(filtros?.estado && { estado: filtros.estado }),
        ...(filtros?.repartidorId && { repartidorId: filtros.repartidorId }),
      },
      orderBy: { createdAt: "desc" },
      include: { repartidor: { select: { id: true, nombre: true } } },
    });
  },

  async findById(id: string) {
    return prisma.pedido.findUnique({
      where:   { id },
      include: { repartidor: { select: { id: true, nombre: true } }, ruta: true },
    });
  },

  async create(
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
    evento?: EventoInput
  ) {
    return prisma.pedido.create({
      data: {
        ...data,
        ...(evento && { eventos: { create: evento } }),
      },
    });
  },

  /**
   * Cambia el estado del pedido y registra el evento de auditoría en una
   * sola transacción, garantizando que el timeline nunca se desincronice.
   */
  async transicionEstado(
    id: string,
    data: Prisma.PedidoUpdateInput,
    evento: EventoInput
  ) {
    return prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.update({ where: { id }, data });
      await tx.eventoPedido.create({ data: { pedidoId: id, ...evento } });
      return pedido;
    });
  },

  async updateScore(id: string, scoreRiesgo: number) {
    return prisma.pedido.update({ where: { id }, data: { scoreRiesgo } });
  },

  async listarEventos(pedidoId: string) {
    return prisma.eventoPedido.findMany({
      where: { pedidoId },
      orderBy: { createdAt: "asc" },
    });
  },

  async delete(id: string) {
    return prisma.pedido.delete({ where: { id } });
  },
};
