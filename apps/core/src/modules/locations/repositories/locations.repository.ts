import prisma from "@ruteai/database";

export const LocationsRepository = {
  async findAll(empresaId: string) {
    return prisma.ubicacion.findMany({
      where:   { empresaId },
      orderBy: { timestamp: "desc" },
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