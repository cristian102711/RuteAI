export const dynamic = "force-dynamic";

import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import ConfiguracionClient from "./ConfiguracionClient";

export default async function ConfiguracionPage() {
  // 1. Obtener al usuario real que inició sesión desde Supabase Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div className="p-10 text-xl font-bold text-red-400 bg-zinc-950 h-screen">🚨 Error: Sesión no válida.</div>;
  }

  // 2. Buscar en nuestra tabla 'Usuario' de Prisma usando el ID de Supabase
  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true }
  });

  if (!usuarioDB || !usuarioDB.empresa) {
    return <div className="p-10 text-xl font-bold text-red-400 bg-zinc-950 h-screen">🚨 Error: Usuario o Empresa no encontrados en la base de datos.</div>;
  }

  return (
    <ConfiguracionClient 
      initialEmpresa={{
        id: usuarioDB.empresa.id,
        nombre: usuarioDB.empresa.nombre,
        email: usuarioDB.empresa.email,
      }}
      initialUsuario={{
        id: usuarioDB.id,
        nombre: usuarioDB.nombre,
        email: usuarioDB.email,
        telefono: usuarioDB.telefono,
      }}
    />
  );
}
