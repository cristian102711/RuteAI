import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, ArrowLeft } from "lucide-react";
import prisma from "@ruteai/database";
import { FormCrearPedido } from "../../components/FormCrearPedido";

export default async function CrearPedidoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Empresa + repartidores de la empresa (para asignar al crear)
  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { empresaId: true },
  });
  if (!usuarioDB) redirect("/dashboard");

  const repartidores = await prisma.usuario.findMany({
    where: { empresaId: usuarioDB.empresaId, rol: "repartidor" },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="font-sans px-2">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 flex flex-col border-b border-white/[0.04] pb-6">
          <Link href="/dashboard/pedidos" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4 text-sm font-medium w-fit">
            <ArrowLeft className="w-4 h-4" /> Volver a Pedidos
          </Link>
          <div className="flex flex-col gap-1">
            <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-1 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Logística
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
              Nuevo <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Pedido</span>
            </h1>
            <p className="text-zinc-500/90 text-sm">
              Fija la ubicación en el mapa, la hora límite (SLA) y, si quieres, el repartidor. La IA calculará el riesgo automáticamente.
            </p>
          </div>
        </header>

        <section className="bg-zinc-900/40 backdrop-blur-md border border-white/[0.04] rounded-3xl p-8 shadow-xl">
          <FormCrearPedido empresaId={usuarioDB.empresaId} repartidores={repartidores} />
        </section>
      </div>
    </div>
  );
}
