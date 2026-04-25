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
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden selection:bg-emerald-500/30">
      
      {/* 1. EL MARCO: BARRA LATERAL (Sidebar Dinámica Client-Side) */}
      <Sidebar userEmail={user.email} />

      {/* 2. LA PINTURA: CONTENIDO PRINCIPAL DEL DASHBOARD */}
      <main className="flex-1 overflow-y-auto relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 dark:from-emerald-900/20 via-background to-background transition-colors duration-500">
        
        {/* Decorative Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none brightness-100" />

        <div className="p-6 md:p-10 relative z-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
