import { Search } from "lucide-react";
import { createClient } from "@/lib/supabaseServer";
import prisma from "@ruteai/database";
import { NotificationBell } from "./NotificationBell";

// Server Component — carga alertas iniciales sin round-trip extra en cliente
export async function DashboardHeader() {
  // Cargar conteo inicial y últimas alertas desde DB
  let initialCount = 0;
  let initialAlertas: { id: string; tipo: string; mensaje: string; createdAt: string }[] = [];

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const usuarioDB = await prisma.usuario.findUnique({
        where: { id: user.id },
        select: { empresaId: true },
      });

      if (usuarioDB) {
        const [count, alertas] = await Promise.all([
          prisma.alerta.count({
            where: { empresaId: usuarioDB.empresaId, leida: false },
          }),
          prisma.alerta.findMany({
            where: { empresaId: usuarioDB.empresaId, leida: false },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, tipo: true, mensaje: true, createdAt: true },
          }),
        ]);

        initialCount = count;
        initialAlertas = alertas.map((a: any) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        }));
      }
    }
  } catch {
    // Si falla (ej: sin sesión), el bell muestra 0 alertas
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.04] bg-zinc-950/70 px-5 backdrop-blur-xl">

      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          placeholder="Buscar pedidos, clientes, repartidores…"
          className="h-9 w-full rounded-md border border-white/[0.04] bg-white/5 pl-9 pr-16 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-white"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-white/[0.04] bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-500 sm:inline-flex">
          ⌘K
        </kbd>
      </div>

      {/* Campana de notificaciones con badge real */}
      <NotificationBell
        initialCount={initialCount}
        initialAlertas={initialAlertas}
      />

      {/* Action Button */}
      <button className="hidden items-center gap-2 rounded-md bg-gradient-to-r from-amber-500 to-amber-400 px-3 py-2 text-xs font-semibold text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:opacity-90 sm:inline-flex transition-opacity">
        <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-pulse" />
        Optimizar con IA
      </button>

    </header>
  );
}
