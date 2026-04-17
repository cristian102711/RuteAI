"use client";

import dynamic from "next/dynamic";
import { Navigation2 } from "lucide-react";
import type { Parada } from "./MapaRutasRender";

export type { Parada };

// Carga dinámica de Leaflet para evitar errores "window is not defined" en Next.js SSR
const MapaConReactLeaflet = dynamic(() => import("./MapaRutasRender"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/50">
      <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
    </div>
  ),
});

interface MapaRutasProps {
  paradas: Parada[];
  empresaId: string;
}

export function MapaRutas({ paradas, empresaId }: MapaRutasProps) {
  return <MapaConReactLeaflet paradas={paradas} empresaId={empresaId} />;
}

// Placeholder cuando no hay geocodificación disponible
export function MapaPlaceholder({ mensaje }: { mensaje?: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
      <div className="w-24 h-24 mb-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center relative">
        <div className="w-16 h-16 rounded-full bg-blue-500/20 animate-ping absolute inset-0 m-auto" />
        <Navigation2 className="w-10 h-10 text-blue-400 relative z-10" />
      </div>
      <h3 className="text-2xl font-bold text-zinc-100 mb-2">
        {mensaje ?? "Sin despachos para mapear"}
      </h3>
      <p className="text-zinc-400 max-w-md text-sm leading-relaxed">
        Crea pedidos pendientes desde el{" "}
        <span className="text-emerald-400 font-semibold">Panel Central</span>{" "}
        para verlos aquí geocodificados automáticamente.
      </p>
    </div>
  );
}
