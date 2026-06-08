"use client";

import { useEffect, useState, useMemo } from "react";
import { Menu, MapPin, Package, Navigation, Phone, Sparkles, ChevronRight, Play, Square, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { marcarComoEntregado } from "../dashboard/actions";
import { useRouter } from "next/navigation";

export default function RepartidorView() {
  const router = useRouter();
  const [ruta, setRuta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para la simulación GPS
  const [simulacionActiva, setSimulacionActiva] = useState(false);
  const [simPos, setSimPos] = useState<{ lat: number; lng: number } | null>(null);

  // 1. Cargar la ruta activa del repartidor al montar el componente
  useEffect(() => {
    async function cargarRuta() {
      try {
        const response = await fetch("/api/repartidor/ruta-activa");
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        
        const resData = await response.json();
        if (resData.error) {
          setError(resData.error);
        } else {
          setRuta(resData.data);
          // Si hay pedidos en la ruta, inicializar la posición de simulación
          const primerPedido = resData.data?.pedidos?.find((p: any) => p.estado !== "entregado");
          if (primerPedido && primerPedido.lat && primerPedido.lng) {
            setSimPos({ lat: primerPedido.lat - 0.005, lng: primerPedido.lng - 0.005 });
          }
        }
      } catch (err) {
        console.error("Error cargando ruta activa", err);
        setError("Error al conectar con el servidor");
      } finally {
        setLoading(false);
      }
    }

    cargarRuta();
  }, [router]);

  // 2. Procesar las paradas
  const pedidos = ruta?.pedidos || [];
  
  const paradas = useMemo(() => {
    return pedidos.filter((p: any) => p.estado !== "entregado" && p.estado !== "fallido");
  }, [pedidos]);

  const proximaParada = paradas[0] || null;
  const paradasRestantes = paradas.slice(1);
  const totalParadas = pedidos.length;
  const completadas = totalParadas - paradas.length;
  const porcentajeProgreso = totalParadas > 0 ? Math.round((completadas / totalParadas) * 100) : 0;

  // 3. Intervalo para simular movimiento del repartidor
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (simulacionActiva && proximaParada && proximaParada.lat && proximaParada.lng) {
      intervalId = setInterval(() => {
        setSimPos((current) => {
          if (!current) {
            return { lat: proximaParada.lat - 0.005, lng: proximaParada.lng - 0.005 };
          }

          const targetLat = proximaParada.lat;
          const targetLng = proximaParada.lng;

          // Interpolación lineal hacia el destino (pasos del 20%)
          const step = 0.20;
          const nextLat = current.lat + (targetLat - current.lat) * step;
          const nextLng = current.lng + (targetLng - current.lng) * step;

          // Si estamos muy cerca, fijar en el destino
          const dist = Math.sqrt(Math.pow(nextLat - targetLat, 2) + Math.pow(nextLng - targetLng, 2));
          if (dist < 0.0002) {
            return { lat: targetLat, lng: targetLng };
          }

          return { lat: nextLat, lng: nextLng };
        });
      }, 5000); // Actualiza cada 5 segundos
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [simulacionActiva, proximaParada]);

  // 4. Reportar la posición del GPS simulado a la base de datos
  useEffect(() => {
    if (!simPos || !simulacionActiva || !ruta?.repartidorId) return;
    const { lat, lng } = simPos;
    const repartidorId = ruta.repartidorId;

    async function reportarUbicacion() {
      try {
        await fetch("/api/ubicaciones", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lat,
            lng,
            repartidorId,
          }),
        });
      } catch (err) {
        console.error("Error al reportar ubicación:", err);
      }
    }

    reportarUbicacion();
  }, [simPos, simulacionActiva, ruta?.repartidorId]);

  // 5. Confirmar entrega del pedido
  const handleConfirmarEntrega = async () => {
    if (!proximaParada) return;
    try {
      setLoading(true);
      await marcarComoEntregado(proximaParada.id);
      
      // Actualizar el estado local
      setRuta((prevRuta: any) => {
        if (!prevRuta) return null;
        return {
          ...prevRuta,
          pedidos: prevRuta.pedidos.map((p: any) =>
            p.id === proximaParada.id ? { ...p, estado: "entregado" } : p
          ),
        };
      });

      // Mover la simulación inicial al siguiente punto si existe
      const siguienteParada = paradas[1];
      if (siguienteParada && siguienteParada.lat && siguienteParada.lng) {
        setSimPos({ lat: proximaParada.lat, lng: proximaParada.lng });
      }
    } catch (err) {
      console.error("Error al confirmar entrega", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !ruta) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-100">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-sm text-zinc-400">Cargando tu ruta de hoy...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center text-zinc-100">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-4 text-2xl">⚠️</div>
        <h3 className="text-xl font-bold mb-2">No se pudo cargar la ruta</h3>
        <p className="text-sm text-zinc-400 max-w-xs mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-sm text-white transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!ruta) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center text-zinc-100">
        <div className="w-16 h-16 bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center mb-4 text-2xl">📦</div>
        <h3 className="text-xl font-bold mb-2">Sin ruta programada</h3>
        <p className="text-sm text-zinc-400 max-w-xs mb-6">
          No tienes ninguna ruta activa o pendiente para el día de hoy. Contacta al supervisor.
        </p>
        <Link 
          href="/dashboard"
          className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-sm text-white transition-colors"
        >
          Ir al Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-md bg-zinc-950 min-h-screen relative shadow-2xl pb-10">
        
        {/* Cabecera pegajosa */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${simulacionActiva ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
            <span className="text-xs text-zinc-400">{simulacionActiva ? "Transmitiendo GPS" : "GPS Detenido"}</span>
          </div>
          <div className="text-xs">
            <span className="text-zinc-500">Ruta de hoy · </span>
            <span className="font-mono text-white">{completadas}/{totalParadas}</span>
          </div>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-purple-600 to-amber-500 text-xs font-bold text-white shadow-sm">
            RP
          </div>
        </header>

        <div className="space-y-5 px-4 py-5">
          
          {/* Panel de Control de Simulación (Glow premium) */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Simulador GPS (Demo)</div>
              {simPos && (
                <span className="font-mono text-[10px] text-zinc-500">
                  {simPos.lat.toFixed(4)}, {simPos.lng.toFixed(4)}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              {!simulacionActiva ? (
                <button
                  onClick={() => setSimulacionActiva(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white transition-colors active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Iniciar Ruta (Simular GPS)
                </button>
              ) : (
                <button
                  onClick={() => setSimulacionActiva(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 py-2.5 text-xs font-bold text-white transition-colors active:scale-95"
                >
                  <Square className="w-3.5 h-3.5 fill-white" /> Pausar Simulación GPS
                </button>
              )}
            </div>
          </div>

          {/* Progreso de la ruta */}
          <div className="rounded-xl border border-zinc-800 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Progreso de la entrega</span>
              <span className="font-mono text-white">{porcentajeProgreso}% completado</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-purple-500 transition-all duration-500" 
                style={{ width: `${porcentajeProgreso}%` }}
              ></div>
            </div>
          </div>

          {/* Tarjeta de Próxima Parada (Glow Effect) */}
          {proximaParada ? (
            <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-500/[0.08] to-transparent p-5 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl"></div>
              
              <div className="text-xs font-medium uppercase tracking-widest text-purple-400">
                Próxima parada
              </div>
              
              <div className="mt-3 flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-purple-600 text-lg font-bold text-white shadow-md">
                  {completadas + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-semibold leading-tight text-white">
                    {proximaParada.nombreCliente}
                  </div>
                  <div className="mt-1 flex items-start gap-1.5 text-sm text-zinc-400">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <span className="break-words">{proximaParada.direccion}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-lg border border-zinc-800/50 bg-black/40 px-3 py-2.5 text-xs">
                <div>
                  <span className="text-zinc-500">Estado</span>
                  <div className="text-amber-400 font-bold uppercase tracking-wider text-[10px] mt-0.5">En Progreso</div>
                </div>
                <div>
                  <span className="text-zinc-500">Producto</span>
                  <div className="text-white flex items-center gap-1 mt-0.5">
                    <Package className="h-3.5 w-3.5 text-amber-500" /> {proximaParada.producto}
                  </div>
                </div>
              </div>

              {/* Acciones de la parada */}
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(proximaParada.direccion)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 py-3.5 text-sm font-bold text-white active:scale-[0.98] transition-transform shadow-lg"
              >
                <Navigation className="h-4 w-4" /> Abrir en Google Maps
              </a>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <a 
                  href={`https://waze.com/ul?q=${encodeURIComponent(proximaParada.direccion)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-white/5 py-2 text-xs hover:bg-white/10 transition-colors text-white"
                >
                  <Navigation className="h-3.5 w-3.5" /> Waze
                </a>
                {proximaParada.clienteTelefono ? (
                  <a 
                    href={`tel:${proximaParada.clienteTelefono}`}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-white/5 py-2 text-xs hover:bg-white/10 transition-colors text-white"
                  >
                    <Phone className="h-3.5 w-3.5" /> Llamar
                  </a>
                ) : (
                  <button 
                    disabled 
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 py-2 text-xs text-zinc-600 cursor-not-allowed"
                  >
                    <Phone className="h-3.5 w-3.5" /> Sin Teléfono
                  </button>
                )}
              </div>

              <button 
                onClick={handleConfirmarEntrega}
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 py-3 text-sm font-bold transition-all active:scale-[0.98] border border-transparent disabled:opacity-50"
              >
                {loading ? "Procesando..." : "Confirmar entrega"}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6 text-center space-y-2">
              <div className="text-3xl">🎉</div>
              <h3 className="text-lg font-bold text-emerald-400">Ruta Completada</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                ¡Buen trabajo! Has completado con éxito todos los despachos programados para el día de hoy.
              </p>
            </div>
          )}

          {/* Tip de la IA */}
          {proximaParada && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3 shadow-inner">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="text-xs">
                <div className="font-medium text-amber-400">Tip de la IA</div>
                <div className="text-zinc-400 mt-0.5 leading-relaxed">
                  Por favor, valida la dirección antes de llegar. Recuerda notificar al cliente al arribar.
                </div>
              </div>
            </div>
          )}

          {/* Resto de la ruta */}
          {paradasRestantes.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Restantes en tu ruta</h3>
                <span className="text-xs text-zinc-500">{paradasRestantes.length} paradas</span>
              </div>
              
              <ul className="space-y-2">
                {paradasRestantes.map((parada: any, idx: number) => (
                  <li key={parada.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-white/[0.02] p-3 active:bg-white/[0.04] transition-colors cursor-pointer group">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 text-xs font-bold text-zinc-500 ring-1 ring-inset ring-white/10 group-hover:text-white transition-colors">
                      {completadas + idx + 2}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                        {parada.nombreCliente}
                      </div>
                      <div className="truncate text-xs text-zinc-500 mt-0.5">
                        {parada.direccion}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
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
