/// <reference types="google.maps" />
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Layers, Maximize2, Navigation, Sparkles, Wifi, Play, Square, Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRealtimeGPS } from "../components/RealtimeGPSPin";
import { APIProvider, Map, Marker, InfoWindow, useMap } from "@vis.gl/react-google-maps";

const MAP_ID = "rutas-admin-map";

// Ícono de camión (SVG data URL) para representar a cada repartidor en el mapa.
const TRUCK_ICON =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">` +
      `<circle cx="20" cy="20" r="15" fill="#0ea5e9" stroke="#ffffff" stroke-width="2.5"/>` +
      `<text x="20" y="27" font-size="17" text-anchor="middle">🚚</text>` +
      `</svg>`
  );

// Dibuja la ruta optimizada por la IA como polyline con flechas de sentido.
function RutaPolyline({ path }: { path: { lat: number; lng: number }[] }) {
  const map = useMap(MAP_ID);
  const ref = useRef<google.maps.Polyline | null>(null);
  useEffect(() => {
    if (!map) return;
    ref.current?.setMap(null);
    if (path.length < 2) return;
    ref.current = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#a855f7",
      strokeOpacity: 0.9,
      strokeWeight: 4,
      icons: [
        {
          icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, strokeColor: "#a855f7" },
          offset: "50%",
          repeat: "120px",
        },
      ],
    });
    ref.current.setMap(map);
    return () => ref.current?.setMap(null);
  }, [map, path]);
  return null;
}

interface Pedido {
  id: string;
  nombreCliente: string;
  direccion: string;
  estado: string;
  lat: number | null;
  lng: number | null;
  createdAt: Date;
}

interface UbicacionConRepartidor {
  id: string;
  lat: number;
  lng: number;
  repartidorId: string;
  timestamp: Date;
  repartidor: { nombre: string };
}

interface Props {
  empresaId: string;
  empresaNombre: string;
  pedidos: Pedido[];
  ultimasUbicaciones: UbicacionConRepartidor[];
}

// Estilo oscuro personalizado para Google Maps (coincide con zinc-950)
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

