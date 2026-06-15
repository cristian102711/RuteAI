// apps/web/app/dashboard/incidencias/page.tsx
import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { IncidenciasClient } from "./IncidenciasClient";

export const dynamic = "force-dynamic";

export default async function IncidenciasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true },
  });

  if (!usuarioDB || !usuarioDB.empresa) {
    redirect("/dashboard");
  }

  // Obtener pedidos fallidos (Incidencias Abiertas)
  const incidencias = await prisma.pedido.findMany({
    where: {
      empresaId: usuarioDB.empresaId,
      estado: "fallido",
    },
    include: {
      repartidor: { select: { id: true, nombre: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Obtener todos los pedidos creados hoy para calcular la tasa de incidencias
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const totalPedidosHoy = await prisma.pedido.count({
    where: {
      empresaId: usuarioDB.empresaId,
      createdAt: { gte: hoy },
    },
  });

  const fallidosHoy = await prisma.pedido.count({
    where: {
      empresaId: usuarioDB.empresaId,
      estado: "fallido",
      updatedAt: { gte: hoy },
    },
  });

  // SLA Vencido: Incidencias abiertas creadas hace más de 1 hora
  const limiteSLA = new Date(Date.now() - 60 * 60 * 1000);
  const slaVencidoCount = incidencias.filter(
    (i) => i.updatedAt < limiteSLA
  ).length;

  const tasaIncidencias = totalPedidosHoy > 0 
    ? parseFloat(((fallidosHoy / totalPedidosHoy) * 100).toFixed(1)) 
    : 0;

  return (
    <IncidenciasClient
      incidencias={incidencias.map((i) => ({
        id: i.id,
        nombreCliente: i.nombreCliente,
        direccion: i.direccion,
        producto: i.producto,
        clienteTelefono: i.clienteTelefono,
        motivoFallo: i.motivoFallo,
        updatedAt: i.updatedAt.toISOString(),
        repartidorNombre: i.repartidor?.nombre ?? "Sin asignar",
      }))}
      metrics={{
        abiertasCount: incidencias.length,
        slaVencidoCount,
        enResolucionCount: Math.round(incidencias.length * 0.4), // Estimación / Mock de incidentes siendo procesados
        tasaIncidencias,
      }}
    />
  );
}
