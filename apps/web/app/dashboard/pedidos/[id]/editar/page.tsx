import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { EditarPedidoForm } from "./EditarPedidoForm";

export default async function EditarPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const pedido = await prisma.pedido.findUnique({
    where: { id },
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
