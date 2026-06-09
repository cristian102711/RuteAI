import { ReactNode } from "react";
import type { Viewport } from "next";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import prisma from "@ruteai/database";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
};

export default async function RepartidorDashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/repartidor/login?error=no_autorizado");

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: { select: { nombre: true } } },
  });

  if (!usuarioDB) redirect("/repartidor/login?error=no_autorizado");
  if (usuarioDB.rol !== "repartidor") redirect("/dashboard");

  return <>{children}</>;
}
