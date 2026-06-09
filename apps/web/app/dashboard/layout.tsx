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
  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true },
  });

  // Si el usuario no existe en Prisma, es nuevo → onboarding.
  if (!usuarioDB) {
    redirect("/onboarding");
  }

  // Un repartidor no tiene acceso al dashboard de encargados.
  // Redirigirlo a su portal evita que la sesión mezclada de otro repartidor
  // (por ejemplo si se probó el registro en el mismo navegador) acabe aquí.
  if (usuarioDB.rol === "repartidor") {
    redirect("/repartidor/dashboard");
  }

  const empresaNombre = usuarioDB.empresa?.nombre ?? "Mi Empresa";

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
