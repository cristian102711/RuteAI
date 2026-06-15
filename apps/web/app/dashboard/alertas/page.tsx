// app/dashboard/alertas/page.tsx
import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { IncidenciasClient } from "./IncidenciasClient";
import type { Alerta } from "@ruteai/database";

type AlertaConRepartidor = Alerta & {
  repartidor: { id: string; nombre: string } | null;
};

export const metadata = {
  title: "Centro de Incidencias — RuteAI",
  description: "Gestiona alertas y resuelve entregas fallidas antes de que escalen.",
};

export default async function AlertasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true },
  });

  if (!usuarioDB?.empresa) redirect("/dashboard");

  const empresaId = usuarioDB.empresa.id;

  // Alertas con repartidor
  const alertas = await prisma.alerta.findMany({
    where: { empresaId },
    include: { repartidor: { select: { id: true, nombre: true } } },
    orderBy: [{ leida: "asc" }, { createdAt: "desc" }],
    take: 200,
  }) as AlertaConRepartidor[];

  // Total pedidos para calcular tasa de incidencias
  const totalPedidos = await prisma.pedido.count({ where: { empresaId } });

  return (
    <IncidenciasClient
      alertas={alertas}
      empresaId={empresaId}
      totalPedidos={totalPedidos}
    />
  );
}
