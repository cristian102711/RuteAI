"use server";

import prisma from "@ruteai/database";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabaseServer";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function invitarRepartidor(formData: FormData) {
  const nombre   = formData.get("nombre")   as string;
  const email    = formData.get("email")    as string;
  const telefono = formData.get("telefono") as string;
  const vehiculo = formData.get("vehiculo") as string;
  const patente  = formData.get("patente")  as string;

  if (!nombre || !email) {
    return { error: "Faltan datos obligatorios (nombre, email)" };
  }

  // 1. Sesión y permisos
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { empresaId: true, rol: true },
  });

  if (!usuarioDB || usuarioDB.rol !== "encargado") {
    return { error: "No tienes permisos para invitar repartidores" };
  }

  const empresaId = usuarioDB.empresaId;

  // 2. Guardar datos en InvitacionPendiente (upsert por si re-invitan el mismo email)
  const expiraEn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
  await prisma.invitacionPendiente.upsert({
    where:  { email },
    update: { nombre, telefono: telefono || null, vehiculo: vehiculo || null, patente: patente || null, empresaId, creadoPor: user.id, expiraEn },
    create: { email, nombre, telefono: telefono || null, vehiculo: vehiculo || null, patente: patente || null, empresaId, creadoPor: user.id, expiraEn },
  });

  // 3. Enviar email de invitación vía Supabase Auth (el repartidor elige su propia contraseña)
  const adminAuth = createAdminClient().auth.admin;
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://ruteai.vercel.app"}/registro-repartidor`;

  try {
    const { error: inviteError } = await adminAuth.inviteUserByEmail(email, {
      redirectTo,
      data: {
        nombre,
        rol:       "repartidor",
        empresaId,
      },
    });

    if (inviteError) {
      // Limpiar la invitación si falló el email
      await prisma.invitacionPendiente.deleteMany({ where: { email } });
      if (inviteError.message.includes("already registered")) {
        return { error: "Este correo ya tiene una cuenta en RuteAI." };
      }
      throw inviteError;
    }
  } catch (error: any) {
    console.error("Error al invitar repartidor:", error);
    return { error: error.message || "Error al enviar la invitación" };
  }

  revalidatePath("/dashboard/equipo");
  return { success: true, email };
}


export async function editarRepartidor(formData: FormData) {
  const id = formData.get("id") as string;
  const nombre = formData.get("nombre") as string;
  const telefono = formData.get("telefono") as string;
  const vehiculo = formData.get("vehiculo") as string;
  const patente = formData.get("patente") as string;

  if (!id || !nombre) {
    return { error: "Faltan datos obligatorios" };
  }

  // 1. Obtener la sesión actual y verificar permisos
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { empresaId: true, rol: true },
  });

  if (!usuarioDB || usuarioDB.rol !== "encargado") {
    return { error: "No tienes permisos para editar repartidores" };
  }

  // Verificar que el repartidor pertenece a la empresa actual
  const repartidorDestino = await prisma.usuario.findUnique({
    where: { id },
    select: { empresaId: true }
  });

  if (!repartidorDestino || repartidorDestino.empresaId !== usuarioDB.empresaId) {
    return { error: "Repartidor no encontrado o no tienes acceso" };
  }

  try {
    // 2. Actualizar usuario en Prisma
    await prisma.usuario.update({
      where: { id },
      data: {
        nombre,
        telefono: telefono || null,
        vehiculo: vehiculo || null,
        patente: patente || null,
      }
    });
  } catch (error: any) {
    console.error("Error al editar repartidor:", error);
    return { error: error.message || "Error interno al editar repartidor" };
  }

  revalidatePath("/dashboard/equipo");
  return { success: true };
}

