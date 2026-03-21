// app/dashboard/page.tsx
import prisma from "@/lib/prisma";
import { FormCrearPedido } from "./components/FormCrearPedido";
import { FilaPedido } from "./components/FilaPedido";

// Este es el Centro de Operaciones. Un Server Component seguro.
export default async function DashboardPage() {
  
  const empresaActiva = await prisma.empresa.findFirst();

  if (!empresaActiva) {
    return <div className="p-10 text-xl font-bold text-red-400 bg-zinc-950 h-screen">🚨 Error: Ninguna empresa encontrada.</div>;
  }

  const pedidos = await prisma.pedido.findMany({
    where: { empresaId: empresaActiva.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabecera del Panel */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">
              Operaciones: <span className="text-emerald-400">{empresaActiva.nombre}</span>
            </h1>
            <p className="text-zinc-500">Gestión logística y predicción de riesgo RouteAI.</p>
          </div>
        </header>

        {/* Zona del Formulario y las Estadísticas Rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          
          <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl h-fit">
            <h2 className="text-lg font-semibold mb-4 text-emerald-400">Despachar Nuevo Pedido</h2>
            
            {/* AQUÍ INYECTAMOS NUESTRO COMPONENTE DE CLIENTE (UX) */}
            <FormCrearPedido empresaId={empresaActiva.id} />

          </div>

          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h2 className="text-lg font-semibold text-zinc-100">Despachos en Curso ({pedidos.length})</h2>
            </div>
            
            <div className="overflow-y-auto max-h-[400px] p-6 flex flex-col gap-3">
              {pedidos.length === 0 ? (
                <div className="text-center text-zinc-500 py-10">Sin despachos hoy. ¡Crea el primero!</div>
              ) : (
                pedidos.map((pedido) => (
                   <FilaPedido key={pedido.id} pedido={pedido} />
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
