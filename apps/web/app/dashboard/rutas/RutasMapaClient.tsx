"use client";

import { useState } from "react";
import { Layers, Maximize2, Navigation, Sparkles, Wifi, WifiOff } from "lucide-react";
import { useRealtimeGPS } from "../components/RealtimeGPSPin";

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

// Convierte lat/lng reales a posición % dentro del SVG (rango Chile)
function gpsAporcentaje(lat: number, lng: number) {
  const x = Math.min(95, Math.max(5, ((lng - -75) / (-66 - -75)) * 100));
  const y = Math.min(95, Math.max(5, ((-17 - lat) / (-17 - -55)) * 100));
  return { x, y };
}

export function RutasMapaClient({ empresaId, empresaNombre, pedidos, ultimasUbicaciones }: Props) {
  const { pinPos, ubicacion, conectado } = useRealtimeGPS(empresaId);
  const [selectedPedido, setSelectedPedido] = useState<string | null>(null);

  const enRuta = pedidos.filter(p => p.estado === "en_ruta");
  const pendientes = pedidos.filter(p => p.estado === "pendiente");

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 overflow-hidden">

      {/* Vista Principal - Mapa */}
      <div className="relative flex-1">
        <div className="relative overflow-hidden bg-zinc-900/50 backdrop-blur-xl h-full w-full">

          {/* Fondos decorativos */}
          <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          {/* SVG Mapa */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="1.2" />
              </filter>
            </defs>

            {/* Cuadrícula más visible */}
            {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(v => (
              <g key={v}>
                <line x1={v} y1="0" x2={v} y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
                <line x1="0" y1={v} x2="100" y2={v} stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
              </g>
            ))}

            {/* Ruta animada entre pedidos con lat/lng reales */}
            {pedidos.filter(p => p.lat && p.lng).length >= 2 && (() => {
              const pts = pedidos
                .filter(p => p.lat && p.lng)
                .map(p => gpsAporcentaje(p.lat!, p.lng!));
              const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
              return (
                <>
                  <path d={d} fill="none" stroke="url(#routeGrad)" strokeWidth="0.6" filter="url(#glow)" opacity="0.7" />
                  <path d={d} fill="none" stroke="url(#routeGrad)" strokeWidth="0.3" strokeDasharray="1.5 1.2" />
                </>
              );
            })()}
          </svg>

          {/* Marcadores de Pedidos — fallback Santiago si sin coordenadas */}
          {pedidos.map((pedido, idx) => {
            // Si no hay coordenadas GPS → posición aproximada en Santiago con offset
            const defaultLat = -33.4489 + (idx * 0.015);
            const defaultLng = -70.6693 + (idx * 0.012);
            const pos = gpsAporcentaje(
              pedido.lat ?? defaultLat,
              pedido.lng ?? defaultLng
            );
            const isEnRuta  = pedido.estado === "en_ruta";
            const isSelected = selectedPedido === pedido.id;
            const sinGPS    = !pedido.lat || !pedido.lng;

            return (
              <button
                key={pedido.id}
                onClick={() => setSelectedPedido(isSelected ? null : pedido.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <div className={`relative h-3 w-3 rounded-full ring-2 transition-transform group-hover:scale-150 ${
                  sinGPS
                    ? "bg-zinc-500 ring-zinc-500/40"
                    : isEnRuta
                    ? "bg-amber-500 ring-amber-500/40"
                    : "bg-emerald-500 ring-emerald-500/30"
                }`}>
                  {isEnRuta && <span className="absolute inset-0 rounded-full animate-ping bg-amber-500/60" />}
                </div>
                {isSelected && (
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 whitespace-nowrap rounded-md bg-zinc-900/95 px-2 py-1 text-[10px] font-medium text-white ring-1 ring-white/10 shadow-xl">
                    <div className="font-semibold">{pedido.nombreCliente}</div>
                    <div className="text-zinc-400 truncate max-w-[150px]">{pedido.direccion}</div>
                    {sinGPS && <div className="text-zinc-600 text-[9px]">📍 Pos. aproximada</div>}
                  </div>
                )}
              </button>
            );
          })}

          {/* Pin GPS en Vivo del Repartidor (Realtime) */}
          {pinPos && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none transition-all duration-1000 ease-linear"
              style={{ left: `${pinPos.x}%`, top: `${pinPos.y}%` }}
            >
              <div className="relative h-5 w-5 rounded-full bg-blue-500 ring-4 ring-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.6)]">
                <span className="absolute inset-0 rounded-full animate-ping bg-blue-400/50" />
              </div>
              {ubicacion && (
                <div className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-blue-900/90 px-2 py-1 text-[10px] font-medium text-blue-200 ring-1 ring-blue-500/30">
                  📍 En vivo
                </div>
              )}
            </div>
          )}

          {/* Pins de última ubicación conocida (cargados del servidor) */}
          {!pinPos && ultimasUbicaciones.map((ub) => {
            const pos = gpsAporcentaje(ub.lat, ub.lng);
            return (
              <div
                key={ub.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <div className="relative h-4 w-4 rounded-full bg-blue-500/50 ring-2 ring-blue-500/30" />
                <div className="absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-zinc-900/80 px-1.5 py-0.5 text-[9px] text-zinc-300 ring-1 ring-white/10">
                  {ub.repartidor.nombre.split(" ")[0]}
                </div>
              </div>
            );
          })}

          {/* Botones de Control */}
          <div className="absolute left-4 top-4 flex flex-col gap-2">
            {[Layers, Maximize2, Navigation].map((Icon, i) => (
              <button
                key={i}
                className="grid h-9 w-9 place-items-center rounded-md bg-white/5 backdrop-blur-md text-white hover:bg-white/10 transition-colors border border-white/5"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          {/* Indicador Realtime */}
          <div className="absolute top-4 right-4">
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur border ${
              conectado
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-zinc-800/80 text-zinc-500 border-zinc-700/50"
            }`}>
              {conectado ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {conectado ? "GPS en vivo" : "Conectando..."}
            </div>
          </div>

          {/* Barra inferior con métricas */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl bg-zinc-900/70 backdrop-blur-lg border border-white/5 px-4 py-2.5 text-xs">
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
            </div>
            <span className="inline-flex items-center gap-1.5 rounded bg-purple-500/15 px-2 py-0.5 font-semibold text-purple-400 ring-1 ring-inset ring-purple-500/20">
              <Sparkles className="h-3 w-3" /> IA Activa · RF-04
            </span>
          </div>
        </div>
      </div>

      {/* Sidebar Derecha — Lista de pedidos activos */}
      <aside className="hidden w-[360px] shrink-0 flex-col border-l border-zinc-800 bg-zinc-950/50 backdrop-blur-xl lg:flex z-10">
        <div className="border-b border-zinc-800 p-5">
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
                  <div className="absolute left-[1.85rem] top-10 bottom-0 w-px bg-zinc-800" />
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
