"use client";

import { useState } from "react";
import { invitarRepartidor } from "../actions";
import { Plus, X, Loader2 } from "lucide-react";

export function FormInvitarRepartidor() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setErrorMsg("");
    
    const res = await invitarRepartidor(formData);
    
    setIsPending(false);
    
    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      setIsOpen(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:opacity-90 transition-opacity"
      >
        <Plus className="h-4 w-4" /> Invitar repartidor
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/[0.04] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-xl font-semibold text-white mb-1">Invitar nuevo repartidor</h2>
            <p className="text-sm text-zinc-400 mb-6">Completa los datos para registrar a un nuevo miembro en tu flota. Su contraseña temporal será <strong>RouteAI2026!</strong></p>
            
            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {errorMsg}
              </div>
            )}

            <form action={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  name="nombre" 
                  required 
                  placeholder="Ej: Juan Pérez"
                  className="w-full bg-zinc-950 border border-white/[0.04] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  placeholder="juan@ejemplo.com"
                  className="w-full bg-zinc-950 border border-white/[0.04] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Teléfono (Obligatorio en Chile)</label>
                <input 
                  type="tel" 
                  name="telefono"
                  required
                  defaultValue="+569"
                  placeholder="+56 9 1234 5678"
                  className="w-full bg-zinc-950 border border-white/[0.04] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Asegúrate de mantener el prefijo +56.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Vehículo</label>
                  <input 
                    type="text" 
                    name="vehiculo"
                    placeholder="Ej: Moto, Furgón"
                    className="w-full bg-zinc-950 border border-white/[0.04] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Patente</label>
                  <input 
                    type="text" 
                    name="patente"
                    placeholder="Ej: AB-CD-12"
                    className="w-full bg-zinc-950 border border-white/[0.04] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 uppercase"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white text-zinc-950 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Crear Repartidor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
