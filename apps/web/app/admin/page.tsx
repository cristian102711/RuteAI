import prisma from "@ruteai/database";
import { CrearEmpresaModal } from "./components/CrearEmpresaModal";
import { EmpresasTable } from "./components/EmpresasTable";

export default async function AdminPage() {
  const empresas = await prisma.empresa.findMany({
    include: { _count: { select: { usuarios: true, pedidos: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalUsuarios = empresas.reduce((acc, e) => acc + e._count.usuarios, 0);
  const totalActivas  = empresas.filter((e) => e.activa).length;
  const totalPedidos  = empresas.reduce((acc, e) => acc + e._count.pedidos, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-violet-400 text-sm font-bold tracking-widest uppercase mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            Panel de Control
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Gestión de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
              Empresas
            </span>
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            {empresas.length} tenants registrados · {totalActivas} activos
          </p>
        </div>
        <CrearEmpresaModal />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: "Total Empresas",   value: empresas.length, sub: "tenants registrados",   dot: "bg-violet-500" },
          { label: "Empresas Activas", value: totalActivas,    sub: "planes vigentes",        dot: "bg-emerald-500" },
          { label: "Total Usuarios",   value: totalUsuarios,   sub: "en todas las empresas",  dot: "bg-blue-500" },
          { label: "Total Pedidos",    value: totalPedidos,    sub: "histórico global",        dot: "bg-amber-500" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md p-6 hover:border-zinc-700 transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${kpi.dot}`} />
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{kpi.label}</p>
            </div>
            <p className="font-mono text-4xl font-extrabold text-white">{kpi.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabla con buscador */}
      <EmpresasTable empresas={empresas} />
    </div>
  );
}
