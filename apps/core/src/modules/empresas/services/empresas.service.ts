import prisma from "../../../lib/prisma";

export const EmpresasService = {
  async listarTodas() {
    return prisma.empresa.findMany({
      include: {
        _count: {
          select: { usuarios: true, pedidos: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  },

  async crear(nombre: string, plan: string, email?: string) {
    // Si no se entrega email, se genera uno basado en el nombre
    const emailStr =
      email && email.trim().length > 0
        ? email
        : nombre.toLowerCase().replace(/[^a-z0-9]/g, "") + "@empresa.com";
    return prisma.empresa.create({
      data: {
        nombre,
        email: emailStr,
        plan,
        planActivo: true,
        activa: true,
      }
    });
  },

  async toggleEstado(id: string) {
    const empresa = await prisma.empresa.findUnique({ where: { id } });
    if (!empresa) throw new Error("Empresa no encontrada");
    
    return prisma.empresa.update({
      where: { id },
      data: { activa: !empresa.activa }
    });
  }
};
