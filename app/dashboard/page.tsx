// app/dashboard/page.tsx
import prisma from "@/lib/prisma";
import { FormCrearPedido } from "./components/FormCrearPedido";
import { FilaPedido } from "./components/FilaPedido";
import { createClient } from "@/lib/supabaseServer"; // ¡Corregido! En Server Components se usa el del servidor.
import { redirect } from "next/navigation"; // ¡Faltaba este import!

// Este es el Centro de Operaciones. Un Server Component seguro.
export default async function DashboardPage() {

  // 1. Primero verificamos si hay un usuario logueado en Supabase
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();


  if (!user) {
    return redirect("/login");
  }

  // Buscar el perfil de este usuario en base de datos prisma
  // Incluimos la empresa para tener sus datos de una vez.
  const usuarioConEmpresa = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true }
  });

  // Si el usuario no tiene perfil aún, mostramos un error o redirigimos
  if (!usuarioConEmpresa) {
    return (
      <div className="p-10 text-xl font-bold text-red-400 bg-zinc-950 h-screen">
        Error: Tu cuenta no está vinculada a ninguna empresa en el sistema.
      </div>
    );
  }

  const empresaActiva = usuarioConEmpresa.empresa;

  //Traemos solo los pedidos de ESA empresa
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
