import Link from "next/link";
import { ReactNode } from "react";
import { MapPin, Package, Map, Brain, Settings } from "lucide-react";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/app/dashboard/components/LogoutButton";

export default async function DashboardLayout({ children }: { children: ReactNode }) {

  // 🔒 Verificación de sesión en el servidor
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Si no hay usuario, el middleware ya lo redirige, pero esto es la doble seguridad
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      
      {/* 1. EL MARCO: BARRA LATERAL (Sidebar) */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex-col hidden md:flex z-50">
        
        {/* Logo de la app */}
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-2xl font-black tracking-tighter">
            Route<span className="text-emerald-400">AI</span>
          </h2>
          <span className="text-xs text-zinc-500 font-mono tracking-widest bg-zinc-800 px-2 rounded-md">v1.0 - PRO</span>
        </div>

        {/* Navegación usando <Link> nativo de Next.js para cero-recargas */}
        <nav className="flex-1 p-4 flex flex-col gap-2 mt-2">
          
          <Link href="/dashboard" className="px-4 py-3 rounded-lg bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-3 group">
            <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" /> Panel Central
          </Link>

          <Link href="/dashboard/pedidos" className="px-4 py-3 rounded-lg text-zinc-400 font-medium hover:bg-zinc-800 hover:text-white transition-all flex items-center gap-3 group">
            <Package className="w-5 h-5 group-hover:scale-110 transition-transform" /> Todos los Pedidos
          </Link>

          <Link href="/dashboard/rutas" className="px-4 py-3 rounded-lg text-zinc-400 font-medium hover:bg-zinc-800 hover:text-white transition-all flex items-center gap-3 group">
            <Map className="w-5 h-5 group-hover:scale-110 transition-transform" /> Rutas Inteligentes
          </Link>

          <Link href="/dashboard/ia" className="px-4 py-3 rounded-lg text-zinc-400 font-medium hover:bg-zinc-800 hover:text-white transition-all flex items-center gap-3 z-10 group">
            <Brain className="w-5 h-5 group-hover:scale-110 transition-transform" /> Predicciones IA
          </Link>
          
        </nav>

        {/* Botón Inferior: Opciones y Perfil */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/30 flex flex-col gap-2">
          
          {/* Info del usuario logueado */}
          <div className="px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Sesión Activa</p>
            <p className="text-xs text-zinc-300 font-mono truncate mt-1">{user.email}</p>
          </div>

          <button className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-sm text-zinc-300 font-semibold hover:bg-zinc-700 transition flex justify-center items-center gap-2 border border-zinc-700 group">
            <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Configuración
          </button>

          {/* Botón de Cerrar Sesión (Importación corregida) */}
          <LogoutButton />
        </div>
      </aside>

      {/* 2. LA PINTURA: CONTENIDO PRINCIPAL DEL DASHBOARD */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-900/10 to-transparent pointer-events-none" />
        <div className="p-4 md:p-8 relative z-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
