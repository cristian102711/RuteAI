import prisma from "../../../lib/prisma";

// ── Repository Layer ─────────────────────────────────────────
// Encapsula todas las operaciones de Pedido en la base de datos.

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

  async create(data: {
    empresaId:        string;
    nombreCliente:    string;
    clienteTelefono?: string;
    direccion:        string;
    producto:         string;
    horarioPreferido?: string;
    lat?:             number;
    lng?:             number;
    scoreRiesgo?:     number;
    repartidorId?:    string;
  }) {
    return prisma.pedido.create({ data });
  },

  async updateEstado(id: string, estado: string) {
    // Un pedido entregado ya no tiene riesgo asociado
    return prisma.pedido.update({
      where: { id },
      data: { estado, ...(estado === "entregado" && { scoreRiesgo: 0 }) },
    });
  },

  async updateScore(id: string, scoreRiesgo: number) {
    return prisma.pedido.update({ where: { id }, data: { scoreRiesgo } });
  },

  async delete(id: string) {
    return prisma.pedido.delete({ where: { id } });
  },
};