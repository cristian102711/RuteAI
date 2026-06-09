/// <reference types="google.maps" />
"use client";

import {
  useState, useCallback, useEffect, useMemo, useRef,
} from "react";
import Link from "next/link";
import {
  Map as MapIcon, Package, User, Settings, Truck, LogOut,
  RefreshCw, Clock, Navigation, CheckCircle2, XCircle,
  Phone, MapPin, Route, Building2, TrendingUp,
  Layers, Plus, Minus, Maximize2, Sparkles, AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import {
  APIProvider, Map, Marker, InfoWindow, useMap, useMapsLibrary,
} from "@vis.gl/react-google-maps";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Pedido {
  id: string;
  nombreCliente: string;
  clienteTelefono?: string | null;
  direccion: string;
  estado: string;
  lat: number | null;
  lng: number | null;
  producto: string;
  horarioPreferido?: string | null;
  scoreRiesgo?: number | null;
}

interface UsuarioInfo {
  id: string;
  nombre: string;
  email: string;
  vehiculo?: string | null;
  telefono?: string | null;
  empresaNombre?: string | null;
}

type TabId = "mapa" | "pedidos" | "perfil" | "ajustes";

// ─── Constants ───────────────────────────────────────────────────────────────

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#09090b" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#71717a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#09090b" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#27272a" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#18181b" }] },
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#27272a" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#27272a" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#3f3f46" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#020617" }] },
];

const ESTADO_CONFIG: Record<string, { color: string; label: string; Icon: LucideIcon }> = {
  pendiente: { color: "#a855f7", label: "Pendiente",  Icon: Clock },
  en_ruta:   { color: "#f59e0b", label: "En ruta",    Icon: Navigation },
  entregado: { color: "#10b981", label: "Entregado",  Icon: CheckCircle2 },
  fallido:   { color: "#ef4444", label: "Fallido",    Icon: XCircle },
};

