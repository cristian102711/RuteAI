"use client";

import { APIProvider, Map, Marker, InfoWindow } from "@vis.gl/react-google-maps";
import { useState } from "react";

interface Parada {
  id: number;
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
}

interface Props {
  paradaActual: Parada;
  apiKey: string;
}

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#09090b" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#09090b" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#27272a" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#18181b" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#27272a" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#27272a" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#3f3f46" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#020617" }] },
];

export function RepartidorMapa({ paradaActual, apiKey }: Props) {
  const [infoAbierta, setInfoAbierta] = useState(false);
  const center = { lat: paradaActual.lat, lng: paradaActual.lng };

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={center}
        defaultZoom={15}
        gestureHandling="greedy"
        disableDefaultUI={true}
        styles={DARK_MAP_STYLE}
        className="h-full w-full"
      >
        <Marker
          position={center}
          onClick={() => setInfoAbierta(true)}
          options={{
            icon: {
              path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z",
              fillColor: "#a855f7",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 1.5,
              scale: 1.1,
            },
          }}
        />
        {infoAbierta && (
          <InfoWindow position={center} onCloseClick={() => setInfoAbierta(false)}>
            <div className="p-1 font-sans">
              <div className="font-bold text-xs text-zinc-900">{paradaActual.nombre}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5 max-w-[160px]">
                {paradaActual.direccion}
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}
