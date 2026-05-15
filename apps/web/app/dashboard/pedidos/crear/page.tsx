"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Package, ArrowLeft, Save } from "lucide-react";
import { agregarPedidoNuevo } from "../../actions"; // <-- Check correct import path later

export default function CrearPedidoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const toastId = toast.loading("Creando pedido y calculando riesgo IA...");
    try {
      const res = await agregarPedidoNuevo(formData);
      if (res?.error) throw new Error(res.error);
      
      toast.success("Pedido creado exitosamente", { id: toastId });
      router.push("/dashboard/pedidos");
    } catch (e: any) {
      toast.error(e.message || "Error al crear", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="font-sans px-2">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 flex flex-col border-b border-zinc-800/50 pb-6">
          <Link href="/dashboard/pedidos" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4 text-sm font-medium w-fit">
            <ArrowLeft className="w-4 h-4" /> Volver a Pedidos
          </Link>
          <div className="flex flex-col gap-1">
            <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-1 flex items-center gap-2">
               <Package className="w-4 h-4" />
               Logística
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
              Nuevo <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Pedido</span>
            </h1>
            <p className="text-zinc-500/90 text-sm">
              Captura los datos del envío. La IA calculará el riesgo automáticamente.
            </p>
          </div>
        </header>

        <section className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-8 shadow-xl">
          <form action={handleSubmit} className="flex flex-col gap-5">
            <div className="grid gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Cliente / Destinatario</label>
              <input 
                name="cliente" 
                required 
                placeholder="Ej. Juan Pérez"
                className="bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 text-white transition-all outline-none"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Dirección completa</label>
              <input 
                name="direccion" 
                required 
                placeholder="Ej. Av. Providencia 1234, Depto 502, Santiago"
                className="bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 text-white transition-all outline-none"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Producto / Contenido</label>
              <input 
                name="producto" 
                required 
                placeholder="Ej. Monitor LG 27''"
                className="bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 text-white transition-all outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-800/50">
              <Link 
                href="/dashboard/pedidos"
                className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
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
                   <><Save className="w-4 h-4"/> Crear pedido</>
                 )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
