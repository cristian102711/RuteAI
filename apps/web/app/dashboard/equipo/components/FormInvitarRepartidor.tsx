"use client";

import { useState } from "react";
import { invitarRepartidor } from "../actions";
import { Plus, X, Loader2, Mail, CheckCircle2, Send } from "lucide-react";

export function FormInvitarRepartidor() {
  const [isOpen, setIsOpen]     = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [emailEnviado, setEmailEnviado] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setErrorMsg("");

    const res = await invitarRepartidor(formData);
    setIsPending(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else if (res?.success) {
      setEmailEnviado(res.email as string);
    }
  }

  function handleClose() {
    setIsOpen(false);
    setEmailEnviado(null);
    setErrorMsg("");
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(168,85,247,0.25)] hover:opacity-90 transition-opacity active:scale-95"
      >
        <Plus className="h-4 w-4" /> Invitar repartidor
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/[0.06] rounded-3xl w-full max-w-md shadow-2xl shadow-black/50 relative overflow-hidden">

            {/* Barra superior */}
            <div className="h-1 w-full bg-gradient-to-r from-purple-600 to-amber-500" />

            <div className="p-6">
              {/* Cabecera */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {emailEnviado ? "¡Invitación enviada! 🎉" : "Invitar nuevo repartidor"}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {emailEnviado
                      ? "El repartidor recibirá un email con su acceso"
                      : "Se enviará un email con el link de acceso"}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="grid h-8 w-8 place-items-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ── ESTADO: EMAIL ENVIADO ── */}
              {emailEnviado ? (
                <div className="space-y-5">
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      <Mail className="h-8 w-8 text-emerald-400" />
                      <div className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-500">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Email enviado a:</p>
                      <p className="text-amber-400 font-mono text-sm mt-1">{emailEnviado}</p>
                    </div>
                    <div className="w-full rounded-xl border border-zinc-700/50 bg-zinc-800/40 px-4 py-3 text-left space-y-2">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">¿Qué pasa ahora?</p>
                      {[
                        "El repartidor recibe un email de RuteAI",
                        "Hace click en el link de invitación",
                        "Elige su contraseña y confirma su perfil",
                        "Ya puede ingresar al portal de repartidores",
                      ].map((paso, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-purple-500/20 text-[9px] font-black text-purple-400">
                            {i + 1}
                          </span>
                          <p className="text-xs text-zinc-400">{paso}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleClose}
                    className="w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 text-sm transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                /* ── FORMULARIO ── */
                <form action={handleSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    {/* Nombre */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        required
                        placeholder="Ej: Juan Pérez"
                        className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition-colors placeholder:text-zinc-600"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                        Correo electrónico *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="juan@ejemplo.com"
                        className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition-colors placeholder:text-zinc-600"
                      />
                    </div>

                    {/* Teléfono */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        name="telefono"
                        defaultValue="+569"
                        placeholder="+56 9 1234 5678"
                        className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition-colors placeholder:text-zinc-600"
                      />
                    </div>

                    {/* Vehículo + Patente */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                          Vehículo
                        </label>
                        <input
                          type="text"
                          name="vehiculo"
                          placeholder="Ej: Moto"
                          className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition-colors placeholder:text-zinc-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                          Patente
                        </label>
                        <input
                          type="text"
                          name="patente"
                          placeholder="AB-CD-12"
                          className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition-colors uppercase placeholder:text-zinc-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white border border-zinc-700 hover:bg-zinc-800 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-amber-500 text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                      {isPending
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</>
                        : <><Send className="h-4 w-4" /> Enviar invitación</>
                      }
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
