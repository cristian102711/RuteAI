"use server";

import prisma from "@ruteai/database";
import { redirect } from "next/navigation";

export async function completarRegistroRepartidor(formData: FormData) {
  const userId    = formData.get("userId")    as string;
  const email     = formData.get("email")     as string;
  const empresaId = formData.get("empresaId") as string;
  const nombre    = formData.get("nombre")    as string;
  const telefono  = formData.get("telefono")  as string;
  const vehiculo  = formData.get("vehiculo")  as string;
  const patente   = formData.get("patente")   as string;

  if (!userId || !email || !empresaId || !nombre) {
    return { error: "Faltan datos obligatorios." };
  }

  try {
    // Crear el usuario en Prisma
    await prisma.usuario.create({
      data: {
        id:       userId,
        nombre,
        email,
        telefono: telefono || null,
        vehiculo: vehiculo || null,
        patente:  patente  || null,
        rol:      "repartidor",
        empresaId,
      },
    });

    // Borrar la invitación pendiente (ya fue usada)
    await prisma.invitacionPendiente.deleteMany({ where: { email } });
  } catch (error: any) {
    console.error("[completarRegistroRepartidor]", error);
    // Si ya existe (doble submit) simplemente continuar
    if (!error?.message?.includes("Unique constraint")) {
      return { error: error.message || "Error al guardar tu perfil." };
    }
  }

  redirect("/repartidor");
}
