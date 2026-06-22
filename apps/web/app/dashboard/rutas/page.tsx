import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { RutasMapaClient } from "./RutasMapaClient";
import { callCore } from "@/lib/coreServiceClient";

export default async function RutasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Perfil de la empresa propia (core no expone un endpoint "mi empresa")
  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true },
  });

  if (!usuarioDB?.empresa) redirect("/login");

  // Pedidos activos (pendiente/en_ruta) de la empresa, vía core
  let pedidosEnRuta: any[] = [];
  try {
    const todos = await callCore<any[]>("/api/v1/orders");
    pedidosEnRuta = todos
      .filter((p) => ["pendiente", "en_ruta"].includes(p.estado))
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
      .slice(0, 20);
  } catch {
    pedidosEnRuta = [];
  }

  // Última ubicación GPS de cada repartidor activo, vía core
  let ultimasUbicaciones: any[] = [];
  try {
    ultimasUbicaciones = await callCore<any[]>("/api/v1/locations");
  } catch {
    ultimasUbicaciones = [];
  }

  return (
    <RutasMapaClient
      empresaId={usuarioDB.empresaId}
      empresaNombre={usuarioDB.empresa.nombre}
      pedidos={pedidosEnRuta}
      ultimasUbicaciones={ultimasUbicaciones}
    />
  );
}
