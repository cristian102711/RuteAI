"use client";

import { useEffect, useState } from "react";
import { Navigation2 } from "lucide-react";

export interface Parada {
  id: string;
  lat: number;
  lng: number;
  label: string;
  direccion: string;
  cliente: string;
  index: number;
}

interface MapaRutasProps {
  paradas: Parada[];
  empresaId: string;
}

// Componente del mapa (carga solo en cliente por limitación de Leaflet + SSR)
export function MapaRutas({ paradas, empresaId }: MapaRutasProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
      </div>
    );
  }

  return <LeafletMap paradas={paradas} empresaId={empresaId} />;
}

import { createClient } from "@/lib/supabaseClient";

// Lazy-load del mapa Leaflet real
function LeafletMap({ paradas, empresaId }: { paradas: Parada[], empresaId: string }) {
  useEffect(() => {
    // Fix para íconos de Leaflet en Next.js (webpack issue)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("leaflet/dist/leaflet.css");

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });

    // Destruir mapa anterior si existe
    const container = document.getElementById("leaflet-map") as HTMLElement & { _leaflet_id?: number };
    if (container._leaflet_id) {
      const existingMap = L.DomUtil.get("leaflet-map");
      if (existingMap) existingMap._leaflet_id = undefined;
    }

    const centro: [number, number] =
      paradas.length > 0
        ? [paradas[0].lat, paradas[0].lng]
        : [-33.4489, -70.6693]; // Santiago fallback

    const map = L.map("leaflet-map", {
      center: centro,
      zoom: 12,
      zoomControl: true,
    });

    // Capa de tiles oscuros (CartoDB Dark Matter)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    // Marcadores numerados con colores
    paradas.forEach((parada) => {
      const color = parada.index === 0 ? "#10b981" : "#3b82f6";
      const iconHtml = `
        <div style="
          background: ${color};
          color: #fff;
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          font-size: 12px;
          font-weight: 800;
        ">
          <span style="transform: rotate(45deg)">${parada.index + 1}</span>
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -36],
      });

      L.marker([parada.lat, parada.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; min-width: 160px; padding: 4px 0">
            <p style="font-weight: 800; font-size: 13px; text-transform: uppercase; margin: 0 0 4px 0; letter-spacing: 0.05em">${parada.label}</p>
            <p style="font-size: 12px; color: #555; margin: 0 0 2px 0">📍 ${parada.direccion}</p>
            <p style="font-size: 11px; color: #888; margin: 0">👤 ${parada.cliente}</p>
          </div>
        `);
    });

    // Ajustar zoom para mostrar todos los puntos
    if (paradas.length > 1) {
      const bounds = L.latLngBounds(paradas.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    // --- TRACKING EN TIEMPO REAL (SUPABASE BROADCAST) ---
    const supabase = createClient();
    
    const truckIcon = L.divIcon({
      html: `<div style="font-size: 28px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.8)); transform: scaleX(-1);">🚚</div>`,
      className: "transition-all duration-1000 ease-linear", // Animación suave
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let marcCamion: any = null;

    const channel = supabase.channel(`tracking_${empresaId}`);
    
    channel
      .on("broadcast", { event: "location_update" }, (payload) => {
        const { lat, lng } = payload.payload as { lat: number; lng: number };
        
        if (!marcCamion) {
           marcCamion = L.marker([lat, lng], { icon: truckIcon, zIndexOffset: 1000 }).addTo(map);
        } else {
           marcCamion.setLatLng([lat, lng]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      map.remove();
    };
  }, [paradas, empresaId]);

  return (
    <div
      id="leaflet-map"
      style={{ width: "100%", height: "100%", borderRadius: "1.5rem" }}
    />
  );
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
