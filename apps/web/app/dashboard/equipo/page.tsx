import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Phone, Truck, Mail, CreditCard } from "lucide-react";
import { FormInvitarRepartidor } from "./components/FormInvitarRepartidor";
import { FormEditarRepartidor } from "./components/FormEditarRepartidor";

export default async function EquipoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
    },
    orderBy: { nombre: "asc" },
  });

  // Datos mock exactos de Lovable para rellenar lo que no está en la BD
  const mockData = [
    {
      tel: "+52 55 4821 0394",
      vehiculo: "Moto · Italika DT 200",
      pedidos: 8,
      progreso: "66.66666666666666%",
      ubicacion: "Polanco, CDMX",
      estado: "Activo",
      estadoClasses: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
      tiempo: "hace 30 s"
    },
    {
      tel: "+57 311 482 9920",
      vehiculo: "Van · Renault Kangoo",
      pedidos: 12,
      progreso: "100%",
      ubicacion: "Chapinero, Bogotá",
      estado: "Activo",
      estadoClasses: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
      tiempo: "hace 1 min"
    },
    {
      tel: "+54 9 11 6044 2210",
      vehiculo: "Auto · Fiat Cronos",
      pedidos: 6,
      progreso: "50%",
      ubicacion: "Palermo, Buenos Aires",
      estado: "Activo",
      estadoClasses: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
      tiempo: "hace 2 min"
    },
    {
      tel: "+56 9 8421 0029",
      vehiculo: "Moto · Honda CB 190R",
      pedidos: 9,
      progreso: "75%",
      ubicacion: "Las Condes, Santiago",
      estado: "En descanso",
      estadoClasses: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
      tiempo: "hace 18 min"
    },
    {
      tel: "+51 987 220 410",
      vehiculo: "Moto · Bajaj Pulsar",
      pedidos: 0,
      progreso: "0%",
      ubicacion: "Miraflores, Lima",
      estado: "Inactivo",
      estadoClasses: "bg-red-500/15 text-red-400 ring-red-500/30",
      tiempo: "hace 6 h"
    }
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto text-zinc-100 selection:bg-purple-500/30">
      
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-purple-500 font-bold">
            Operación
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
            Equipo de repartidores
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {repartidores.length} repartidores en tu flota
          </p>
        </div>
        <FormInvitarRepartidor />
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-zinc-800 bg-white/[0.02] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-zinc-500 bg-zinc-950/20">
            <tr className="border-b border-zinc-800">
              <th className="px-5 py-3 font-medium">Repartidor</th>
              <th className="px-5 py-3 font-medium">Vehículo</th>
              <th className="px-5 py-3 font-medium">Pedidos</th>
              <th className="px-5 py-3 font-medium">Patente</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium">Última conexión</th>
              <th className="px-5 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {repartidores.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-zinc-500">
                  No hay repartidores en tu equipo.
                </td>
              </tr>
            ) : (
              repartidores.map((rep: any, idx: number) => {
                const iniciales = (rep.nombre ?? rep.email ?? "?")
                  .split(" ")
                  .slice(0, 2)
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase();

                const mock = mockData[idx % mockData.length];
                
                // Usar datos reales
                const telefono = rep.telefono ?? mock.tel;
                const totalPedidos = rep._count.pedidosAsignados; // Real count, 0 if new
                
                // Calculo real de progreso (ej. si 0, 0%)
                const progreso = totalPedidos > 0 ? `${Math.min(100, totalPedidos * 10)}%` : "0%";
                const estaActivo = totalPedidos > 0;
                
                const estadoTxt = estaActivo ? "Activo" : "Inactivo";
                const estadoCls = estaActivo ? mockData[0].estadoClasses : mockData[4].estadoClasses;

                const vehiculoDisplay = rep.vehiculo 
                  ? `${rep.vehiculo} ${rep.patente ? `· ${rep.patente}` : ''}`
                  : "No registrado";

                return (
                  <tr key={rep.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Repartidor */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-purple-600 to-amber-500 text-xs font-bold text-white shadow-sm">
                          {iniciales}
                        </div>
                        <div>
                          <div className="font-medium text-white">{rep.nombre ?? "Sin nombre"}</div>
                          <div className="flex items-center gap-1 text-xs text-zinc-500">
                            <Phone className="h-3 w-3" /> {telefono}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-zinc-500">
                            <Mail className="h-3 w-3" /> {rep.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Vehículo */}
                    <td className="px-5 py-3 text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5" /> {vehiculoDisplay}
                      </div>
                    </td>

                    {/* Pedidos (Barra de progreso) */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums text-base text-white">{totalPedidos}</span>
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-600 to-amber-500" 
                            style={{ width: progreso }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Patente */}
                    <td className="px-5 py-3 text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" /> {rep.patente ?? "Sin patente"}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${estadoCls}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {estadoTxt}
                      </span>
                    </td>

                    {/* Última conexión */}
                    <td className="px-5 py-3 text-zinc-500">
                      {mock.tiempo}
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-3">
                      <FormEditarRepartidor
                        repartidor={{
                          id: rep.id,
                          nombre: rep.nombre ?? "",
                          telefono: rep.telefono,
                          vehiculo: rep.vehiculo,
                          patente: rep.patente,
                        }}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
