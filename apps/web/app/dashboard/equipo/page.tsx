import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Plus, Phone, Truck, MapPin, Clock, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";
import { PageWrapper, AnimatedHeader, AnimatedGrid, AnimatedCard, AnimatedSection } from "@/components/motion/PageWrapper";

// Calcula "hace X tiempo" desde un timestamp
function tiempoRelativo(fecha: Date | null): string {
  if (!fecha) return "Sin conexión";
  const segundos = Math.floor((Date.now() - new Date(fecha).getTime()) / 1000);
  if (segundos < 60) return `hace ${segundos} s`;
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} d`;
}

// Estado del repartidor basado en última conexión GPS
function calcularEstado(ultimaConexion: Date | null): {
  texto: string;
  clases: string;
  activo: boolean;
} {
  if (!ultimaConexion) {
    return {
      texto: "Sin señal",
      clases: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/30",
      activo: false,
    };
  }
  const minutos = Math.floor(
    (Date.now() - new Date(ultimaConexion).getTime()) / 60000
  );
  if (minutos <= 5)
    return {
      texto: "Activo",
      clases: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
      activo: true,
    };
  if (minutos <= 30)
    return {
      texto: "En pausa",
      clases: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
      activo: false,
    };
  return {
    texto: "Inactivo",
    clases: "bg-red-500/15 text-red-400 ring-red-500/30",
    activo: false,
  };
}

export default async function EquipoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true },
  });
  if (!usuarioDB?.empresa) redirect("/dashboard");

  const repartidores = await prisma.usuario.findMany({
    where: {
      empresaId: usuarioDB.empresa.id,
      rol: "repartidor",
    },
    include: {
      _count: { select: { pedidosAsignados: true } },
      pedidosAsignados: {
        where: { estado: { in: ["pendiente", "en_ruta"] } },
        select: { id: true, estado: true },
      },
      ubicaciones: {
        orderBy: { timestamp: "desc" },
        take: 1,
        select: { lat: true, lng: true, timestamp: true },
      },
    },
    orderBy: { nombre: "asc" },
  });

  const activos = repartidores.filter((r) => {
    const ult = r.ubicaciones[0]?.timestamp ?? null;
    return calcularEstado(ult).activo;
  }).length;

  const stats = [
    { label: "Total flota", value: repartidores.length, color: "text-white" },
    { label: "Activos", value: activos, color: "text-emerald-400" },
    {
      label: "En pausa",
      value: repartidores.filter((r) => {
        const ult = r.ubicaciones[0]?.timestamp ?? null;
        const e = calcularEstado(ult);
        return !e.activo && e.texto === "En pausa";
      }).length,
      color: "text-amber-400",
    },
    {
      label: "Sin señal",
      value: repartidores.filter((r) => {
        const ult = r.ubicaciones[0]?.timestamp ?? null;
        return calcularEstado(ult).texto !== "Activo" && calcularEstado(ult).texto !== "En pausa";
      }).length,
      color: "text-red-400",
    },
  ];

  return (
    <PageWrapper className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto text-zinc-100 selection:bg-purple-500/30">

      {/* Header */}
      <AnimatedHeader className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-purple-500 font-bold">
            Operación
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
            Equipo de repartidores
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {repartidores.length} repartidores en tu flota ·{" "}
            <span className="text-emerald-400 font-medium">{activos} activos ahora</span>
          </p>
        </div>
        <Link
          href="/dashboard/equipo/invitar"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Invitar repartidor
        </Link>
      </AnimatedHeader>

      {/* Stats rápidas — con hover lift por tarjeta */}
      <AnimatedGrid className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <AnimatedCard
            key={stat.label}
            className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 backdrop-blur cursor-default"
          >
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
              {stat.label}
            </div>
            <div className={`text-3xl font-semibold tabular-nums ${stat.color}`}>
              {stat.value}
            </div>
          </AnimatedCard>
        ))}
      </AnimatedGrid>

      {/* Tabla */}
      <AnimatedSection delay={0.15}>
        {repartidores.length === 0 ? (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-16 text-center">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-white font-semibold mb-1">Sin repartidores aún</h3>
            <p className="text-zinc-400 text-sm">
              Invita a tu equipo para ver su actividad en tiempo real aquí.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-zinc-500 bg-zinc-950/20">
                <tr className="border-b border-white/[0.04]">
                  <th className="px-5 py-3 font-medium">Repartidor</th>
                  <th className="px-5 py-3 font-medium">Vehículo</th>
                  <th className="px-5 py-3 font-medium">Pedidos activos</th>
                  <th className="px-5 py-3 font-medium">Última ubicación GPS</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Última conexión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {repartidores.map((rep) => {
                  const iniciales = (rep.nombre ?? rep.email ?? "?")
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase();

                  const ultimaUbicacion = rep.ubicaciones[0] ?? null;
                  const ultimaConexion = ultimaUbicacion?.timestamp ?? null;
                  const estado = calcularEstado(ultimaConexion);
                  const pedidosActivos = rep.pedidosAsignados.length;
                  const totalPedidos = rep._count.pedidosAsignados;

                  const coordsText = ultimaUbicacion
                    ? `${ultimaUbicacion.lat.toFixed(4)}, ${ultimaUbicacion.lng.toFixed(4)}`
                    : "Sin datos GPS";

                  return (
                    <tr
                      key={rep.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Repartidor */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-purple-600 to-amber-500 text-xs font-bold text-white shadow-sm shrink-0">
                              {iniciales}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-900 ${
                                estado.activo ? "bg-emerald-500" : "bg-zinc-600"
                              }`}
                            />
                          </div>
                          <div>
                            <div className="font-medium text-white">{rep.nombre ?? "Sin nombre"}</div>
                            <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                              {rep.telefono ? (
                                <>
                                  <Phone className="h-3 w-3" />
                                  {rep.telefono}
                                </>
                              ) : (
                                <span className="italic">Sin teléfono</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Vehículo */}
                      <td className="px-5 py-4 text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 shrink-0" />
                          {rep.vehiculo ?? (
                            <span className="italic text-zinc-600">No registrado</span>
                          )}
                        </div>
                      </td>

                      {/* Pedidos activos / total */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="font-mono tabular-nums text-base text-white">
                              {pedidosActivos}
                            </span>
                            <span className="text-zinc-600 text-xs ml-1">/ {totalPedidos} total</span>
                          </div>
                          {pedidosActivos > 0 && (
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/5">
                              <div
                                className="h-full bg-gradient-to-r from-purple-600 to-amber-500 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(100, (pedidosActivos / Math.max(totalPedidos, 1)) * 100)}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Última ubicación GPS */}
                      <td className="px-5 py-4 text-zinc-400">
                        <div className="flex items-center gap-1.5 text-xs">
                          {ultimaUbicacion ? (
                            <>
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                              <span className="font-mono">{coordsText}</span>
                            </>
                          ) : (
                            <>
                              <WifiOff className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                              <span className="italic text-zinc-600">Sin ubicación</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${estado.clases}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full bg-current ${estado.activo ? "animate-pulse" : ""}`}
                          />
                          {estado.texto}
                        </span>
                      </td>

                      {/* Última conexión */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {tiempoRelativo(ultimaConexion)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AnimatedSection>

      {/* Nota informativa */}
      <p className="text-xs text-zinc-600 flex items-center gap-1.5">
        <Wifi className="h-3.5 w-3.5" />
        El estado se calcula en base a la última señal GPS recibida · Activo = últimos 5 min · En pausa = últimos 30 min
      </p>
    </PageWrapper>
  );
}
