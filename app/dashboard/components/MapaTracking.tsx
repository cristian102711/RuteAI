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

  // Puntos fijos para la demostración
  const posBodega: [number, number] = [-33.4489, -70.6693]; // Santiago Centro
  const posDestino: [number, number] = [-33.4200, -70.6000]; // Providencia

  useEffect(() => {
    setMounted(true);
    
    // Obtener la ruta usando la API gratuita de OSRM (OpenStreetMap)
    async function fetchRuta() {
      try {
        // OSRM usa longitud,latitud
        const p1 = `${posBodega[1]},${posBodega[0]}`;
        const p2 = `${posDestino[1]},${posDestino[0]}`;
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${p1};${p2}?overview=full&geometries=geojson`);
        const data = await res.json();
        
        if (data.routes && data.routes.length > 0) {
          // Extraemos los puntos de la línea y los invertimos porque Leaflet usa [lat, lon]
          const coords = data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
          setRutaCoords(coords);
        }
      } catch (error) {
        console.error("Error al cargar la ruta", error);
      }
    }
    fetchRuta();
  }, []);

  if (!mounted) return <div className="w-full h-full min-h-[500px] bg-zinc-900 animate-pulse rounded-2xl flex items-center justify-center text-zinc-600">Cargando inteligencia espacial...</div>;

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden shadow-xl border border-zinc-800 z-0 relative group">
      <MapContainer 
        center={posBodega as any} 
        zoom={13} 
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">Carto</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Marcador Bodega (Punto A) */}
        <Marker position={posBodega as any} icon={iconBodega}>
          <Popup className="text-black font-bold">Bodega Central RouteAI (Origen)</Popup>
        </Marker>

        {/* Marcador Repartidor (Punto B) */}
        <Marker position={posDestino as any} icon={iconRepartidor}>
          <Popup className="text-black">
            <div className="font-bold text-black text-sm">🚚 Repartidor Carlos</div>
            <div className="text-xs text-zinc-700">En ruta: Av. Providencia 123</div>
            <div className="text-xs text-emerald-600 font-bold mt-1">En tiempo (ETA: 12 min)</div>
          </Popup>
        </Marker>

        {/* Línea de Ruta Trazada */}
        {rutaCoords.length > 0 && (
          <Polyline 
            positions={rutaCoords as any} 
            color="#10b981" // emerald-500
            weight={4} 
            opacity={0.8}
            dashArray="10, 10" // línea punteada
          />
        )}
      </MapContainer>
      
      {/* Overlay Premium estilo Cyberpunk/Moderno */}
      <div className="absolute top-4 right-4 z-[400] bg-zinc-950/80 backdrop-blur-md border border-zinc-800 p-4 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
         <div className="text-sm font-black text-emerald-400 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 relative"></span>
            GPS ROUTE-AI ACTIVO
         </div>
         <p className="text-xs text-zinc-400 mt-2">Monitoreo anti-fallos encendido</p>
         <div className="mt-3 grid grid-cols-2 gap-2 border-t border-zinc-800 pt-3">
            <div className="text-center">
              <p className="text-[10px] text-zinc-500 uppercase">Activos</p>
              <p className="text-lg font-bold text-white">1</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-zinc-500 uppercase">Desvíos</p>
              <p className="text-lg font-bold text-emerald-400">0</p>
            </div>
         </div>
      </div>
    </div>
  );
}
