import Link from "next/link";
import { ReactNode } from "react";
import { MapPin, Package, Map, Brain, Settings, Bell } from "lucide-react";
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
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden selection:bg-emerald-500/30">
      
      {/* 1. EL MARCO: BARRA LATERAL (Sidebar con Glassmorphism) */}
      <aside className="w-72 bg-zinc-950/80 backdrop-blur-2xl border-r border-zinc-800/60 flex-col hidden md:flex z-50 shadow-2xl">
        
        {/* Logo de la app */}
        <div className="p-8 border-b border-zinc-800/60 flex items-center justify-between">
          <h2 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
            Route<span className="text-emerald-400 bg-none">AI</span>
          </h2>
          <span className="text-[10px] text-emerald-400 font-mono tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.1)]">PRO</span>
        </div>

        {/* Navegación usando <Link> nativo de Next.js */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
          
          <Link href="/dashboard" className="px-4 py-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(52,211,153,0.15)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-3 group">
            <MapPin className="w-5 h-5 group-hover:scale-110 group-hover:text-emerald-300 transition-transform" /> Panel Central
          </Link>

          <Link href="/dashboard/pedidos" className="px-4 py-3.5 rounded-xl text-zinc-400 font-medium hover:bg-zinc-800/50 hover:text-zinc-100 border border-transparent hover:border-zinc-700/50 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-3 group">
            <Package className="w-5 h-5 group-hover:scale-110 group-hover:text-amber-400 transition-all" /> Todos los Pedidos
          </Link>

          <Link href="/dashboard/rutas" className="px-4 py-3.5 rounded-xl text-zinc-400 font-medium hover:bg-zinc-800/50 hover:text-zinc-100 border border-transparent hover:border-zinc-700/50 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-3 group">
            <Map className="w-5 h-5 group-hover:scale-110 group-hover:text-blue-400 transition-all" /> Rutas Inteligentes
          </Link>

          <Link href="/dashboard/ia" className="px-4 py-3.5 rounded-xl text-zinc-400 font-medium hover:bg-zinc-800/50 hover:text-zinc-100 border border-transparent hover:border-zinc-700/50 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-3 group">
            <Brain className="w-5 h-5 group-hover:scale-110 group-hover:text-purple-400 transition-all" /> Predicciones IA
          </Link>

          <Link href="/dashboard/alertas" className="px-4 py-3.5 rounded-xl text-zinc-400 font-medium hover:bg-zinc-800/50 hover:text-zinc-100 border border-transparent hover:border-zinc-700/50 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-3 group">
            <Bell className="w-5 h-5 group-hover:scale-110 group-hover:text-amber-400 transition-all" /> Alertas
          </Link>
          
        </nav>

        {/* Botón Inferior: Opciones y Perfil */}
        <div className="p-6 border-t border-zinc-800/60 bg-zinc-950/50 flex flex-col gap-3">
          
          {/* Info del usuario logueado */}
          <div className="px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 shadow-inner">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-0.5">Sesión Activa</p>
            <p className="text-xs text-zinc-300 font-mono truncate">{user.email}</p>
          </div>

          <button className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 text-sm text-zinc-300 font-semibold hover:bg-zinc-800 hover:text-white border border-zinc-700/50 hover:border-zinc-600 transition-all duration-300 flex justify-center items-center gap-2 group active:scale-95">
            <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" /> Configuración
          </button>

          {/* Botón de Cerrar Sesión */}
          <LogoutButton />
        </div>
      </aside>

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
