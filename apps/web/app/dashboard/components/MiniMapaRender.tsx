/// <reference types="google.maps" />
"use client";

import { useEffect, useMemo, useRef } from "react";
import { APIProvider, Map, Marker, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useRealtimeGPS } from "./RealtimeGPSPin";

const MINI_MAP_ID = "mini-mapa";

// Línea de ruta entre paradas (v1 no exporta <Polyline>)
function MiniPolyline({ path }: { path: google.maps.LatLngLiteral[] }) {
  const map = useMap(MINI_MAP_ID);
  const mapsLib = useMapsLibrary("maps");
  const polyRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !mapsLib) return;
    if (!polyRef.current) {
      polyRef.current = new mapsLib.Polyline({
        geodesic: true,
        strokeColor: "#3b82f6",
        strokeOpacity: 0.8,
        strokeWeight: 2.5,
      });
    }
    const poly = polyRef.current;
    poly.setPath(path);
    poly.setMap(path.length >= 2 ? map : null);
    return () => { poly.setMap(null); };
  }, [map, mapsLib, path]);

  return null;
}

// Encuadre automático sobre todas las paradas
function MiniFitBounds({ points }: { points: google.maps.LatLngLiteral[] }) {
  const map = useMap(MINI_MAP_ID);
  const ajustado = useRef(false);

  useEffect(() => {
    if (!map || points.length === 0 || ajustado.current) return;
    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(13);
    } else {
      const bounds = new google.maps.LatLngBounds();
      points.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 40);
    }
    ajustado.current = true;
  }, [map, points]);

  return null;
}

interface Parada {
  id: string;
  lat: number;
  lng: number;
  nombreCliente: string;
  direccion: string;
  estado: string;
}

interface Props {
  paradas: Parada[];
  empresaId: string;
}

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#09090b" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#09090b" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#27272a" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#a1a1aa" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#18181b" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#27272a" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#27272a" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#3f3f46" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#020617" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3f3f46" }] }
];

export default function MiniMapaRender({ paradas, empresaId }: Props) {
  const { ubicacion } = useRealtimeGPS(empresaId);

  // Calcular centro del mapa
  const mapCenter = useMemo(() => {
    if (paradas.length > 0) {
      const latSum = paradas.reduce((sum, p) => sum + p.lat, 0);
      const lngSum = paradas.reduce((sum, p) => sum + p.lng, 0);
      return {
        lat: latSum / paradas.length,
        lng: lngSum / paradas.length,
      };
    }
    if (ubicacion) {
      return { lat: ubicacion.lat, lng: ubicacion.lng };
    }
    // Santiago
    return { lat: -33.4489, lng: -70.6693 };
  }, [paradas, ubicacion]);

  // Ruta a dibujar entre paradas (mismo orden que llega del servidor)
  const rutaPath = useMemo(
    () => paradas.map((p) => ({ lat: p.lat, lng: p.lng })),
    [paradas]
  );

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";

  if (!googleMapsApiKey) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 p-4 text-center">
        <p className="text-xs text-zinc-500">Google Maps API Key no configurada.</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={googleMapsApiKey}>
      <Map
        id={MINI_MAP_ID}
        defaultCenter={mapCenter}
        defaultZoom={11}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        zoomControl={true}
        styles={DARK_MAP_STYLE}
        className="w-full h-full"
      >
        {/* Línea de la ruta y encuadre automático */}
        <MiniPolyline path={rutaPath} />
        <MiniFitBounds points={rutaPath} />

        {/* Paradas activas */}
        {paradas.map((parada) => {
          const isEnRuta = parada.estado === "en_ruta";
          return (
            <Marker
              key={parada.id}
              position={{ lat: parada.lat, lng: parada.lng }}
              icon={{
                path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z",
                fillColor: isEnRuta ? "#f59e0b" : "#10b981",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 1.5,
                scale: 0.8
              }}
            />
          );
        })}

        {/* Repartidor en tiempo real */}
        {ubicacion && (
          <Marker
            position={{ lat: ubicacion.lat, lng: ubicacion.lng }}
            icon={{
              path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z",
              fillColor: "#3b82f6",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
              scale: 1.0
            }}
          />
        )}
      </Map>
    </APIProvider>
  );
}
