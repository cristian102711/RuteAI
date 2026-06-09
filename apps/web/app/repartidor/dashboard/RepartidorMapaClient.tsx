/// <reference types="google.maps" />
"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { Navigation, Package, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";

const MAP_ID = "repartidor-map";

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#09090b" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#09090b" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#27272a" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#18181b" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#27272a" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#27272a" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#3f3f46" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#020617" }] },
];

const ESTADO_CONFIG = {
  pendiente:  { color: "#a855f7", label: "Pendiente",  Icon: Clock },
  en_ruta:    { color: "#f59e0b", label: "En ruta",    Icon: Navigation },
  entregado:  { color: "#10b981", label: "Entregado",  Icon: CheckCircle2 },
  fallido:    { color: "#ef4444", label: "Fallido",    Icon: XCircle },
} as const;

type EstadoPedido = keyof typeof ESTADO_CONFIG;

interface Pedido {
  id: string;
  nombreCliente: string;
  direccion: string;
  estado: string;
  lat: number | null;
  lng: number | null;
  producto: string;
  horarioPreferido: string | null;
}

function FitBounds({ points }: { points: google.maps.LatLngLiteral[] }) {
  const map = useMap(MAP_ID);
  const fitted = useRef(false);

  useEffect(() => {
    if (!map || points.length === 0 || fitted.current) return;
    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(14);
    } else {
      const bounds = new google.maps.LatLngBounds();
      points.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 80);
    }
    fitted.current = true;
  }, [map, points]);

  return null;
}

