import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { EditarPedidoForm } from "./EditarPedidoForm";

export default async function EditarPedidoPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const pedido = await prisma.pedido.findUnique({
    where: { id: params.id },
  });

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
