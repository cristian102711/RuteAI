"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Para solucionar problema de iconos default en react-leaflet con webpack/next
import L from "leaflet";
const iconRepartidor = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
// Icono distinto para la empresa
const iconBodega = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapaTracking({ pedidos }: { pedidos: any[] }) {
  const [mounted, setMounted] = useState(false);
  const [rutaCoords, setRutaCoords] = useState<[number, number][]>([]);

  // Centro inicial (Santiago)
  const defaultCenter: [number, number] = [-33.4489, -70.6693];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lógica de Ruteo Inteligente (OSRM)
  useEffect(() => {
    if (!mounted || pedidos.length === 0) {
      setRutaCoords([]);
      return;
    }

    const obtenerRuta = async () => {
      // 1. Ordenar pedidos por cercanía básica (Greedy/Nearest Neighbor simple para demo)
      const puntos = pedidos
        .filter(p => p.latitud && p.longitud)
        .sort((a, b) => {
          const distA = Math.sqrt(Math.pow(a.latitud! - defaultCenter[0], 2) + Math.pow(a.longitud! - defaultCenter[1], 2));
          const distB = Math.sqrt(Math.pow(b.latitud! - defaultCenter[0], 2) + Math.pow(b.longitud! - defaultCenter[1], 2));
          return distA - distB;
        });

      if (puntos.length === 0) return;

      // 2. Construir URL de OSRM (Bodega -> Puntos en orden)
      const coordsString = [
        `${defaultCenter[1]},${defaultCenter[0]}`, // Bodega
        ...puntos.map(p => `${p.longitud},${p.latitud}`)
      ].join(';');

      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`);
        const data = await res.json();
        
        if (data.routes && data.routes[0]) {
          const geometry = data.routes[0].geometry.coordinates;
          const mapCoords = geometry.map((c: any) => [c[1], c[0]] as [number, number]);
          setRutaCoords(mapCoords);
        }
      } catch (err) {
        console.error("OSRM Error:", err);
      }
    };

    obtenerRuta();
  }, [pedidos, mounted]);

  if (!mounted) return <div className="w-full h-full min-h-[500px] bg-zinc-900 animate-pulse rounded-2xl flex items-center justify-center text-zinc-600">Cargando inteligencia espacial...</div>;

  const pedidosActivosCount = pedidos.filter(p => p.estado === "pendiente" || p.estado === "en_ruta").length;

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden shadow-xl border border-zinc-800 z-0 relative group">
      <MapContainer 
        center={defaultCenter as any} 
        zoom={12} 
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">Carto</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Línea de Ruta Optimizada */}
        {rutaCoords.length > 0 && (
          <Polyline 
            positions={rutaCoords} 
            color="#10b981" 
            weight={4} 
            opacity={0.6} 
            dashArray="10, 10"
          />
        )}

        {/* Marcador de Bodega (Centro) */}
        <Marker position={defaultCenter as any} icon={iconBodega}>
          <Popup className="text-black font-bold">Centro de Distribución RouteAI</Popup>
        </Marker>

        {/* Marcadores de Pedidos Reales */}
        {pedidos.map((pedido) => (
          pedido.latitud && pedido.longitud && (
            <Marker 
              key={pedido.id} 
              position={[pedido.latitud, pedido.longitud] as any} 
              icon={iconRepartidor}
            >
              <Popup className="text-black">
                <div className="font-bold text-sm uppercase">{pedido.producto}</div>
                <div className="text-xs text-zinc-600">{pedido.direccion}</div>
                <div className={`text-[10px] font-bold mt-1 ${pedido.estado === 'entregado' ? 'text-emerald-500' : 'text-orange-500'}`}>
                  Estado: {pedido.estado.toUpperCase()}
                </div>
                {(pedido.scoreRiesgo ?? 0) > 70 && (
                  <div className="text-[10px] text-red-600 font-bold mt-1">⚠️ ALTO RIESGO ({pedido.scoreRiesgo}%)</div>
                )}
              </Popup>
            </Marker>
          )
        ))}
        
      </MapContainer>
      
      {/* Overlay Premium DINÁMICO */}
      <div className="absolute top-4 right-4 z-[400] bg-zinc-950/80 backdrop-blur-md border border-zinc-800 p-4 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
         <div className="text-sm font-black text-emerald-400 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 relative"></span>
            GPS ROUTE-AI ACTIVO
         </div>
         <p className="text-xs text-zinc-400 mt-2">Monitoreo basado en datos reales</p>
         <div className="mt-3 grid grid-cols-2 gap-2 border-t border-zinc-800 pt-3">
            <div className="text-center">
               <p className="text-[10px] text-zinc-500 uppercase">En Curso</p>
               <p className="text-lg font-bold text-white">{pedidosActivosCount}</p>
            </div>
            <div className="text-center">
               <p className="text-[10px] text-zinc-500 uppercase">Alertas</p>
               <p className="text-lg font-bold text-red-400">{pedidos.filter(p => (p.scoreRiesgo ?? 0) > 70).length}</p>
            </div>
         </div>
      </div>
    </div>
  );
}