export function RutasMapaClient({ empresaId, empresaNombre, pedidos, ultimasUbicaciones }: Props) {
  const { ubicacion, conectado } = useRealtimeGPS(empresaId);
  const [selectedPedido, setSelectedPedido] = useState<string | null>(null);

  // ── Tracking en vivo por POLLING (no depende de Supabase Realtime) ──────────
  // Refresca la última posición de cada repartidor cada ~1.8s. Funciona tanto en
  // local (Postgres local) como en prod, leyendo /api/ubicaciones.
  const [ubicaciones, setUbicaciones] = useState<UbicacionConRepartidor[]>(ultimasUbicaciones);
  const [simulando, setSimulando] = useState(false);
  const [rutaStops, setRutaStops] = useState<{ lat: number; lng: number }[]>([]);
  const [optimizando, setOptimizando] = useState(false);

  // Optimiza la ruta con IA (ai-service → Gemini, con fallback heurístico) y la
  // dibuja como polyline sobre el mapa.
  async function optimizarConIA() {
    setOptimizando(true);
    try {
      const res = await fetch("/api/rutas", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "No se pudo optimizar la ruta");
        return;
      }
      const stops = (json.data?.rutaOptimizada ?? []) as { lat: number; lng: number }[];
      setRutaStops(stops.map((s) => ({ lat: s.lat, lng: s.lng })));
      const r = json.data?.resumen;
      const extra = r ? ` · ~${r.duracionTotalMin} min · ${r.distanciaTotalKm} km` : "";
      const base = `Ruta optimizada · ${stops.length} paradas${extra}`;
      if ((r?.paradasEnRiesgo ?? 0) > 0) toast.warning(`${base} · ⚠ ${r!.paradasEnRiesgo} en riesgo SLA`);
      else toast.success(base);
    } catch {
      toast.error("Error al optimizar la ruta");
    } finally {
      setOptimizando(false);
    }
  }

  useEffect(() => {
    let cancelado = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/ubicaciones");
        const json = await res.json();
        if (!cancelado && Array.isArray(json.data)) setUbicaciones(json.data);
      } catch { /* silencioso */ }
    };
    tick();
    const id = setInterval(tick, 1800);
    return () => { cancelado = true; clearInterval(id); };
  }, []);

  // Simulación: mientras esté activa, avanza un paso a cada repartidor cada ~1.8s.
  useEffect(() => {
    if (!simulando) return;
    const id = setInterval(() => {
      fetch("/api/dev/simular-gps", { method: "POST" }).catch(() => {});
    }, 1800);
    return () => clearInterval(id);
  }, [simulando]);

  const enRuta = pedidos.filter(p => p.estado === "en_ruta");
  const pendientes = pedidos.filter(p => p.estado === "pendiente");

  // Calcular el centro del mapa en base a los pedidos o por defecto Santiago de Chile
  const mapCenter = useMemo(() => {
    const validPedidos = pedidos.filter(p => p.lat && p.lng);
    if (validPedidos.length > 0) {
      const latSum = validPedidos.reduce((sum, p) => sum + p.lat!, 0);
      const lngSum = validPedidos.reduce((sum, p) => sum + p.lng!, 0);
      return {
        lat: latSum / validPedidos.length,
        lng: lngSum / validPedidos.length
      };
    }
    // Coordenadas en vivo si hay señal GPS
    if (ubicacion) {
      return { lat: ubicacion.lat, lng: ubicacion.lng };
    }
    // Por defecto Santiago de Chile
    return { lat: -33.4489, lng: -70.6693 };
  }, [pedidos, ubicacion]);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 overflow-hidden">

      {/* Vista Principal - Mapa de Google */}
      <div className="relative flex-1">
        <div className="relative h-full w-full">
          {googleMapsApiKey ? (
            <APIProvider apiKey={googleMapsApiKey}>
              <Map
                id={MAP_ID}
                defaultCenter={mapCenter}
                defaultZoom={12}
                gestureHandling={"greedy"}
                disableDefaultUI={true}
                styles={DARK_MAP_STYLE}
                className="h-full w-full"
              >
                {/* Ruta optimizada por la IA (polyline) */}
                <RutaPolyline path={rutaStops} />

                {/* Marcadores de Pedidos */}
                {pedidos.map((pedido) => {
                  if (!pedido.lat || !pedido.lng) return null;
                  const isEnRuta = pedido.estado === "en_ruta";
                  const isSelected = selectedPedido === pedido.id;

                  return (
                    <div key={pedido.id}>
                      <Marker
                        position={{ lat: pedido.lat, lng: pedido.lng }}
                        onClick={() => setSelectedPedido(isSelected ? null : pedido.id)}
                        icon={{
                          path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z",
                          fillColor: isEnRuta ? "#f59e0b" : "#10b981",
                          fillOpacity: 1,
                          strokeColor: "#ffffff",
                          strokeWeight: 1.5,
                          scale: 1
                        }}
                      />
                      {isSelected && (
                        <InfoWindow
                          position={{ lat: pedido.lat, lng: pedido.lng }}
                          onCloseClick={() => setSelectedPedido(null)}
                        >
                          <div className="text-zinc-950 p-1 font-sans">
                            <div className="font-bold text-xs">{pedido.nombreCliente}</div>
                            <div className="text-[10px] text-zinc-600 truncate max-w-[150px]">{pedido.direccion}</div>
                            <div className="mt-1 text-[9px] font-semibold text-zinc-500 uppercase">
                              Estado: <span className={isEnRuta ? "text-amber-600" : "text-emerald-600"}>{pedido.estado}</span>
                            </div>
                          </div>
                        </InfoWindow>
                      )}
                    </div>
                  );
                })}

                {/* Pin GPS en Vivo del Repartidor (Realtime) */}
                {ubicacion && (
                  <Marker
                    position={{ lat: ubicacion.lat, lng: ubicacion.lng }}
                    icon={{
                      path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z",
                      fillColor: "#3b82f6",
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 2,
                      scale: 1.2
                    }}
                  />
                )}

                {/* Camiones de repartidores EN VIVO (polling /api/ubicaciones) */}
                {ubicaciones.map((ub) => (
                  <Marker
                    key={ub.repartidorId}
                    position={{ lat: ub.lat, lng: ub.lng }}
                    title={ub.repartidor?.nombre ?? "Repartidor"}
                    icon={{ url: TRUCK_ICON }}
                  />
                ))}
              </Map>
            </APIProvider>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-900 text-zinc-400 p-6 text-center">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-lg font-semibold text-white">Google Maps no configurado</h3>
              <p className="text-sm text-zinc-500 max-w-md mt-2">
                Falta la variable de entorno <code className="bg-zinc-800 text-amber-500 px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_GOOGLE_MAPS_KEY</code>.
                Agrega la API Key en tu archivo <code className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded text-xs">.env</code> para activar el mapa interactivo.
              </p>
            </div>
          )}

          {/* Botones de Control */}
          <div className="absolute left-4 top-4 flex flex-col gap-2 z-10">
            {[Layers, Maximize2, Navigation].map((Icon, i) => (
              <button
                key={i}
                className="grid h-9 w-9 place-items-center rounded-md bg-white/5 backdrop-blur-md text-white hover:bg-white/10 transition-colors border border-white/[0.04]"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          {/* Toggle de simulación de movimiento (demo) */}
          <button
            onClick={() => setSimulando((s) => !s)}
            className={`absolute left-4 top-36 z-10 inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold backdrop-blur-md border transition-colors ${
              simulando
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-white/5 text-zinc-300 border-white/[0.04] hover:bg-white/10"
            }`}
            title="Mueve los camiones hacia sus pedidos asignados (demo local)"
          >
            {simulando ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {simulando ? "Detener simulación" : "Simular movimiento"}
          </button>

          {/* Optimizar ruta con IA (Gemini → fallback heurístico) */}
          <button
            onClick={optimizarConIA}
            disabled={optimizando}
            className="absolute left-4 top-48 z-10 inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-purple-500 to-purple-400 px-3 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:opacity-90 transition-opacity disabled:opacity-60"
            title="La IA ordena las paradas para el mejor camino y dibuja la ruta"
          >
            {optimizando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {optimizando ? "Optimizando…" : "Optimizar con IA"}
          </button>

          {/* Indicador de estado del tracking (polling siempre activo) */}
          <div className="absolute top-4 right-4 z-10">
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur border ${
              simulando
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : conectado
                  ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                  : "bg-zinc-800/80 text-zinc-400 border-white/[0.04]"
            }`}>
              {simulando
                ? <><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Simulando movimiento</>
                : <><Wifi className="h-3 w-3" /> GPS en vivo · {ubicaciones.length}</>}
            </div>
          </div>

          {/* Barra inferior con métricas */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl bg-zinc-900/70 backdrop-blur-lg border border-white/[0.04] px-4 py-2.5 text-xs z-10">
            <div className="flex items-center gap-5">
              <span className="text-zinc-400">
                En ruta: <span className="font-mono text-amber-400 font-semibold">{enRuta.length}</span>
              </span>
              <span className="text-zinc-400">
                Pendientes: <span className="font-mono text-white">{pendientes.length}</span>
              </span>
              <span className="text-zinc-400">
                Total: <span className="font-mono text-white">{pedidos.length}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-zinc-400">
                <Truck className="h-3 w-3 text-sky-400" />
                Repartidores: <span className="font-mono text-sky-400 font-semibold">{ubicaciones.length}</span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded bg-purple-500/15 px-2 py-0.5 font-semibold text-purple-400 ring-1 ring-inset ring-purple-500/20">
              <Sparkles className="h-3 w-3" /> IA Activa · RF-04
            </span>
          </div>
        </div>
      </div>


      {/* Sidebar Derecha — Lista de pedidos activos */}
      <aside className="hidden w-[360px] shrink-0 flex-col border-l border-white/[0.04] bg-zinc-950/20 backdrop-blur-xl lg:flex z-10">
        <div className="border-b border-white/[0.04] p-5">
          <div className="text-xs uppercase tracking-widest text-amber-500 font-bold">Ruta activa</div>
          <h2 className="mt-1 text-xl font-semibold text-white">{empresaNombre}</h2>
          <p className="mt-1 text-xs text-zinc-400">{pedidos.length} paradas · Datos en tiempo real</p>
        </div>

        <ol className="flex-1 overflow-y-auto p-3 space-y-1">
          {pedidos.length === 0 ? (
            <li className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-3xl mb-3">📦</div>
              <p className="text-sm text-zinc-500">No hay pedidos activos</p>
              <p className="text-xs text-zinc-600 mt-1">Los pedidos en ruta aparecerán aquí</p>
            </li>
          ) : pedidos.map((pedido, index) => {
            const isEnRuta = pedido.estado === "en_ruta";
            const isSelected = selectedPedido === pedido.id;

            return (
              <li
                key={pedido.id}
                onClick={() => setSelectedPedido(isSelected ? null : pedido.id)}
                className={`relative flex gap-3 rounded-lg p-3 cursor-pointer transition-colors ${
                  isSelected ? "bg-white/[0.06] ring-1 ring-white/10" : "hover:bg-white/[0.03]"
                }`}
              >
                {index !== pedidos.length - 1 && (
                  <div className="absolute left-[1.85rem] top-10 bottom-0 w-px bg-white/[0.04]" />
                )}

                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold z-10 ${
                  isEnRuta
                    ? "bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    : "bg-white/5 text-zinc-500 ring-1 ring-inset ring-white/10"
                }`}>
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <div className="truncate text-sm font-medium text-white">{pedido.nombreCliente}</div>
                    {isEnRuta && (
                      <span className="shrink-0 ml-2 inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 ring-1 ring-inset ring-amber-500/20">
                        EN RUTA
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs text-zinc-400 mt-0.5">{pedido.direccion}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
