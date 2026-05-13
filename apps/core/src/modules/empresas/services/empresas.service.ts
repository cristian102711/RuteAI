import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const EmpresasService = {
  async listarTodas() {
    return prisma.empresa.findMany({
      include: {
        _count: {
          select: { usuarios: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  },

  async crear(nombre: string, plan: string) {
    // Para simplificar, generamos un email basado en el nombre (en un MVP real se pediría)
    const emailStr = nombre.toLowerCase().replace(/[^a-z0-9]/g, "") + "@empresa.com";
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
