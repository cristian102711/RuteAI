"use client";

import { Bell } from "lucide-react";
import OptimizarRutasModal from "./OptimizarRutasModal";
import { BuscadorPedidos } from "./BuscadorPedidos";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.04] bg-zinc-950/70 px-5 backdrop-blur-xl">
      
      {/* Search Input */}
      <BuscadorPedidos />

      {/* Bell Notification */}
      <button className="grid h-9 w-9 place-items-center rounded-md border border-white/[0.04] bg-white/5 text-zinc-400 hover:text-white transition-colors">
        <Bell className="h-4 w-4" />
      </button>

      <OptimizarRutasModal />

    </header>
  );
}
