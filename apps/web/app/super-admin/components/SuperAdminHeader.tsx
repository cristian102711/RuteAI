import { Search, Bell } from "lucide-react";

export function SuperAdminHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-zinc-800 bg-zinc-950/70 px-5 backdrop-blur-xl">
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input 
          placeholder="Buscar pedidos, clientes, repartidores…" 
          className="h-9 w-full rounded-md border border-zinc-800 bg-white/[0.03] pl-9 pr-16 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-shadow"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-400 sm:inline-flex">
          ⌘K
        </kbd>
      </div>
      
      <button className="grid h-9 w-9 place-items-center rounded-md border border-zinc-800 bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/10 transition-colors ml-auto">
        <Bell className="h-4 w-4" />
      </button>
      
      <button className="hidden items-center gap-2 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:opacity-90 transition-opacity sm:inline-flex">
        <span className="h-1.5 w-1.5 rounded-full bg-purple-300 animate-pulse"></span>
        Optimizar con IA
      </button>
    </header>
  );
}
