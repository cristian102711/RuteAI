import prisma from "../../../lib/prisma";

export class AlertasService {
  static async listar(empresaId: string, soloNoLeidas: boolean) {
    return prisma.alerta.findMany({
      where: {
        empresaId,
        ...(soloNoLeidas && { leida: false }),
      },
      include: {
        repartidor: { select: { id: true, nombre: true } },
      },
      orderBy: [{ leida: "asc" }, { createdAt: "desc" }],
      take: 50,
    });
  }

  static async crear(data: any) {
    return prisma.alerta.create({ data });
  }

  static async marcarLeida(id: string, empresaId: string) {
    const alerta = await prisma.alerta.findFirst({ where: { id, empresaId } });
    if (!alerta) throw new Error("Alerta no encontrada");
    return prisma.alerta.update({ where: { id }, data: { leida: true } });
  }
}
