import prisma from "@ruteai/database";

export async function asignarPlan(empresaId: string, planId: string) {
  const fechaInicio = new Date();
  const fechaVencimiento = new Date();
  fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1); // +30 días

  await prisma.empresa.update({
    where: { id: empresaId },
    data: {
      plan: planId,
      planActivo: true,
      planFechaInicio: fechaInicio,
      planFechaVencimiento: fechaVencimiento,
      planEstado: "activo",
    },
  });
}
