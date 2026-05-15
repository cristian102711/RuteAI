import { Route } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 shadow-[0_0_30px_rgba(245,158,11,0.2)] border border-zinc-800">
          <div className="absolute inset-0 rounded-2xl border border-amber-500/30 border-t-amber-500 animate-spin" />
          <Route className="h-6 w-6 text-amber-500 animate-pulse" />
        </div>
        <div className="text-sm font-medium text-zinc-400 tracking-widest uppercase">
          Cargando<span className="animate-[ping_1.5s_infinite]">...</span>
        </div>
      </div>
    </div>
  );
}
