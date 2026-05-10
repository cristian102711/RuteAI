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
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar cliente o producto..." 
        className="bg-card border border-border-ui rounded-xl pl-10 pr-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-full md:w-64 transition-all shadow-sm"
      />
    </div>
  );
}
