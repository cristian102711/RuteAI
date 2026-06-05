import { ReactNode } from "react";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Sidebar } from "./components/Sidebar";
import { DashboardHeader } from "./components/DashboardHeader";
import prisma from "@ruteai/database";

export default async function DashboardLayout({ children }: { children: ReactNode }) {

  // 🔒 Verificación de sesión en el servidor
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Obtener empresa del usuario para el sidebar
  // Buscamos primero por ID de Supabase, luego por email como fallback
  // (puede haber diferencia de ID si el usuario fue creado con otro método de login)
  let usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true },
  });

  // Fallback: buscar por email si no se encontró por ID
  if (!usuarioDB && user.email) {
    usuarioDB = await prisma.usuario.findUnique({
      where: { email: user.email },
      include: { empresa: true },
    });
  }

  // Si el usuario no existe en Prisma, significa que es nuevo y viene de Google/Registro.
  // Lo enviamos al onboarding para crear su Empresa.
  if (!usuarioDB) {
    redirect("/onboarding");
  }

  const empresaNombre = usuarioDB.empresa?.nombre ?? "Mi Empresa";
  const planActual = usuarioDB.empresa?.plan ?? "starter";

  // Contar pedidos pendientes para el badge del sidebar
  const pedidosPendientes = usuarioDB?.empresa
    ? await prisma.pedido.count({
        where: {
          empresaId: usuarioDB.empresa.id,
          estado: "pendiente",
        },
      })
    : 0;

  return (
    <div className="flex h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        usuarioEmail={user.email ?? ""}
        usuarioNombre={usuarioDB?.nombre ?? "Usuario"}
        empresaNombre={empresaNombre}
        planActual={planActual}
      />

      {/* Área principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto bg-zinc-950">
          <div className="mx-auto max-w-7xl p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
