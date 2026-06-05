import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { PlanesClient } from "./PlanesClient";

export default async function PlanesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true },
  });

  if (!usuarioDB && user.email) {
    usuarioDB = await prisma.usuario.findUnique({
      where: { email: user.email },
      include: { empresa: true },
    });
  }

  if (!usuarioDB || !usuarioDB.empresa) {
    redirect("/onboarding");
  }

  const planActual = usuarioDB.empresa.plan || "starter";
  // Extraemos el método de pago (es de tipo Json, puede ser null)
  const metodoPago = usuarioDB.empresa.metodoPago as any;

  return <PlanesClient planActual={planActual} metodoPago={metodoPago} />;
}
