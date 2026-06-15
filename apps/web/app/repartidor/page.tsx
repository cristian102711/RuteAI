import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import prisma from "@ruteai/database";
import { RepartidorClient } from "./RepartidorClient";

export default async function RepartidorPage() {
  // ── Autenticación ────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Buscar repartidor en DB ──────────────────────────────────
  const repartidor = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: { select: { nombre: true } } },
  });

  // Si no existe o no es repartidor → al login
  if (!repartidor) redirect("/login");

  // ── Cargar pedidos del día asignados a este repartidor ───────
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const pedidos = await prisma.pedido.findMany({
    where: {
      empresaId:   repartidor.empresaId,
      repartidorId: repartidor.id,
      estado: { in: ["pendiente", "en_ruta"] },
    },
    orderBy: [
      { estado: "asc" },    // en_ruta primero
      { createdAt: "asc" },
    ],
    select: {
      id:             true,
      nombreCliente:  true,
      clienteTelefono: true,
      direccion:      true,
      producto:       true,
      horarioPreferido: true,
      estado:         true,
      lat:            true,
      lng:            true,
    },
  });

  const total     = pedidos.length;
  const entregados = 0; // los entregados ya no aparecen en la lista
  const progreso  = total === 0 ? 100 : Math.round((entregados / (total + entregados)) * 100);

  // Primer pedido (próxima parada) vs el resto
  const [proxima, ...restantes] = pedidos;

  return (
    <RepartidorClient
      repartidor={{
        id:     repartidor.id,
        nombre: repartidor.nombre,
        initials: repartidor.nombre
          .split(" ")
          .slice(0, 2)
          .map((w) => w[0])
          .join("")
          .toUpperCase(),
      }}
      proxima={proxima ?? null}
      restantes={restantes}
      total={total}
      progreso={progreso}
      empresaNombre={repartidor.empresa?.nombre ?? ""}
    />
  );
}
