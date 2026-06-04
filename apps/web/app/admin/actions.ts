"use server";

import prisma from "@ruteai/database";
import { revalidatePath } from "next/cache";

export async function crearEmpresa(formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const plan   = formData.get("plan")   as string;
  const email  = formData.get("email")  as string;
  if (!nombre || !email) throw new Error("Nombre y email son requeridos");
  await prisma.empresa.create({
    data: { nombre, email, plan: plan || "starter", planActivo: true, activa: true },
  });
  revalidatePath("/admin");
}

export async function editarEmpresa(formData: FormData) {
  const id     = formData.get("id")     as string;
  const nombre = formData.get("nombre") as string;
  const plan   = formData.get("plan")   as string;
  const email  = formData.get("email")  as string;
  if (!id) throw new Error("ID requerido");
  await prisma.empresa.update({
    where: { id },
    data: { nombre, email, plan },
  });
  revalidatePath("/admin");
}

export async function toggleEmpresaEstado(id: string, activa: boolean) {
  await prisma.empresa.update({
    where: { id },
    data: { activa: !activa },
  });
  revalidatePath("/admin");
}

export async function eliminarEmpresa(id: string) {
  await prisma.empresa.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function cambiarRolUsuario(id: string, nuevoRol: string) {
  await prisma.usuario.update({
    where: { id },
    data: { rol: nuevoRol },
  });
  revalidatePath("/admin/usuarios");
}

export async function eliminarUsuario(id: string) {
  await prisma.usuario.delete({ where: { id } });
  revalidatePath("/admin/usuarios");
}
