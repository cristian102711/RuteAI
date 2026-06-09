import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import prisma from "@ruteai/database";
import { RepartidorApp } from "./RepartidorApp";

export default async function RepartidorDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/repartidor/login?error=no_autorizado");

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: { select: { nombre: true } } },
  });
  if (!usuarioDB || usuarioDB.rol !== "repartidor") redirect("/repartidor/login?error=no_autorizado");

  const pedidos = await prisma.pedido.findMany({
    where: { repartidorId: user.id },
    select: {
      id: true,
      nombreCliente: true,
      clienteTelefono: true,
      direccion: true,
      estado: true,
      lat: true,
      lng: true,
      producto: true,
      horarioPreferido: true,
      scoreRiesgo: true,
    },
    orderBy: [{ estado: "asc" }, { createdAt: "asc" }],
  });

  return (
    <RepartidorApp
      usuario={{
        id: user.id,
        nombre: usuarioDB.nombre,
        email: user.email ?? "",
        vehiculo: usuarioDB.vehiculo ?? null,
        telefono: usuarioDB.telefono ?? null,
        empresaNombre: usuarioDB.empresa?.nombre ?? null,
      }}
      pedidosIniciales={pedidos}
    />
  );
}
