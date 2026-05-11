import prisma from "../../../lib/prisma";

// ── Repository Layer ─────────────────────────────────────────
// Encapsula todas las operaciones de Pedido en la base de datos.

export const OrdersRepository = {
  async findAll(empresaId: string) {
    return prisma.pedido.findMany({
      where:   { empresaId },
      orderBy: { createdAt: "desc" },
      include: { repartidor: { select: { nombre: true } } },
    });
  },

  async findById(id: string) {
    return prisma.pedido.findUnique({
      where:   { id },
      include: { repartidor: { select: { nombre: true } }, ruta: true },
    });
  },

  async create(data: {
    empresaId:      string;
    nombreCliente:  string;
    clienteTelefono?: string;
    direccion:      string;
    producto:       string;
    lat?:           number;
    lng?:           number;
  }) {
    return prisma.pedido.create({ data });
  },

  async updateEstado(id: string, estado: string) {
    return prisma.pedido.update({ where: { id }, data: { estado } });
  },

  async updateScore(id: string, scoreRiesgo: number) {
    return prisma.pedido.update({ where: { id }, data: { scoreRiesgo } });
  },

  async delete(id: string) {
    return prisma.pedido.delete({ where: { id } });
  },
};