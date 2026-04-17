"use client";

import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import { useState } from "react";
import { Navigation2 } from "lucide-react";

interface Parada {
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
  apiKey: string;
}

export function MapaRutas({ paradas, apiKey }: MapaRutasProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Centro del mapa: primer punto o Santiago de Chile como fallback
  const centro =
    paradas.length > 0
      ? { lat: paradas[0].lat, lng: paradas[0].lng }
      : { lat: -33.4489, lng: -70.6693 };

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={centro}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapId="ruteai-map"
        style={{ width: "100%", height: "100%", borderRadius: "1.5rem" }}
        colorScheme="DARK"
      >
        {paradas.map((parada) => (
          <AdvancedMarker
            key={parada.id}
            position={{ lat: parada.lat, lng: parada.lng }}
            onClick={() =>
              setSelectedId(selectedId === parada.id ? null : parada.id)
            }
          >
            <Pin
              background={parada.index === 0 ? "#10b981" : "#3b82f6"}
              borderColor={parada.index === 0 ? "#059669" : "#2563eb"}
              glyphColor="#fff"
              glyph={String(parada.index + 1)}
              scale={1.2}
            />
          </AdvancedMarker>
        ))}

        {selectedId &&
          (() => {
            const p = paradas.find((x) => x.id === selectedId);
            if (!p) return null;
            return (
              <InfoWindow
                position={{ lat: p.lat, lng: p.lng }}
                onCloseClick={() => setSelectedId(null)}
                pixelOffset={[0, -40]}
              >
                <div className="font-sans text-zinc-900 p-1 min-w-[160px]">
                  <p className="font-extrabold text-sm mb-0.5 uppercase tracking-wide">
                    {p.label}
                  </p>
                  <p className="text-xs text-zinc-600 mb-0.5">📍 {p.direccion}</p>
                  <p className="text-xs text-zinc-500">👤 {p.cliente}</p>
                </div>
              </InfoWindow>
            );
          })()}
      </Map>
    </APIProvider>
  );
}

// Componente de estado "Sin API Key"
export function MapaPlaceholder() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
      <div className="w-24 h-24 mb-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center relative">
        <div className="w-16 h-16 rounded-full bg-blue-500/20 animate-ping absolute inset-0 m-auto" />
        <Navigation2 className="w-10 h-10 text-blue-400 relative z-10" />
      </div>
      <h3 className="text-2xl font-bold text-zinc-100 mb-2">
        Google Maps API no configurada
      </h3>
      <p className="text-zinc-400 max-w-md text-sm leading-relaxed">
        Agrega tu API Key en el archivo{" "}
        <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-400">
          .env
        </code>{" "}
        como{" "}
        <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-400">
          NEXT_PUBLIC_GOOGLE_MAPS_KEY
        </code>
        . Habilita{" "}
        <span className="text-white font-semibold">
          Maps JS API + Geocoding API
        </span>{" "}
        en Google Cloud Console.
      </p>
    </div>
  );
}
