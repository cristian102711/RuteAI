"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";

interface UbicacionPayload {
  id: string;
  lat: number;
  lng: number;
  repartidorId: string;
  empresaId: string;
  timestamp: string;
}

interface Props {
  empresaId: string;
  // Dimensiones del contenedor SVG (0-100 viewBox)
  onUbicacionUpdate: (ubicacion: UbicacionPayload) => void;
}

// Convierte coordenadas GPS reales a posición % dentro del SVG del mapa
// Rango aproximado Chile: lat -55 a -17, lng -75 a -66
function gpsAporcentaje(lat: number, lng: number): { x: number; y: number } {
  const latMin = -55, latMax = -17;
  const lngMin = -75, lngMax = -66;

  const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
  // Invertimos Y porque en pantalla Y=0 es arriba y lat aumenta hacia arriba
  const y = ((latMax - lat) / (latMax - latMin)) * 100;

  return {
    x: Math.min(95, Math.max(5, x)),
    y: Math.min(95, Math.max(5, y)),
  };
}

export function RealtimeGPSPin({ empresaId, onUbicacionUpdate }: Props) {
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Suscribirse al canal Realtime de Supabase para la tabla Ubicacion
    // Filtramos por empresaId para aislamiento Multi-Tenant
    const channel = supabase
      .channel(`ubicaciones:${empresaId}`)
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "Ubicacion",
          filter: `empresaId=eq.${empresaId}`,
        },
        (payload) => {
          const nueva = payload.new as UbicacionPayload;
          onUbicacionUpdate(nueva);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.info(`[Realtime] Canal GPS activo para empresa ${empresaId}`);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
      }
    };
  }, [empresaId]);

  // Este componente no renderiza nada visual por sí solo
  // El padre recibe las coordenadas via onUbicacionUpdate
  return null;
}

// Hook conveniente para usar el GPS realtime directamente
export function useRealtimeGPS(empresaId: string) {
  const [ubicacion, setUbicacion] = useState<UbicacionPayload | null>(null);
  const [pinPos, setPinPos] = useState<{ x: number; y: number } | null>(null);
  const [conectado, setConectado] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!empresaId) return;

    const channel = supabase
      .channel(`ubicaciones:${empresaId}`)
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "Ubicacion",
          filter: `empresaId=eq.${empresaId}`,
        },
        (payload) => {
          const nueva = payload.new as UbicacionPayload;
          setUbicacion(nueva);
          setPinPos(gpsAporcentaje(nueva.lat, nueva.lng));
        }
      )
      .subscribe((status) => {
        setConectado(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [empresaId]);

  return { ubicacion, pinPos, conectado };
}
