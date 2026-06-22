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

  // Pedidos activos (pendiente/en_ruta) de la empresa
  let pedidosEnRuta: any[] = [];
  if (process.env.CORE_SERVICE_URL) {
    try {
      const todos = await callCore<any[]>("/api/v1/orders");
      pedidosEnRuta = todos
        .filter((p) => ["pendiente", "en_ruta"].includes(p.estado))
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
        .slice(0, 20);
    } catch {
      console.warn("[RutasPage] core-service no disponible para pedidos");
    }
  }
  if (pedidosEnRuta.length === 0) {
    pedidosEnRuta = await prisma.pedido.findMany({
      where: { empresaId: usuarioDB.empresaId, estado: { in: ["pendiente", "en_ruta"] } },
      orderBy: { createdAt: "asc" },
      take: 20,
      include: { repartidor: { select: { id: true, nombre: true } } },
    });
  }

  // Última ubicación GPS de cada repartidor activo
  let ultimasUbicaciones: any[] = [];
  if (process.env.CORE_SERVICE_URL) {
    try {
      ultimasUbicaciones = await callCore<any[]>("/api/v1/locations");
    } catch {
      console.warn("[RutasPage] core-service no disponible para ubicaciones");
    }
  }
  if (ultimasUbicaciones.length === 0) {
    // Obtener repartidores con ubicaciones recientes
    const reps = await prisma.usuario.findMany({
      where: { empresaId: usuarioDB.empresaId, rol: "repartidor" },
      select: { id: true, nombre: true },
    });
    for (const rep of reps) {
      const ultima = await prisma.ubicacion.findFirst({
        where: { repartidorId: rep.id },
        orderBy: { timestamp: "desc" },
      });
      if (ultima) {
        ultimasUbicaciones.push({ ...ultima, repartidorNombre: rep.nombre });
      }
    }
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
