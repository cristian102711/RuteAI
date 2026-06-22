import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import prisma from "@ruteai/database";
import { EditarPedidoForm, type Pedido } from "./EditarPedidoForm";

export default async function EditarPedidoPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { empresaId: true },
  });

  const pedido = usuarioDB
    ? await prisma.pedido.findFirst({
        where: { id: params.id, empresaId: usuarioDB.empresaId },
      }) as Pedido | null
    : null;

  if (!pedido) {
    redirect("/dashboard/pedidos");
  }

  return (
    <div className="font-sans px-2">
      <div className="max-w-2xl mx-auto">
        <EditarPedidoForm pedido={pedido} />
      </div>
    </div>
  );
}
