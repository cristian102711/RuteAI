"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { createClient } from "@/lib/supabaseClient";

// Importancia máxima: fix para los íconos de Leaflet en Next.js
// @ts-expect-error - Fix internal leaflet method for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export interface Parada {
  id: string;
  lat: number;
  lng: number;
  label: string;
  direccion: string;
  cliente: string;
  index: number;
}

// Componente para ajustar los límites del mapa (bounds) al cargar
function BoundsAjustador({ paradas }: { paradas: Parada[] }) {
  const map = useMap();
  useEffect(() => {
    if (paradas.length > 0) {
      const bounds = L.latLngBounds(paradas.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [map, paradas]);
  return null;
}

// Componente para el rastreador en vivo (Camión)
function TrackerCamion({ empresaId }: { empresaId: string }) {
  const map = useMap();
  const [posicion, setPosicion] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`tracking_${empresaId}`);

    channel
      .on("broadcast", { event: "location_update" }, (payload) => {
        const { lat, lng } = payload.payload;
        setPosicion({ lat, lng });
        // Opcional: Centrar la cámara en el camión al moverse (puede ser molesto si el usuario mueve el mapa manualmente)
        // map.panTo([lat, lng]); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [empresaId, map]);

  if (!posicion) return null;

  const truckIcon = L.divIcon({
    html: `<div style="font-size: 28px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.8)); transform: scaleX(-1); transition: all 400ms ease;">🚚</div>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

  return <Marker position={[posicion.lat, posicion.lng]} icon={truckIcon} zIndexOffset={1000} />;
}

export default function MapaRutasRender({
  paradas,
  empresaId,
}: {
  paradas: Parada[];
  empresaId: string;
}) {
  const centro: [number, number] =
    paradas.length > 0 ? [paradas[0].lat, paradas[0].lng] : [-33.4489, -70.6693];

  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
      {/* react-leaflet requiere que el contenedor tenga tamaño explícito por CSS, el style={{height: 100%}} en el wrapper a veces falla si el div contenedor de leaflet no toma 100%. */}
      <MapContainer
        center={centro}
        zoom={12}
        style={{ width: "100%", height: "100%", borderRadius: "1.5rem" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {paradas.map((parada) => {
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

          const customIcon = L.divIcon({
            html: iconHtml,
            className: "",
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -36],
          });

          return (
            <Marker key={parada.id} position={[parada.lat, parada.lng]} icon={customIcon}>
              <Popup>
                <div style={{ fontFamily: "sans-serif", minWidth: "160px", padding: "4px 0" }}>
                  <p style={{ fontWeight: 800, fontSize: "13px", margin: "0 0 4px 0", textTransform: "uppercase" }}>
                    {parada.label}
                  </p>
                  <p style={{ fontSize: "12px", color: "#555", margin: "0 0 2px 0" }}>
                    📍 {parada.direccion}
                  </p>
                  <p style={{ fontSize: "11px", color: "#888", margin: 0 }}>
                    👤 {parada.cliente}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <BoundsAjustador paradas={paradas} />
        <TrackerCamion empresaId={empresaId} />
      </MapContainer>
    </div>
  );
}
