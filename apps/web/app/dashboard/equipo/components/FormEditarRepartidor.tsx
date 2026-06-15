"use client";

import { useState } from "react";
import { editarRepartidor } from "../actions";
import { Pencil, X, Loader2 } from "lucide-react";

interface Props {
  repartidor: {
    id: string;
    nombre: string;
    telefono: string | null;
    vehiculo: string | null;
    patente: string | null;
  };
}

export function FormEditarRepartidor({ repartidor }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setErrorMsg("");

    const res = await editarRepartidor(formData);

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
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all duration-200"
        title="Editar repartidor"
      >
        <Pencil className="h-3.5 w-3.5" /> Editar
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

            <h2 className="text-xl font-semibold text-white mb-1">Editar repartidor</h2>
            <p className="text-sm text-zinc-400 mb-6">
              Modifica los datos de <strong>{repartidor.nombre}</strong>
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {errorMsg}
              </div>
            )}

            <form action={handleSubmit} className="space-y-4">
              <input type="hidden" name="id" value={repartidor.id} />

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  name="nombre"
                  required
                  defaultValue={repartidor.nombre}
                  className="w-full bg-zinc-950 border border-white/[0.04] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  defaultValue={repartidor.telefono ?? ""}
                  placeholder="+56 9 1234 5678"
                  className="w-full bg-zinc-950 border border-white/[0.04] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Vehículo / Modelo</label>
                  <input
                    type="text"
                    name="vehiculo"
                    defaultValue={repartidor.vehiculo ?? ""}
                    placeholder="Ej: Moto Italika DT 200"
                    className="w-full bg-zinc-950 border border-white/[0.04] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Patente</label>
                  <input
                    type="text"
                    name="patente"
                    defaultValue={repartidor.patente ?? ""}
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
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
