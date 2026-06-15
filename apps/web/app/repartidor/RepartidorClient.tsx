"use client";

import { useState, useTransition } from "react";
import {
  Menu, MapPin, Package, Navigation, Phone,
  Sparkles, ChevronRight, CheckCircle2, XCircle,
  LogOut, Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ModalEvidencia } from "../dashboard/components/ModalEvidencia";

interface Pedido {
  id:              string;
  nombreCliente:   string;
  clienteTelefono: string | null;
  direccion:       string;
  producto:        string;
  horarioPreferido: string | null;
  estado:          string;
  lat:             number | null;
  lng:             number | null;
}

interface RepartidorClientProps {
  repartidor:   { id: string; nombre: string; initials: string };
  proxima:      Pedido | null;
  restantes:    Pedido[];
  total:        number;
  progreso:     number;
  empresaNombre: string;
}

export function RepartidorClient({
  repartidor,
  proxima: proximaInicial,
  restantes: restantesIniciales,
  total: totalInicial,
  progreso: progresoInicial,
  empresaNombre,
}: RepartidorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [proxima, setProxima]       = useState<Pedido | null>(proximaInicial);
  const [restantes, setRestantes]   = useState<Pedido[]>(restantesIniciales);
  const [entregados, setEntregados] = useState(0);
  const [total]                     = useState(totalInicial);
  const [confirmando, setConfirmando] = useState<"entregado" | "fallido" | null>(null);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [modalEvidencia, setModalEvidencia] = useState<string | null>(null); // pedidoId cuando abierto

  const totalConEntregados = total;
  const progreso = totalConEntregados === 0
    ? 100
    : Math.round((entregados / totalConEntregados) * 100);

  // ── Actualizar estado del pedido en DB ───────────────────────
  async function actualizarEstado(pedidoId: string, estado: "entregado" | "fallido") {
    setConfirmando(estado);
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}/estado`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ estado }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Error actualizando el pedido");
        return;
      }

      // Avanzar al siguiente pedido localmente sin recargar página
      setEntregados((e) => e + 1);
      const [siguiente, ...resto] = restantes;
      setProxima(siguiente ?? null);
      setRestantes(resto);
    } catch {
      alert("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setConfirmando(null);
    }
  }

  // ── Abrir Google Maps con la dirección ──────────────────────
  function abrirMaps(direccion: string, lat: number | null, lng: number | null) {
    const query = lat && lng
      ? `${lat},${lng}`
      : encodeURIComponent(direccion);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  }

  // ── Llamar al cliente ───────────────────────────────────────
  function llamarCliente(telefono: string) {
    window.location.href = `tel:${telefono}`;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-md bg-zinc-950 min-h-screen relative shadow-2xl">

        {/* ── Menú lateral ───────────────────────────────── */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          >
            <div
              className="absolute left-0 top-0 h-full w-72 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-purple-600 to-amber-500 text-sm font-bold text-white">
                  {repartidor.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{repartidor.nombre}</p>
                  <p className="text-xs text-zinc-400">{empresaNombre}</p>
                </div>
              </div>
              <hr className="border-zinc-800" />
              <button
                onClick={() => {
                  startTransition(() => {
                    fetch("/api/auth/logout", { method: "POST" }).then(() =>
                      router.push("/login")
                    );
                  });
                }}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
              >
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* ── Header ─────────────────────────────────────── */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-xl">
          <button
            onClick={() => setMenuOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-md border border-zinc-800 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="text-xs">
            <span className="text-zinc-500">Ruta de hoy · </span>
            <span className="font-mono text-white">
              {entregados}/{totalConEntregados}
            </span>
          </div>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-purple-600 to-amber-500 text-xs font-bold text-white shadow-sm">
            {repartidor.initials}
          </div>
        </header>

        <div className="space-y-5 px-4 py-5 pb-10">

          {/* ── Barra de progreso ──────────────────────── */}
          <div className="rounded-xl border border-zinc-800 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Progreso de ruta</span>
              <span className="font-mono text-white">
                {progreso}% · {totalConEntregados - entregados} entregas restantes
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-purple-500 transition-all duration-700"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>

          {/* ── Sin pedidos ────────────────────────────── */}
          {!proxima && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">¡Todo listo!</p>
                <p className="text-sm text-zinc-400 mt-1">
                  {totalConEntregados === 0
                    ? "No tienes pedidos asignados hoy."
                    : "Completaste todas tus entregas del día. 🎉"}
                </p>
              </div>
            </div>
          )}

          {/* ── Próxima parada ─────────────────────────── */}
          {proxima && (
            <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-500/[0.08] to-transparent p-5 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl" />

              <div className="text-xs font-medium uppercase tracking-widest text-purple-400">
                Próxima parada
              </div>

              <div className="mt-3 flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-purple-600 text-lg font-bold text-white shadow-md">
                  {entregados + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-semibold leading-tight text-white">
                    {proxima.nombreCliente}
                  </div>
                  <div className="mt-1 flex items-start gap-1.5 text-sm text-zinc-400">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <span>{proxima.direccion}</span>
                  </div>
                  {proxima.horarioPreferido && (
                    <div className="mt-1 text-xs text-zinc-500">
                      ⏰ Ventana: {proxima.horarioPreferido}
                    </div>
                  )}
                </div>
              </div>

              {/* Meta info */}
              <div className="mt-5 flex items-center justify-between rounded-lg border border-zinc-800/50 bg-black/40 px-3 py-2.5 text-xs">
                <div>
                  <span className="text-zinc-500">Producto</span>
                  <div className="text-white flex items-center gap-1 mt-0.5">
                    <Package className="h-3.5 w-3.5 text-amber-500" />
                    {proxima.producto}
                  </div>
                </div>
                {proxima.clienteTelefono && (
                  <div>
                    <span className="text-zinc-500">Teléfono</span>
                    <div className="font-mono text-white mt-0.5">{proxima.clienteTelefono}</div>
                  </div>
                )}
              </div>

              {/* Botón Maps */}
              <button
                onClick={() => abrirMaps(proxima.direccion, proxima.lat, proxima.lng)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 py-4 text-base font-bold text-white active:scale-[0.98] transition-transform shadow-lg"
              >
                <Navigation className="h-5 w-5" /> Abrir en Google Maps
              </button>

              {/* Llamar / Waze */}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => abrirMaps(proxima.direccion, proxima.lat, proxima.lng)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-white/5 py-2.5 text-sm hover:bg-white/10 transition-colors text-white"
                >
                  <Navigation className="h-4 w-4" /> Waze
                </button>
                <button
                  onClick={() => proxima.clienteTelefono && llamarCliente(proxima.clienteTelefono)}
                  disabled={!proxima.clienteTelefono}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-white/5 py-2.5 text-sm hover:bg-white/10 transition-colors text-white disabled:opacity-40"
                >
                  <Phone className="h-4 w-4" /> Llamar
                </button>
              </div>

              {/* ── Acciones de entrega ────────────────── */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {/* Entregado → abre modal de evidencia */}
                <button
                  onClick={() => setModalEvidencia(proxima.id)}
                  disabled={!!confirmando}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 py-3 text-sm font-bold text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Entregado
                </button>
                <button
                  onClick={() => actualizarEstado(proxima.id, "fallido")}
                  disabled={!!confirmando}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 py-3 text-sm font-bold text-rose-400 hover:bg-rose-500/30 transition-colors disabled:opacity-60"
                >
                  {confirmando === "fallido"
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <XCircle className="h-4 w-4" />
                  }
                  No entregado
                </button>
              </div>
            </div>
          )}

          {/* ── Tip IA (estático por ahora) ─────────────── */}
          {proxima && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3 shadow-inner">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="text-xs">
                <div className="font-medium text-amber-400">Tip de la IA</div>
                <div className="text-zinc-400 mt-0.5 leading-relaxed">
                  Intenta confirmar la entrega por teléfono si no hay respuesta en la puerta.
                </div>
              </div>
            </div>
          )}

          {/* ── Resto de paradas ──────────────────────── */}
          {restantes.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Restantes en tu ruta</h3>
                <span className="text-xs text-zinc-500">{restantes.length} paradas</span>
              </div>

              <ul className="space-y-2">
                {restantes.map((parada, i) => (
                  <li
                    key={parada.id}
                    className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-white/[0.02] p-3 cursor-default group"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 text-xs font-bold text-zinc-500 ring-1 ring-inset ring-white/10">
                      {entregados + i + 2}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-zinc-200">
                        {parada.nombreCliente}
                      </div>
                      <div className="truncate text-xs text-zinc-500 mt-0.5">
                        {parada.direccion}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      {parada.horarioPreferido && (
                        <div className="text-xs font-mono text-zinc-400">
                          {parada.horarioPreferido}
                        </div>
                      )}
                      <ChevronRight className="h-4 w-4 text-zinc-600" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>

      {/* ── Modal de Evidencia de Entrega ── */}
      {modalEvidencia && proxima && (
        <ModalEvidencia
          pedidoId={modalEvidencia}
          nombreCliente={proxima.nombreCliente}
          onClose={() => setModalEvidencia(null)}
          onSuccess={() => {
            setModalEvidencia(null);
            // Avanzar al siguiente pedido igual que al marcar entregado
            setEntregados((e) => e + 1);
            const [siguiente, ...resto] = restantes;
            setProxima(siguiente ?? null);
            setRestantes(resto);
          }}
        />
      )}
    </div>
  );
}
