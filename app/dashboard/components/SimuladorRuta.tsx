"use client";

import { useState } from "react";
import { Play, Square } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import type { Parada } from "./MapaRutas";

export function SimuladorRuta({
  empresaId,
  paradas,
}: {
  empresaId: string;
  paradas: Parada[];
}) {
  const [simulando, setSimulando] = useState(false);

  const iniciarSimulacion = async () => {
    if (paradas.length < 2) {
      alert("Necesitas al menos 2 paradas para simular una ruta.");
      return;
    }

    setSimulando(true);
    const supabase = createClient();
    const channel = supabase.channel(`tracking_${empresaId}`);

    // Nos suscribimos para poder emitir el broadcast
    await new Promise((resolve) => channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve(true);
    }));

    let puntoActual = 0;
    const totalPuntos = paradas.length;

    // Función auxiliar para interpolar entre dos puntos y simular movimiento fluido
    const simularTramo = async (origen: Parada, destino: Parada) => {
      const pasos = 20; // cantidad de "saltos" entre puntos
      for (let i = 1; i <= pasos; i++) {
        if (!window.simulacionActiva) break;
        
        const fraction = i / pasos;
        const lat = origen.lat + (destino.lat - origen.lat) * fraction;
        const lng = origen.lng + (destino.lng - origen.lng) * fraction;

        await channel.send({
          type: "broadcast",
          event: "location_update",
          payload: { lat, lng },
        });

        // Esperar 400ms por paso para que sea visualmente agradable
        await new Promise((r) => setTimeout(r, 400));
      }
    };

    // Iniciar el viaje ficticio
    window.simulacionActiva = true;

    // Partimos emitiendo el punto inicial exacto
    await channel.send({
      type: "broadcast",
      event: "location_update",
      payload: { lat: paradas[0].lat, lng: paradas[0].lng },
    });
    
    // Iteramos por las paradas moviéndonos hacia adelante
    for (let i = 0; i < totalPuntos - 1; i++) {
      if (!window.simulacionActiva) break;
      await simularTramo(paradas[i], paradas[i + 1]);
    }

    setSimulando(false);
    window.simulacionActiva = false;
    supabase.removeChannel(channel);
  };

  const detenerSimulacion = () => {
    window.simulacionActiva = false;
    setSimulando(false);
  };

  return (
    <div className="absolute top-4 right-4 z-50">
      {!simulando ? (
        <button
          onClick={iniciarSimulacion}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-all group active:scale-95"
        >
          <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-sm">Simular GPS en vivo</span>
        </button>
      ) : (
        <button
          onClick={detenerSimulacion}
          className="flex items-center gap-2 bg-rose-500 hover:bg-rose-400 text-white font-bold px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all group active:scale-95"
        >
          <Square className="w-4 h-4 animate-pulse" />
          <span className="text-sm">Detener Transporte</span>
        </button>
      )}
    </div>
  );
}

// Extensión temporal del DOM Window para detener la simulación
declare global {
  interface Window {
    simulacionActiva: boolean;
  }
}
