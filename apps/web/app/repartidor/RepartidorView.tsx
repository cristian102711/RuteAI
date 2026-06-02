"use client";

import { useTransition } from "react";
import {
  MapPin, Package, Navigation, Phone,
  Sparkles, ChevronRight, CheckCircle, Loader2,
} from "lucide-react";
import { RepartidorMapa } from "./RepartidorMapa";
import { EvidenciaPanel } from "./EvidenciaPanel";
import { iniciarEntrega, confirmarEntrega } from "./actions";

interface Pedido {
  id: string;
  nombreCliente: string;
  clienteTelefono: string | null;
  direccion: string;
  producto: string;
  horarioPreferido: string | null;
  estado: string;
  lat: number | null;
  lng: number | null;
  scoreRiesgo: number | null;
}

interface Props {
  pedidos: Pedido[];
  userName: string;
  userInitials: string;
  apiKey: string;
}

const TIPS_IA: Record<"alto" | "medio" | "bajo", string> = {
  alto:  "Zona de riesgo alto. Verifica identidad del receptor y toma foto de evidencia.",
  medio: "Confirma la dirección antes de llegar. Puede haber dificultad de acceso.",
  bajo:  "Entrega sin alertas activas. Confirma al cliente al llegar.",
};

export function RepartidorView({ pedidos, userName, userInitials, apiKey }: Props) {
  const [isPending, startTransition] = useTransition();

  const activos     = pedidos.filter(p => p.estado === "en_ruta" || p.estado === "pendiente");
  const entregados  = pedidos.filter(p => p.estado === "entregado");
  const paradaActual = activos[0] ?? null;
  const restantes   = activos.slice(1);
  const total       = pedidos.length;
  const progreso    = total > 0 ? Math.round((entregados.length / total) * 100) : 0;

  const score      = paradaActual?.scoreRiesgo ?? 0;
  const nivelRiesgo: "alto" | "medio" | "bajo" =
    score > 60 ? "alto" : score > 30 ? "medio" : "bajo";

  function handleAccion() {
    if (!paradaActual) return;
    startTransition(async () => {
      if (paradaActual.estado === "pendiente") {
        await iniciarEntrega(paradaActual.id);
      } else {
        await confirmarEntrega(paradaActual.id);
      }
    });
  }

  // Estado: ruta completada
  if (activos.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-center px-6">
        <div>
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
          <h2 className="text-xl font-semibold text-white">¡Ruta completada!</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Entregaste {entregados.length} de {total} pedido{total !== 1 ? "s" : ""} hoy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-md bg-zinc-950 min-h-screen relative shadow-2xl">

        {/* Cabecera */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-xl">
          <span className="truncate max-w-[120px] text-xs text-zinc-400">{userName}</span>
          <div className="text-xs">
            <span className="text-zinc-500">Ruta de hoy · </span>
            <span className="font-mono text-white">{entregados.length}/{total}</span>
          </div>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-purple-600 to-amber-500 text-xs font-bold text-white shadow-sm">
            {userInitials}
          </div>
        </header>

        <div className="space-y-5 px-4 py-5 pb-10">

          {/* Barra de progreso */}
          <div className="rounded-xl border border-zinc-800 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Progreso de ruta</span>
              <span className="font-mono text-white">
                {progreso}% · {restantes.length + 1} restante{restantes.length + 1 !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>

          {/* Mapa */}
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900" style={{ height: 220 }}>
            {apiKey && paradaActual?.lat && paradaActual?.lng ? (
              <RepartidorMapa
                paradaActual={{
                  id: 0,
                  nombre: paradaActual.nombreCliente,
                  direccion: paradaActual.direccion,
                  lat: paradaActual.lat,
                  lng: paradaActual.lng,
                }}
                apiKey={apiKey}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-center px-6">
                <div>
                  <MapPin className="mx-auto mb-2 h-6 w-6 text-zinc-600" />
                  <p className="text-xs text-zinc-500">
                    {!apiKey ? "Google Maps no configurado" : "Sin coordenadas para esta dirección"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tarjeta próxima parada */}
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-500/[0.08] to-transparent p-5 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl" />

            <div className="text-xs font-medium uppercase tracking-widest text-purple-400">
              {paradaActual!.estado === "en_ruta" ? "En camino" : "Próxima parada"}
            </div>

            <div className="mt-3 flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-purple-600 text-lg font-bold text-white shadow-md">
                {entregados.length + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-semibold leading-tight text-white">
                  {paradaActual!.nombreCliente}
                </div>
                <div className="mt-1 flex items-start gap-1.5 text-sm text-zinc-400">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span className="truncate">{paradaActual!.direccion}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-lg border border-zinc-800/50 bg-black/40 px-3 py-2.5 text-xs">
              <div>
                <span className="text-zinc-500">Horario</span>
                <div className="font-mono text-base text-white">
                  {paradaActual!.horarioPreferido ?? "—"}
                </div>
              </div>
              <div>
                <span className="text-zinc-500">Riesgo</span>
                <div className={`font-mono text-base ${
                  nivelRiesgo === "alto"  ? "text-red-400" :
                  nivelRiesgo === "medio" ? "text-amber-400" : "text-emerald-400"
                }`}>
                  {nivelRiesgo}
                </div>
              </div>
              <div>
                <span className="text-zinc-500">Producto</span>
                <div className="flex items-center gap-1 text-white mt-0.5">
                  <Package className="h-3.5 w-3.5 text-amber-500" />
                  <span className="truncate max-w-[60px]">{paradaActual!.producto}</span>
                </div>
              </div>
            </div>

            {/* Navegar */}
            <a
              href={
                paradaActual!.lat && paradaActual!.lng
                  ? `https://www.google.com/maps/dir/?api=1&destination=${paradaActual!.lat},${paradaActual!.lng}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(paradaActual!.direccion)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 py-4 text-base font-bold text-white active:scale-[0.98] transition-transform shadow-lg"
            >
              <Navigation className="h-5 w-5" /> Abrir en Google Maps
            </a>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <a
                href={
                  paradaActual!.lat && paradaActual!.lng
                    ? `https://waze.com/ul?ll=${paradaActual!.lat},${paradaActual!.lng}&navigate=yes`
                    : `https://waze.com/ul?q=${encodeURIComponent(paradaActual!.direccion)}&navigate=yes`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-white/5 py-2.5 text-sm hover:bg-white/10 transition-colors text-white"
              >
                <Navigation className="h-4 w-4" /> Waze
              </a>

              {paradaActual!.clienteTelefono ? (
                <a
                  href={`tel:${paradaActual!.clienteTelefono}`}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-white/5 py-2.5 text-sm hover:bg-white/10 transition-colors text-white"
                >
                  <Phone className="h-4 w-4" /> Llamar
                </a>
              ) : (
                <button
                  disabled
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-white/5 py-2.5 text-sm text-zinc-600 cursor-not-allowed"
                >
                  <Phone className="h-4 w-4" /> Sin teléfono
                </button>
              )}
            </div>

            <button
              onClick={handleAccion}
              disabled={isPending}
              className="mt-3 w-full rounded-lg bg-white/5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors border border-transparent disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</>
              ) : paradaActual!.estado === "pendiente" ? (
                "Iniciar entrega"
              ) : (
                "Confirmar sin evidencia"
              )}
            </button>

            {/* Evidencia — solo disponible cuando el pedido ya está en_ruta */}
            {paradaActual!.estado === "en_ruta" && (
              <EvidenciaPanel pedidoId={paradaActual!.id} />
            )}
          </div>

          {/* Tip IA basado en score real */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3 shadow-inner">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="text-xs">
              <div className="font-medium text-amber-400">
                Tip de la IA · Riesgo {nivelRiesgo}
              </div>
              <div className="text-zinc-400 mt-0.5 leading-relaxed">
                {TIPS_IA[nivelRiesgo]}
              </div>
            </div>
          </div>

          {/* Resto de paradas */}
          {restantes.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Restantes en tu ruta</h3>
                <span className="text-xs text-zinc-500">{restantes.length} paradas</span>
              </div>
              <ul className="space-y-2">
                {restantes.map((parada, index) => (
                  <li
                    key={parada.id}
                    className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-white/[0.02] p-3"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 text-xs font-bold text-zinc-500 ring-1 ring-inset ring-white/10">
                      {entregados.length + 2 + index}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-zinc-200">
                        {parada.nombreCliente}
                      </div>
                      <div className="truncate text-xs text-zinc-500 mt-0.5">
                        {parada.direccion}
                      </div>
                    </div>
                    <div className="text-xs font-mono text-zinc-400 shrink-0">
                      {parada.horarioPreferido ?? "—"}
                      <ChevronRight className="ml-1 inline h-3.5 w-3.5 text-zinc-600" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
