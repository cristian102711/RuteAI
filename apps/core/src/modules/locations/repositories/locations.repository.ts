import prisma from "../../../lib/prisma";

export const LocationsRepository = {
  // Última ubicación conocida de cada repartidor de la empresa
  // (distinct por repartidorId tras ordenar por timestamp desc).
  async findAll(empresaId: string) {
    return prisma.ubicacion.findMany({
      where:    { empresaId },
      orderBy:  { timestamp: "desc" },
      distinct: ["repartidorId"],
      include:  { repartidor: { select: { id: true, nombre: true } } },
    });
  },

  async create(data: {
    empresaId:  string;
    repartidorId: string;
    lat:        number;
    lng:        number;
    velocidad?: number;
  }) {
    return prisma.ubicacion.create({ data });
  },

  async findLatestByRepartidor(repartidorId: string) {
    return prisma.ubicacion.findFirst({
      where:   { repartidorId },
      orderBy: { timestamp: "desc" },
    });
  },
};