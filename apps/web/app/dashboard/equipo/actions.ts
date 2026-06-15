"use server";

import prisma from "@ruteai/database";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabaseServer";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function invitarRepartidor(formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const email = formData.get("email") as string;
  const telefono = formData.get("telefono") as string;
  const vehiculo = formData.get("vehiculo") as string;
  const patente = formData.get("patente") as string;

  if (!nombre || !email) {
    return { error: "Faltan datos obligatorios (nombre, email)" };
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
    return { error: "No tienes permisos para invitar repartidores" };
  }

  const empresaId = usuarioDB.empresaId;

  // 2. Crear usuario en Supabase Auth mediante Admin API
  const adminAuth = createAdminClient().auth.admin;
  
  try {
    const { data: userData, error: authError } = await adminAuth.createUser({
      email: email,
      password: "RouteAI2026!",
      email_confirm: true,
      user_metadata: {
        nombre: nombre,
        rol: "repartidor",
        empresaId: empresaId
      }
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        return { error: "Este correo ya está registrado en Supabase" };
      }
      throw authError;
    }

    if (!userData.user) {
      throw new Error("No se pudo obtener el usuario de Supabase tras crearlo");
    }

    const nuevoUserId = userData.user.id;

    // 3. Crear usuario en Prisma
    await prisma.usuario.create({
      data: {
        id: nuevoUserId,
        nombre: nombre,
        email: email,
        telefono: telefono || null,
        vehiculo: vehiculo || null,
        patente: patente || null,
        rol: "repartidor",
        empresaId: empresaId,
      }
    });

  } catch (error: any) {
    console.error("Error al invitar repartidor:", error);
    return { error: error.message || "Error interno al invitar repartidor" };
  }

  revalidatePath("/dashboard/equipo");
  return { success: true };
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

