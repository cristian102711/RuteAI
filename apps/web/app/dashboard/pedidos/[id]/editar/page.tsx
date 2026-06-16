import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { callCore } from "@/lib/coreServiceClient";
import { EditarPedidoForm } from "./EditarPedidoForm";

export default async function EditarPedidoPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let pedido = null;
  try {
    pedido = await callCore(`/api/v1/orders/${params.id}`);
  } catch {
    // Pedido inexistente o fuera de alcance — redirige abajo
  }

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
