// app/dashboard/page.tsx
import prisma from "@/lib/prisma";
import { FormCrearPedido } from "./components/FormCrearPedido";
import { FormCrearRepartidor } from "./components/FormCrearRepartidor";
import { FilaPedido } from "./components/FilaPedido";
import { MapaWrapper } from "./components/MapaWrapper";

// Este es el Centro de Operaciones. Un Server Component seguro.
export default async function DashboardPage() {
  
  const empresaActiva = await prisma.empresa.findFirst();

  if (!empresaActiva) {
    return <div className="p-10 text-xl font-bold text-red-400 bg-zinc-950 h-screen">🚨 Error: Ninguna empresa encontrada.</div>;
  }

  const pedidos = await prisma.pedido.findMany({
    where: { empresaId: empresaActiva.id },
    orderBy: { createdAt: "desc" },
    include: { repartidor: true } // Include driver data
  });

  const repartidores = await prisma.usuario.findMany({
    where: { empresaId: empresaActiva.id, rol: "repartidor" }
  });

  return (
    <div className="font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabecera del Panel */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-white">
              Operaciones: <span className="text-emerald-400">{empresaActiva.nombre}</span>
            </h1>
            <p className="text-zinc-500">Gestión logística y predicción de riesgo RouteAI.</p>
          </div>
          <div className="mt-4 md:mt-0 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-sm font-medium text-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sistema en Línea
          </div>
        </header>

        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Pedidos", value: pedidos.length, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            { label: "Pendientes", value: pedidos.filter(p => p.estado === "pendiente").length, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
            { label: "Entregados", value: pedidos.filter(p => p.estado === "entregado").length, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
            { label: "Riesgo IA (>70%)", value: pedidos.filter(p => (p.scoreRiesgo ?? 0) > 70 && p.estado === "pendiente").length, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" }
          ].map((stat, i) => (
            <div key={i} className={`p-5 rounded-2xl border bg-zinc-900 shadow-lg ${stat.border}`}>
              <p className="text-zinc-500 text-sm font-medium mb-1">{stat.label}</p>
              <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Zona Central: Formulario y Mapa */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
          
          <div className="xl:col-span-1 flex flex-col gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl h-fit">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                <span className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">⚡</span>
                Despachar Nuevo Pedido
              </h2>
              <FormCrearPedido empresaId={empresaActiva.id} />
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl h-fit">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                <span className="p-2 bg-blue-500/10 rounded-lg text-blue-400">👥</span>
                Equipo de Reparto
              </h2>
              <FormCrearRepartidor empresaId={empresaActiva.id} />
              
              <div className="mt-4 flex flex-col gap-2">
                {repartidores.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No hay repartidores registrados aún.</p>
                ) : (
                  repartidores.map(rep => (
                    <div key={rep.id} className="flex justify-between items-center text-sm p-2 bg-zinc-950 rounded border border-zinc-800">
                      <span className="text-zinc-300 font-medium">{rep.nombre}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 flex flex-col gap-6">
            {/* MAPA DE TRACKING */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl w-full">
              <MapaWrapper pedidos={pedidos} />
            </div>

            {/* LISTA DE PEDIDOS */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                  <span className="p-2 bg-blue-500/10 rounded-lg text-blue-400">📦</span>
                  Despachos en Curso ({pedidos.length})
                </h2>
              </div>
              
              <div className="overflow-y-auto max-h-[500px] p-6 flex flex-col gap-3">
                {pedidos.length === 0 ? (
                  <div className="text-center text-zinc-500 py-16 flex flex-col items-center justify-center">
                    <span className="text-4xl mb-3 opacity-50">📭</span>
                    <p>Sin despachos hoy. ¡Crea el primero!</p>
                  </div>
                ) : (
                  pedidos.map((pedido) => (
                     <FilaPedido key={pedido.id} pedido={pedido} repartidores={repartidores} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