const MAP_ID = "repartidor-app-map";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function euclidean(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  return Math.sqrt((a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2);
}

/** Greedy nearest-neighbor ordering from a start point */
function greedyOrder<T extends { lat: number; lng: number }>(
  start: { lat: number; lng: number },
  stops: T[]
): T[] {
  const remaining = [...stops];
  const ordered: T[] = [];
  let current = start;
  while (remaining.length > 0) {
    let ci = 0, cd = Infinity;
    remaining.forEach((r, i) => { const d = euclidean(current, r); if (d < cd) { cd = d; ci = i; } });
    ordered.push(remaining[ci]);
    current = remaining[ci];
    remaining.splice(ci, 1);
  }
  return ordered;
}

function riskColor(score: number): string {
  if (score >= 0.7) return "#ef4444";
  if (score >= 0.4) return "#f59e0b";
  return "#10b981";
}
function riskLabel(score: number): string {
  if (score >= 0.7) return "Alto";
  if (score >= 0.4) return "Medio";
  return "Bajo";
}

// ─── Map sub-components ──────────────────────────────────────────────────────

function FitBounds({ points }: { points: google.maps.LatLngLiteral[] }) {
  const map = useMap(MAP_ID);
  const fitted = useRef(false);
  useEffect(() => {
    if (!map || points.length === 0 || fitted.current) return;
    if (points.length === 1) { map.setCenter(points[0]); map.setZoom(14); }
    else { const b = new google.maps.LatLngBounds(); points.forEach(p => b.extend(p)); map.fitBounds(b, 80); }
    fitted.current = true;
  }, [map, points]);
  return null;
}

function MapControls({ points }: { points: google.maps.LatLngLiteral[] }) {
  const map = useMap(MAP_ID);
  const [sat, setSat] = useState(false);
  const BTNS: { Icon: LucideIcon; fn: () => void; title: string }[] = [
    { Icon: Plus,       fn: () => map?.setZoom((map.getZoom() ?? 12) + 1), title: "Acercar" },
    { Icon: Minus,      fn: () => map?.setZoom((map.getZoom() ?? 12) - 1), title: "Alejar" },
    { Icon: Navigation, fn: () => { if (!map || !points.length) return; const b = new google.maps.LatLngBounds(); points.forEach(p => b.extend(p)); map.fitBounds(b, 80); }, title: "Centrar" },
    { Icon: Layers,     fn: () => { const n = !sat; setSat(n); map?.setMapTypeId(n ? "hybrid" : "roadmap"); }, title: "Capa" },
    { Icon: Maximize2,  fn: () => { const el = map?.getDiv()?.parentElement; if (!el) return; document.fullscreenElement ? void document.exitFullscreen() : void el.requestFullscreen?.(); }, title: "Full" },
  ];
  return (
    <div className="absolute left-3 top-3 flex flex-col gap-2 z-10">
      {BTNS.map(({ Icon, fn, title }) => (
        <button key={title} onClick={fn} title={title}
          className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-950/80 backdrop-blur border border-white/[0.06] text-zinc-400 hover:text-white active:scale-95 transition-all shadow-lg">
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

/** Draws a greedy route polyline connecting pendiente+en_ruta stops */
function RoutePolyline({
  pedidos, userPos,
}: { pedidos: Pedido[]; userPos: google.maps.LatLngLiteral | null }) {
  const map = useMap(MAP_ID);
  const polyRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;
    const active = pedidos.filter(
      (p): p is Pedido & { lat: number; lng: number } =>
        (p.estado === "pendiente" || p.estado === "en_ruta") && p.lat != null && p.lng != null
    );
    if (active.length < 2 && !(active.length >= 1 && userPos)) {
      polyRef.current?.setMap(null);
      return;
    }
    const start = userPos ?? { lat: active[0].lat, lng: active[0].lng };
    const stopsToOrder = userPos
      ? active.map(p => ({ lat: p.lat, lng: p.lng }))
      : active.slice(1).map(p => ({ lat: p.lat, lng: p.lng }));

    const ordered = greedyOrder(start, stopsToOrder);
    const path: google.maps.LatLngLiteral[] = userPos
      ? [start, ...ordered]
      : [{ lat: active[0].lat, lng: active[0].lng }, ...ordered];

    polyRef.current?.setMap(null);
    polyRef.current = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#a855f7",
      strokeOpacity: 0.75,
      strokeWeight: 3,
      icons: [
        {
          icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, strokeColor: "#a855f7", fillColor: "#a855f7", fillOpacity: 1 },
          offset: "50%",
          repeat: "90px",
        },
      ],
    });
    polyRef.current.setMap(map);
    return () => { polyRef.current?.setMap(null); };
  }, [map, pedidos, userPos]);

  return null;
}

/** Shows a truck icon at the repartidor's real GPS position */
function TruckMarker({ pos }: { pos: google.maps.LatLngLiteral }) {
  const coreLib = useMapsLibrary("core");
  if (!coreLib) return null;
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">` +
    `<circle cx="24" cy="24" r="22" fill="#0ea5e9" stroke="white" stroke-width="3"/>` +
    `<text x="24" y="32" font-size="22" text-anchor="middle" fill="white">🚛</text>` +
    `</svg>`
  );
  return (
    <Marker
      position={pos}
      title="Mi ubicación actual"
      icon={{
        url: `data:image/svg+xml;charset=UTF-8,${svg}`,
        scaledSize: new google.maps.Size(48, 48),
        anchor: new google.maps.Point(24, 24),
      }}
    />
  );
}

