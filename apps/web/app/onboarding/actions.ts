"use server";

import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";

export async function createCompany(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const nombreEmpresa = formData.get("empresa") as string;
  const nombreUsuario = formData.get("nombre") as string;

  if (!nombreEmpresa || !nombreUsuario) {
    return { error: "Faltan datos" };
  }

  // Verificar si ya existe por ID
  const existingUserById = await prisma.usuario.findUnique({
    where: { id: user.id },
  });
  if (existingUserById) {
    return { success: true };
  }

  // Verificar si ya existe por email
  if (user.email) {
    const existingUserByEmail = await prisma.usuario.findUnique({
      where: { email: user.email },
    });
    if (existingUserByEmail) {
      return { success: true };
    }
  }

  // Buscar si la empresa ya fue creada (por ejemplo, al comprar un plan previamente)
  let empresaExistente = null;
  if (user.email) {
    empresaExistente = await prisma.empresa.findUnique({
      where: { email: user.email },
    });
  }

  try {
    if (empresaExistente) {
      // La empresa ya existe (probablemente por Flow), solo creamos el usuario
      await prisma.usuario.create({
        data: {
          id: user.id,
          nombre: nombreUsuario,
          email: user.email || `user_${user.id}@ruteai.app`,
          rol: "encargado",
          empresaId: empresaExistente.id,
        },
      });
    } else {
      // La empresa no existe, creamos ambas en transacción
      await prisma.$transaction(async (tx: any) => {
        const nuevaEmpresa = await tx.empresa.create({
          data: {
            nombre: nombreEmpresa,
            email: user.email || `company_${user.id}@ruteai.app`,
            plan: "starter",
            planActivo: true,
            planEstado: "activo",
          },
        });

        await tx.usuario.create({
          data: {
            id: user.id,
            nombre: nombreUsuario,
            email: user.email || `user_${user.id}@ruteai.app`,
            rol: "encargado",
            empresaId: nuevaEmpresa.id,
          },
        });
      });
    }

    return { success: true };
  } catch (error: any) {
    // Si ya existe (unique constraint), igual va al dashboard
    if (error?.code === "P2002") {
      return { success: true };
    }
    console.error("Error en createCompany:", error);
    return { error: "Error al crear la empresa. Intenta de nuevo." };
  }
}
