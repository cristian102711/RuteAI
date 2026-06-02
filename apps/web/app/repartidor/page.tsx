import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import prisma from "@ruteai/database";
import { RepartidorView } from "./RepartidorView";

export default async function RepartidorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { nombre: true, rol: true },
  });

  if (!usuarioDB || usuarioDB.rol !== "repartidor") redirect("/dashboard");

  const pedidos = await prisma.pedido.findMany({
    where: {
      repartidorId: user.id,
      estado: { in: ["pendiente", "en_ruta", "entregado"] },
    },
    select: {
      id: true,
      nombreCliente: true,
      clienteTelefono: true,
      direccion: true,
      producto: true,
      horarioPreferido: true,
      estado: true,
      lat: true,
      lng: true,
      scoreRiesgo: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Ordenar: en_ruta → pendiente → entregado
  const sorted = [
    ...pedidos.filter(p => p.estado === "en_ruta"),
    ...pedidos.filter(p => p.estado === "pendiente"),
    ...pedidos.filter(p => p.estado === "entregado"),
  ];

  const initials = usuarioDB.nombre
    .split(" ")
    .slice(0, 2)
    .map(n => n[0])
    .join("")
    .toUpperCase();

  return (
    <RepartidorView
      pedidos={sorted}
      userName={usuarioDB.nombre}
      userInitials={initials}
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? ""}
    />
  );
}
