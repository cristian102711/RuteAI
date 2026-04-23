import { ReactNode } from "react";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Sidebar } from "@/app/dashboard/components/Sidebar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {

  // 🔒 Verificación de sesión en el servidor
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Si no hay usuario, el middleware ya lo redirige, pero esto es la doble seguridad
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden selection:bg-emerald-500/30">
      
      {/* 1. EL MARCO: BARRA LATERAL (Sidebar Dinámica Client-Side) */}
      <Sidebar userEmail={user.email} />

      {/* 2. LA PINTURA: CONTENIDO PRINCIPAL DEL DASHBOARD */}
      <main className="flex-1 overflow-y-auto relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-900/10 to-transparent pointer-events-none opacity-50 mix-blend-screen" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="p-6 md:p-10 relative z-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
