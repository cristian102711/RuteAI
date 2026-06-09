"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Package, ArrowLeft, Save } from "lucide-react";
import { editarPedido } from "../../../actions"; 

interface Pedido {
  id: string;
  nombreCliente: string;
  direccion: string;
  producto: string;
  clienteTelefono?: string | null;
}

export function EditarPedidoForm({ pedido }: { pedido: Pedido }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const toastId = toast.loading("Guardando cambios...");
    try {
      formData.append("pedidoId", pedido.id);
      const res = await editarPedido(formData);
      if (res?.error) throw new Error(res.error);
      
      toast.success("Pedido actualizado", { id: toastId });
      router.push("/dashboard/pedidos");
    } catch (e: any) {
      toast.error(e.message || "Error al actualizar", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="mb-8 flex flex-col border-b border-white/[0.04] pb-6">
        <Link href="/dashboard/pedidos" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4 text-sm font-medium w-fit">
          <ArrowLeft className="w-4 h-4" /> Volver a Pedidos
        </Link>
        <div className="flex flex-col gap-1">
          <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-1 flex items-center gap-2">
             <Package className="w-4 h-4" />
             Edición
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Editar <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">#{pedido.id.slice(-4).toUpperCase()}</span>
          </h1>
          <p className="text-zinc-500/90 text-sm">
            Modifica la información del envío.
          </p>
        </div>
      </header>

      <section className="bg-zinc-900/40 backdrop-blur-md border border-white/[0.04] rounded-3xl p-8 shadow-xl">
        <form action={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Cliente / Destinatario</label>
            <input 
              name="cliente" 
              required 
              defaultValue={pedido.nombreCliente}
              className="bg-zinc-950/80 border border-white/[0.04] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 text-white transition-all outline-none"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Teléfono Destinatario (SMS/WhatsApp)</label>
            <input 
              name="clienteTelefono" 
              type="tel"
              defaultValue={pedido.clienteTelefono || ""}
              placeholder="Ej: +56912345678"
              className="bg-zinc-950/80 border border-white/[0.04] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 text-white transition-all outline-none"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Dirección completa</label>
            <input 
              name="direccion" 
              required 
              defaultValue={pedido.direccion}
              className="bg-zinc-950/80 border border-white/[0.04] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 text-white transition-all outline-none"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Producto / Contenido</label>
            <input 
              name="producto" 
              required 
              defaultValue={pedido.producto}
              className="bg-zinc-950/80 border border-white/[0.04] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 text-white transition-all outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/[0.04]">
            <Link 
              href="/dashboard/pedidos"
              className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-white/[0.04] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
            >
              Cancelar
            </Link>
            <button 
              type="submit" 
              disabled={loading}
              className="px-5 py-2.5 text-sm rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold transition-all duration-300 disabled:opacity-50 flex gap-2 items-center active:scale-95 shadow-lg shadow-amber-500/20"
            >
               {loading ? (
                 <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
               ) : (
                 <><Save className="w-4 h-4"/> Guardar cambios</>
               )}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