function PedidoMarkers({
  pedidos, selected, onSelect,
}: { pedidos: Pedido[]; selected: string | null; onSelect: (id: string | null) => void }) {
  const coreLib = useMapsLibrary("core");
  if (!coreLib) return null;
  return (
    <>
      {pedidos.map((pedido, i) => {
        if (!pedido.lat || !pedido.lng) return null;
        const cfg = ESTADO_CONFIG[pedido.estado] ?? ESTADO_CONFIG.pendiente;
        const isSel = selected === pedido.id;
        return (
          <div key={pedido.id}>
            <Marker
              position={{ lat: pedido.lat, lng: pedido.lng }}
              onClick={() => onSelect(isSel ? null : pedido.id)}
              label={{ text: String(i + 1), color: "#fff", fontSize: "11px", fontWeight: "700" }}
              icon={{
                path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z",
                fillColor: cfg.color, fillOpacity: 1,
                strokeColor: "#fff", strokeWeight: isSel ? 2.5 : 1.5,
                scale: isSel ? 1.3 : 1,
                labelOrigin: new google.maps.Point(0, -28),
              }}
            />
            {isSel && (
              <InfoWindow position={{ lat: pedido.lat, lng: pedido.lng }} onCloseClick={() => onSelect(null)}>
                <div className="font-sans p-1.5 min-w-[170px] space-y-2">
                  {/* Header */}
                  <div>
                    <p className="font-bold text-xs text-zinc-900 leading-tight">{pedido.nombreCliente}</p>
                    <p className="text-[10px] text-zinc-500 truncate max-w-[190px] mt-0.5">{pedido.direccion}</p>
                  </div>

                  {/* Estado + producto */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold"
                      style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}35` }}>
                      {cfg.label.toUpperCase()}
                    </span>
                    {pedido.producto && (
                      <span className="text-[10px] text-zinc-500">📦 {pedido.producto}</span>
                    )}
                  </div>

                  {/* Riesgo IA */}
                  {pedido.scoreRiesgo != null && (
                    <div className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Riesgo IA</span>
                        <span className="text-[10px] font-bold" style={{ color: riskColor(pedido.scoreRiesgo) }}>
                          {riskLabel(pedido.scoreRiesgo)} · {Math.round(pedido.scoreRiesgo * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${Math.round(pedido.scoreRiesgo * 100)}%`, background: riskColor(pedido.scoreRiesgo) }} />
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex flex-col gap-1">
                    {pedido.clienteTelefono && (
                      <a href={`tel:${pedido.clienteTelefono}`}
                        className="flex items-center gap-1.5 text-[10px] font-medium text-blue-600 hover:underline">
                        📞 {pedido.clienteTelefono}
                      </a>
                    )}
                    <a href={`https://maps.google.com/?q=${pedido.lat},${pedido.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[10px] font-medium text-purple-600 hover:underline">
                      🗺️ Abrir en Google Maps
                    </a>
                  </div>
                </div>
              </InfoWindow>
            )}
          </div>
        );
      })}
    </>
  );
}

// ─── TAB: Mapa ───────────────────────────────────────────────────────────────

function MapaTab({ pedidos, onRefresh, lastUpdated, isRefreshing }: {
  pedidos: Pedido[];
  onRefresh: () => void;
  lastUpdated: Date;
  isRefreshing: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<google.maps.LatLngLiteral | null>(null);
  const [gpsOk, setGpsOk] = useState<boolean | null>(null);
  // ─ Fix hydration: time string solo se popula en el cliente ─
  const [timeStr, setTimeStr] = useState("—");

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

  useEffect(() => {
    setTimeStr(lastUpdated.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }));
  }, [lastUpdated]);

  // GPS watch
  useEffect(() => {
    if (!navigator.geolocation) { setGpsOk(false); return; }
    const id = navigator.geolocation.watchPosition(
      pos => { setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsOk(true); },
      () => setGpsOk(false),
      { enableHighAccuracy: true, maximumAge: 15_000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const paradas = useMemo(
    () => pedidos.filter((p): p is Pedido & { lat: number; lng: number } => p.lat != null && p.lng != null)
      .map(p => ({ lat: p.lat, lng: p.lng })),
    [pedidos]
  );

  const mapCenter = useMemo(() => {
    if (userPos) return userPos;
    if (paradas.length === 0) return { lat: -33.4489, lng: -70.6693 };
    return { lat: paradas.reduce((s, p) => s + p.lat, 0) / paradas.length, lng: paradas.reduce((s, p) => s + p.lng, 0) / paradas.length };
  }, [userPos, paradas]);

  const stats = useMemo(() => ({
    pendiente: pedidos.filter(p => p.estado === "pendiente").length,
    en_ruta:   pedidos.filter(p => p.estado === "en_ruta").length,
    entregado: pedidos.filter(p => p.estado === "entregado").length,
    fallido:   pedidos.filter(p => p.estado === "fallido").length,
  }), [pedidos]);

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <div className="text-5xl">🗺️</div>
        <h3 className="text-white font-semibold">Mapa no configurado</h3>
        <p className="text-xs text-zinc-500">
          Agrega <code className="bg-zinc-800 text-amber-400 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_KEY</code> al .env para activar el mapa.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <APIProvider apiKey={apiKey}>
        <Map id={MAP_ID} defaultCenter={mapCenter} defaultZoom={12}
          gestureHandling="greedy" disableDefaultUI={true} styles={DARK_MAP_STYLE} className="h-full w-full">
          <FitBounds points={paradas} />
          <RoutePolyline pedidos={pedidos} userPos={userPos} />
          {userPos && <TruckMarker pos={userPos} />}
          <PedidoMarkers pedidos={pedidos} selected={selected} onSelect={setSelected} />
        </Map>
        <MapControls points={paradas} />
      </APIProvider>

      {/* Top-right controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
        {/* Refresh + hora */}
        <button onClick={onRefresh} disabled={isRefreshing}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium backdrop-blur-md border border-white/[0.06] bg-zinc-900/80 text-zinc-400 hover:text-white transition disabled:opacity-50">
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
          {timeStr}
        </button>

        {/* GPS indicator */}
        {gpsOk !== null && (
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium backdrop-blur-md border bg-zinc-900/80 ${gpsOk ? "border-sky-500/30 text-sky-400" : "border-zinc-700 text-zinc-500"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${gpsOk ? "bg-sky-400 animate-pulse" : "bg-zinc-600"}`} />
            {gpsOk ? "GPS activo" : "Sin GPS"}
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-2 rounded-2xl bg-zinc-900/85 backdrop-blur-xl border border-white/[0.05] px-4 py-2.5">
        <div className="flex items-center gap-3">
          {(["pendiente", "en_ruta", "entregado", "fallido"] as const).map(estado => {
            const cfg = ESTADO_CONFIG[estado];
            const count = stats[estado];
            if (count === 0) return null;
            return (
              <div key={estado} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ background: cfg.color }} />
                <span className="font-mono text-xs font-bold" style={{ color: cfg.color }}>{count}</span>
                <span className="text-[10px] text-zinc-500 hidden sm:inline">{cfg.label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-purple-400 font-semibold">
          <Sparkles className="h-3 w-3" /> {pedidos.length} pedidos
        </div>
      </div>
    </div>
  );
}

// ─── TAB: Pedidos ────────────────────────────────────────────────────────────

type FiltroEstado = "todos" | "pendiente" | "en_ruta" | "entregado" | "fallido";

function PedidosTab({ pedidos, onRefresh, isRefreshing }: {
  pedidos: Pedido[];
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const [filtro, setFiltro] = useState<FiltroEstado>("todos");

  const filtros: { id: FiltroEstado; label: string }[] = [
    { id: "todos",     label: "Todos" },
    { id: "pendiente", label: "Pendientes" },
    { id: "en_ruta",   label: "En ruta" },
    { id: "entregado", label: "Entregados" },
    { id: "fallido",   label: "Fallidos" },
  ];

  const pedidosFiltrados = useMemo(() =>
    filtro === "todos" ? pedidos : pedidos.filter(p => p.estado === filtro),
    [pedidos, filtro]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.04]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Mis pedidos</h2>
          <button onClick={onRefresh} disabled={isRefreshing}
            className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white transition disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filtros.map(f => {
            const count = f.id === "todos" ? pedidos.length : pedidos.filter(p => p.estado === f.id).length;
            const isActive = filtro === f.id;
            const cfg = f.id !== "todos" ? ESTADO_CONFIG[f.id] : null;
            return (
              <button key={f.id} onClick={() => setFiltro(f.id)}
                className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={isActive
                  ? { background: cfg ? `${cfg.color}25` : "rgba(255,255,255,0.1)", color: cfg ? cfg.color : "#fff", border: `1px solid ${cfg ? cfg.color + "40" : "rgba(255,255,255,0.15)"}` }
                  : { background: "rgba(255,255,255,0.03)", color: "#71717a", border: "1px solid rgba(255,255,255,0.06)" }
                }>
                {f.label}
                <span className="font-mono text-[10px] opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <ol className="flex-1 overflow-y-auto p-3 space-y-2">
        {pedidosFiltrados.length === 0 ? (
          <li className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="h-12 w-12 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-400 font-medium">Sin pedidos</p>
            <p className="text-xs text-zinc-600 mt-1">No hay pedidos con este filtro</p>
          </li>
        ) : (
          pedidosFiltrados.map((pedido, i) => {
            const cfg = ESTADO_CONFIG[pedido.estado] ?? ESTADO_CONFIG.pendiente;
            const { Icon } = cfg;
            return (
              <li key={pedido.id}>
                <div className="flex items-start gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 active:bg-white/[0.04] transition-colors">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                    style={{ background: cfg.color }}>
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-zinc-100 leading-tight">{pedido.nombreCliente}</span>
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold"
                        style={{ background: `${cfg.color}22`, color: cfg.color, border: `1px solid ${cfg.color}35` }}>
                        <Icon className="h-2.5 w-2.5" />
                        {cfg.label.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-start gap-1 mt-1.5">
                      <MapPin className="h-3 w-3 text-zinc-600 mt-0.5 shrink-0" />
                      <span className="text-xs text-zinc-400 leading-tight">{pedido.direccion}</span>
                    </div>
                    {pedido.producto && (
                      <div className="flex items-center gap-1 mt-1">
                        <Package className="h-3 w-3 text-zinc-600" />
                        <span className="text-xs text-zinc-500">{pedido.producto}</span>
                      </div>
                    )}
                    {pedido.horarioPreferido && (
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-zinc-600" />
                        <span className="text-xs text-zinc-500">{pedido.horarioPreferido}</span>
                      </div>
                    )}
                    {/* Risk score badge (solo si existe) */}
                    {pedido.scoreRiesgo != null && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <AlertTriangle className="h-3 w-3 shrink-0" style={{ color: riskColor(pedido.scoreRiesgo) }} />
                        <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.round(pedido.scoreRiesgo * 100)}%`, background: riskColor(pedido.scoreRiesgo) }} />
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: riskColor(pedido.scoreRiesgo) }}>
                          {riskLabel(pedido.scoreRiesgo)}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-3 mt-2">
                      {pedido.clienteTelefono && (
                        <a href={`tel:${pedido.clienteTelefono}`}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors">
                          <Phone className="h-3 w-3" />
                          {pedido.clienteTelefono}
                        </a>
                      )}
                      {pedido.lat && pedido.lng && (
                        <a href={`https://maps.google.com/?q=${pedido.lat},${pedido.lng}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-400 hover:text-purple-300 transition-colors">
                          <Navigation className="h-3 w-3" />
                          Navegar
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ol>
    </div>
  );
}

// ─── TAB: Perfil ─────────────────────────────────────────────────────────────

function PerfilTab({ usuario, pedidos }: { usuario: UsuarioInfo; pedidos: Pedido[] }) {
  const iniciales = usuario.nombre.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase();

  const stats = useMemo(() => ({
    total:     pedidos.length,
    pendiente: pedidos.filter(p => p.estado === "pendiente").length,
    en_ruta:   pedidos.filter(p => p.estado === "en_ruta").length,
    entregado: pedidos.filter(p => p.estado === "entregado").length,
    fallido:   pedidos.filter(p => p.estado === "fallido").length,
  }), [pedidos]);

  const eficiencia = stats.total > 0 ? Math.round((stats.entregado / stats.total) * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Hero */}
      <div className="px-5 pt-8 pb-6 text-center border-b border-white/[0.04]">
        <div className="grid h-20 w-20 place-items-center rounded-full text-2xl font-bold text-white mx-auto shadow-lg"
          style={{ background: "linear-gradient(135deg, hsl(271 81% 66%), hsl(38 92% 50%))" }}>
          {iniciales}
        </div>
        <h2 className="mt-4 text-xl font-semibold text-white">{usuario.nombre}</h2>
        <p className="mt-0.5 text-sm text-zinc-400">{usuario.email}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {usuario.empresaNombre && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs text-purple-300">
              <Building2 className="h-3 w-3" /> {usuario.empresaNombre}
            </span>
          )}
          {usuario.vehiculo && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
              <Truck className="h-3 w-3" /> {usuario.vehiculo}
            </span>
          )}
          {usuario.telefono && (
            <a href={`tel:${usuario.telefono}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
              <Phone className="h-3 w-3" /> {usuario.telefono}
            </a>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Resumen de pedidos</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total asignados", value: stats.total,     color: "text-white" },
            { label: "Eficiencia",      value: `${eficiencia}%`, color: "text-emerald-400" },
            { label: "Entregados",      value: stats.entregado,  color: "text-emerald-400" },
            { label: "En ruta",         value: stats.en_ruta,    color: "text-amber-400" },
            { label: "Pendientes",      value: stats.pendiente,  color: "text-purple-400" },
            { label: "Fallidos",        value: stats.fallido,    color: "text-red-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">{label}</div>
              <div className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
            </div>
          ))}
        </div>
        {stats.total > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
              <span>Progreso de la jornada</span>
              <span className="font-mono">{stats.entregado}/{stats.total}</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{
                width: `${eficiencia}%`,
                background: "linear-gradient(to right, hsl(271 81% 66%), hsl(38 92% 50%))"
              }} />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        <p className="text-xs text-zinc-600 text-center">
          {new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>
    </div>
  );
}

// ─── TAB: Ajustes ────────────────────────────────────────────────────────────

function AjustesTab({ usuario }: { usuario: UsuarioInfo }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      <h2 className="text-lg font-semibold text-white mt-2">Ajustes</h2>

      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Mi cuenta</p>
        </div>
        {[
          { label: "Nombre",   value: usuario.nombre },
          { label: "Email",    value: usuario.email },
          { label: "Empresa",  value: usuario.empresaNombre ?? "—" },
          { label: "Vehículo", value: usuario.vehiculo ?? "No registrado" },
          { label: "Teléfono", value: usuario.telefono ?? "No registrado" },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-white/[0.03] last:border-0">
            <span className="text-sm text-zinc-400">{label}</span>
            <span className="text-sm text-zinc-200 font-medium truncate max-w-[55%] text-right">{value}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Aplicación</p>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.03]">
          <span className="text-sm text-zinc-400">Versión</span>
          <span className="text-sm text-zinc-500 font-mono">RouteAI v2.1</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-zinc-400">Actualización automática</span>
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Activa (30 s)
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Soporte</p>
        </div>
        <div className="px-4 py-3 border-b border-white/[0.03]">
          <p className="text-sm text-zinc-400">¿Problemas con la app?</p>
          <p className="text-xs text-zinc-600 mt-0.5">Contacta a tu encargado o escribe a soporte@ruteai.com</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-sm text-zinc-400">GPS y mapa</p>
          <p className="text-xs text-zinc-600 mt-0.5">Asegúrate de tener conexión a internet. El mapa se actualiza cada 30 s.</p>
        </div>
      </div>

      <Link href="/api/auth/logout-repartidor"
        className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/[0.06] py-4 text-sm font-semibold text-red-400 hover:bg-red-500/[0.12] active:scale-[0.98] transition-all">
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </Link>

      <div className="pb-4 text-center text-[10px] text-zinc-700">
        © 2026 RouteAI Labs S.A.S.
      </div>
    </div>
  );
}

// ─── Bottom Navigation ───────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; Icon: LucideIcon }[] = [
  { id: "mapa",    label: "Mapa",    Icon: MapIcon },
  { id: "pedidos", label: "Pedidos", Icon: Package },
  { id: "perfil",  label: "Perfil",  Icon: User },
  { id: "ajustes", label: "Ajustes", Icon: Settings },
];

// ─── Main App Component ──────────────────────────────────────────────────────

interface RepartidorAppProps {
  usuario: UsuarioInfo;
  pedidosIniciales: Pedido[];
}

export function RepartidorApp({ usuario, pedidosIniciales }: RepartidorAppProps) {
  const [activeTab, setActiveTab] = useState<TabId>("mapa");
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosIniciales);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPedidos = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/pedidos?repartidorId=${usuario.id}`);
      if (res.ok) {
        const data = await res.json() as { data?: Pedido[] };
        if (data.data) { setPedidos(data.data); setLastUpdated(new Date()); }
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [usuario.id]);

  useEffect(() => {
    const id = setInterval(() => void fetchPedidos(), 30_000);
    return () => clearInterval(id);
  }, [fetchPedidos]);

  const pendingCount = pedidos.filter(p => p.estado === "pendiente" || p.estado === "en_ruta").length;

  return (
    <div className="flex flex-col bg-zinc-950 text-zinc-100 font-sans" style={{ height: "100dvh" }}>

      {/* Top micro-bar */}
      <header className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] bg-zinc-950/90 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 grid place-items-center rounded-md"
            style={{ background: "linear-gradient(135deg, hsl(38 92% 50%), hsl(271 81% 66%))" }}>
            <Route className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-white">
            Hola,{" "}
            <span style={{ background: "linear-gradient(to right, hsl(38 92% 50%), hsl(271 81% 66%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {usuario.nombre.split(" ")[0]}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isRefreshing && <RefreshCw className="h-3.5 w-3.5 text-zinc-500 animate-spin" />}
          <div className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, hsl(271 81% 66%), hsl(38 92% 50%))" }}>
            {usuario.nombre.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 min-h-0 relative overflow-hidden">
        <div className={`absolute inset-0 ${activeTab === "mapa" ? "z-10" : "z-0 pointer-events-none opacity-0"}`}>
          <MapaTab pedidos={pedidos} onRefresh={fetchPedidos} lastUpdated={lastUpdated} isRefreshing={isRefreshing} />
        </div>
        {activeTab === "pedidos" && (
          <div className="absolute inset-0 z-10 overflow-hidden">
            <PedidosTab pedidos={pedidos} onRefresh={fetchPedidos} isRefreshing={isRefreshing} />
          </div>
        )}
        {activeTab === "perfil" && (
          <div className="absolute inset-0 z-10 overflow-hidden">
            <PerfilTab usuario={usuario} pedidos={pedidos} />
          </div>
        )}
        {activeTab === "ajustes" && (
          <div className="absolute inset-0 z-10 overflow-hidden">
            <AjustesTab usuario={usuario} />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="shrink-0 flex items-stretch border-t border-white/[0.06] bg-zinc-950/95 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          const showBadge = id === "pedidos" && pendingCount > 0;
          return (
            <button key={id} onClick={() => setActiveTab(id)}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-all active:scale-95">
              <div className="relative">
                <Icon className="h-5 w-5" style={{ color: isActive ? "hsl(38 92% 50%)" : "#71717a" }} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 h-4 w-4 rounded-full bg-purple-500 text-[9px] font-bold text-white grid place-items-center">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-amber-400" : "text-zinc-600"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
