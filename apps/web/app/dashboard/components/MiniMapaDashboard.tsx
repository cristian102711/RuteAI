"use client";

import dynamic from "next/dynamic";

const MiniMapaConGoogle = dynamic(() => import("./MiniMapaRender"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80">
      <div className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
    </div>
  ),
});

interface MiniMapaDashboardProps {
  pedidos: Array<{
    id: string;
    nombreCliente: string;
    direccion: string;
    estado: string;
    lat: number | null;
    lng: number | null;
  }>;
  empresaId: string;
}

export function MiniMapaDashboard({ pedidos, empresaId }: MiniMapaDashboardProps) {
  // Filtrar pedidos con coordenadas válidas
  const paradasValidas = pedidos
    .filter((p) => p.lat !== null && p.lng !== null)
    .map((p) => ({
      id: p.id,
      lat: p.lat!,
      lng: p.lng!,
      nombreCliente: p.nombreCliente,
      direccion: p.direccion,
      estado: p.estado,
    }));

  return (
    <div className="absolute inset-0 w-full h-full">
      <MiniMapaConGoogle paradas={paradasValidas} empresaId={empresaId} />
    </div>
  );
}