function PedidoMarkers({
  pedidos,
  selected,
  onSelect,
}: {
  pedidos: Pedido[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const coreLib = useMapsLibrary("core");
  if (!coreLib) return null;

  return (
    <>
      {pedidos.map((pedido, index) => {
        if (!pedido.lat || !pedido.lng) return null;
        const cfg = ESTADO_CONFIG[(pedido.estado as EstadoPedido) ?? "pendiente"] ?? ESTADO_CONFIG.pendiente;
        const isSelected = selected === pedido.id;

        return (
          <div key={pedido.id}>
            <Marker
              position={{ lat: pedido.lat, lng: pedido.lng }}
              onClick={() => onSelect(isSelected ? null : pedido.id)}
              label={{ text: String(index + 1), color: "#ffffff", fontSize: "11px", fontWeight: "700" }}
              icon={{
                path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z",
                fillColor: cfg.color,
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: isSelected ? 2.5 : 1.5,
                scale: isSelected ? 1.2 : 1,
                labelOrigin: new google.maps.Point(0, -28),
              }}
            />
            {isSelected && (
              <InfoWindow
                position={{ lat: pedido.lat, lng: pedido.lng }}
                onCloseClick={() => onSelect(null)}
              >
                <div className="font-sans p-1 min-w-[160px]">
                  <div className="font-bold text-xs text-zinc-900">{pedido.nombreCliente}</div>
                  <div className="text-[10px] text-zinc-500 truncate max-w-[180px] mt-0.5">{pedido.direccion}</div>
                  {pedido.producto && (
                    <div className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">
                      <Package className="h-3 w-3" />{pedido.producto}
                    </div>
                  )}
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold" style={{ background: `${cfg.color}22`, color: cfg.color }}>
                    {cfg.label.toUpperCase()}
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${pedido.lat},${pedido.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
                  >
                    <Navigation className="h-3 w-3" /> Abrir en Maps
                  </a>
                </div>
              </InfoWindow>
            )}
          </div>
        );
      })}
    </>
  );
}

interface Props {
  pedidosIniciales: Pedido[];
  repartidorId: string;
}

export function RepartidorMapaClient({ pedidosIniciales, repartidorId }: Props) {
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosIniciales);
  const [selected, setSelected] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPedidos = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/pedidos?repartidorId=${repartidorId}`);
      if (res.ok) {
        const data = await res.json() as { data?: Pedido[] };
        if (data.data) {
          setPedidos(data.data);
          setLastUpdated(new Date());
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [repartidorId]);

  // Polling cada 30 segundos
  useEffect(() => {
    const id = setInterval(() => void fetchPedidos(), 30_000);
    return () => clearInterval(id);
  }, [fetchPedidos]);

  const paradas = useMemo(
    () => pedidos.filter((p): p is Pedido & { lat: number; lng: number } => p.lat != null && p.lng != null)
           .map((p) => ({ lat: p.lat, lng: p.lng })),
    [pedidos]
  );

  const mapCenter = useMemo(() => {
    if (paradas.length > 0) {
      return {
        lat: paradas.reduce((s, p) => s + p.lat, 0) / paradas.length,
        lng: paradas.reduce((s, p) => s + p.lng, 0) / paradas.length,
      };
    }
    return { lat: -33.4489, lng: -70.6693 };
  }, [paradas]);

  const stats = useMemo(() => ({
    pendiente: pedidos.filter(p => p.estado === "pendiente").length,
    en_ruta:   pedidos.filter(p => p.estado === "en_ruta").length,
    entregado: pedidos.filter(p => p.estado === "entregado").length,
    fallido:   pedidos.filter(p => p.estado === "fallido").length,
  }), [pedidos]);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-57px)]">

      {/* Mapa */}
      <div className="relative flex-1 min-h-[50vh] lg:min-h-0">
        {googleMapsApiKey ? (
          <APIProvider apiKey={googleMapsApiKey}>
            <Map
              id={MAP_ID}
              defaultCenter={mapCenter}
              defaultZoom={12}
              gestureHandling="greedy"
              disableDefaultUI={true}
              styles={DARK_MAP_STYLE}
              className="h-full w-full"
            >
              <FitBounds points={paradas} />
              <PedidoMarkers pedidos={pedidos} selected={selected} onSelect={setSelected} />
            </Map>
          </APIProvider>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-900 text-zinc-400 p-6 text-center">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-lg font-semibold text-white">Google Maps no configurado</h3>
            <p className="text-sm text-zinc-500 max-w-md mt-2">
              Falta <code className="bg-zinc-800 text-amber-500 px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_GOOGLE_MAPS_KEY</code> en las variables de entorno.
            </p>
          </div>
        )}

        {/* Leyenda de estados */}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 z-10">
          {(Object.entries(ESTADO_CONFIG) as [EstadoPedido, typeof ESTADO_CONFIG[EstadoPedido]][]).map(([estado, cfg]) => (
            <div
              key={estado}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur-md border"
              style={{ background: `${cfg.color}18`, color: cfg.color, borderColor: `${cfg.color}35` }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: cfg.color }} />
              {cfg.label}
              <span className="font-mono font-bold">{stats[estado]}</span>
            </div>
          ))}
        </div>

        {/* Actualización */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => void fetchPedidos()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium backdrop-blur-md border border-white/[0.06] bg-zinc-900/70 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
            {formatTime(lastUpdated)}
          </button>
        </div>
      </div>

      {/* Panel lateral de pedidos */}
      <aside className="w-full lg:w-[340px] shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-white/[0.04] bg-zinc-950">
        <div className="border-b border-white/[0.04] p-4">
          <div className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">Mis pedidos</div>
          <h2 className="mt-0.5 text-lg font-semibold text-white">{pedidos.length} asignados</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">Actualiza cada 30 s · toca para ver en mapa</p>
        </div>

        <ol className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {pedidos.length === 0 ? (
            <li className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-10 w-10 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">Sin pedidos asignados</p>
              <p className="text-xs text-zinc-600 mt-1">Tu encargado te asignará pedidos pronto</p>
            </li>
          ) : (
            pedidos.map((pedido, index) => {
              const cfg = ESTADO_CONFIG[(pedido.estado as EstadoPedido)] ?? ESTADO_CONFIG.pendiente;
              const isSelected = selected === pedido.id;
              const { Icon } = cfg;
              return (
                <li
                  key={pedido.id}
                  onClick={() => setSelected(isSelected ? null : pedido.id)}
                  className={`flex items-start gap-3 rounded-xl p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-white/[0.06] ring-1 ring-white/10"
                      : "hover:bg-white/[0.03]"
                  }`}
                >
                  <div
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                    style={{ background: cfg.color }}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-sm font-medium text-zinc-100">{pedido.nombreCliente}</span>
                      <span
                        className="shrink-0 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold"
                        style={{ background: `${cfg.color}22`, color: cfg.color }}
                      >
                        <Icon className="h-2.5 w-2.5" />
                        {cfg.label.toUpperCase()}
                      </span>
                    </div>
                    <div className="truncate text-xs text-zinc-500 mt-0.5">{pedido.direccion}</div>
                    {pedido.horarioPreferido && (
                      <div className="text-[10px] text-zinc-600 mt-0.5 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" /> {pedido.horarioPreferido}
                      </div>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ol>
      </aside>
    </div>
  );
}
