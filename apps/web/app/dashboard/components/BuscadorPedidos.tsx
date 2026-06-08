// apps/web/app/dashboard/components/BuscadorPedidos.tsx

"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

export function BuscadorPedidos() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQuery) {
      params.set("q", debouncedQuery);
    } else {
      params.delete("q");
    }
    router.push(`/dashboard/pedidos?${params.toString()}`);
  }, [debouncedQuery, router, searchParams]);

  return (
    <div className="relative flex-1 max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-zinc-500" />
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar pedidos, clientes, productos..." 
        className="h-9 w-full rounded-md border border-white/[0.04] bg-white/5 pl-9 pr-16 text-sm placeholder:text-zinc-500 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-shadow outline-none"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-white/[0.04] bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-500 sm:inline-flex">
        ⌘K
      </kbd>
    </div>
  );
}
