import prisma from "../../../lib/prisma";

export const RoutesRepository = {
  async findAll(empresaId: string) {
    return prisma.ruta.findMany({
      where:   { empresaId },
      orderBy: { fecha: "desc" },
      include: { repartidor: { select: { nombre: true } }, pedidos: true },
    });
  },

  async findById(id: string) {
    return prisma.ruta.findUnique({
      where:   { id },
      include: { pedidos: true, repartidor: { select: { nombre: true } } },
    });
  },

  async create(data: {
    empresaId:      string;
    repartidorId:   string;
    fecha:          Date;
    rutaOptimizada?: unknown;
  }) {
    return prisma.ruta.create({
      data: {
        empresaId:    data.empresaId,
        repartidorId: data.repartidorId,
        fecha:        data.fecha,
        estado:       "planificada", // catálogo unificado con la API (#3)
        ...(data.rutaOptimizada !== undefined
          ? { rutaOptimizada: data.rutaOptimizada as any }
          : {}),
      },
    });
  },

  async updateEstado(id: string, estado: string) {
    return prisma.ruta.update({ where: { id }, data: { estado } });
  },
};