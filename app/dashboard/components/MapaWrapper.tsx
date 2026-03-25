"use client";

import dynamic from "next/dynamic";

// Carga el componente solo en el navegador para evitar el error de SSR
const MapaTracking = dynamic(() => import("./MapaTracking"), { ssr: false });

export function MapaWrapper({ pedidos }: { pedidos: any[] }) {
  return <MapaTracking pedidos={pedidos} />;
}
