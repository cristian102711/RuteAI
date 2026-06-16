"use server";

import prisma from "@ruteai/database";
import { revalidatePath } from "next/cache";
import { callCore } from "@/lib/coreServiceClient";

export async function crearEmpresa(formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const plan   = formData.get("plan")   as string;
  const email  = formData.get("email")  as string;
  if (!nombre || !email) throw new Error("Nombre y email son requeridos");
  // Persistencia delegada a core (valida rol super_admin)
  await callCore("/api/v1/empresas", {
    method: "POST",
    body: { nombre, email, plan: plan || "starter" },
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

export async function toggleEmpresaEstado(id: string, _activa: boolean) {
  // core lee el estado actual y lo invierte
  await callCore(`/api/v1/empresas/${id}/toggle`, { method: "PATCH" });
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
