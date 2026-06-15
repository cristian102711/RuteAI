"use client";

import { useState } from "react";
import { completarRegistroRepartidor } from "./actions";
import { Loader2, User, Phone, Truck, Hash, CheckCircle2 } from "lucide-react";

interface Props {
  userId:          string;
  email:           string;
  empresaId:       string;
  defaultNombre:   string;
  defaultTelefono: string;
  defaultVehiculo: string;
  defaultPatente:  string;
}

export function RegistroRepartidorForm({
  userId, email, empresaId,
  defaultNombre, defaultTelefono, defaultVehiculo, defaultPatente,
}: Props) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError]         = useState("");

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError("");
    const res = await completarRegistroRepartidor(formData);
    if (res?.error) {
      setError(res.error);
      setIsPending(false);
    }
    // Si redirige, el pending se mantiene (esperado)
  }

  return (
    <form
      action={handleSubmit}
      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5"
    >
      {/* Campos ocultos */}
      <input type="hidden" name="userId"    value={userId} />
      <input type="hidden" name="email"     value={email} />
      <input type="hidden" name="empresaId" value={empresaId} />

      {/* Email (solo lectura) */}
      <div className="flex items-center gap-3 rounded-xl border border-zinc-700/50 bg-zinc-800/40 px-4 py-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Email verificado</p>
          <p className="text-sm font-medium text-zinc-200">{email}</p>
        </div>
      </div>

      {/* Nombre */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
          <User className="h-3.5 w-3.5" /> Nombre completo *
        </label>
        <input
          type="text"
          name="nombre"
          required
          defaultValue={defaultNombre}
          placeholder="Ej: Juan Pérez"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 focus:outline-none transition-colors"
        />
      </div>

      {/* Teléfono */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
          <Phone className="h-3.5 w-3.5" /> Teléfono *
        </label>
        <input
          type="tel"
          name="telefono"
          required
          defaultValue={defaultTelefono || "+569"}
          placeholder="+56 9 1234 5678"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 focus:outline-none transition-colors"
        />
      </div>

      {/* Vehículo + Patente */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
            <Truck className="h-3.5 w-3.5" /> Vehículo
          </label>
          <input
            type="text"
            name="vehiculo"
            defaultValue={defaultVehiculo}
            placeholder="Ej: Moto, Furgón"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
            <Hash className="h-3.5 w-3.5" /> Patente
          </label>
          <input
            type="text"
            name="patente"
            defaultValue={defaultPatente}
            placeholder="AB-CD-12"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white uppercase placeholder:text-zinc-600 focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 py-4 text-sm font-black text-white shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        {isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Guardando tu perfil…</>
        ) : (
          "Comenzar a repartir →"
        )}
      </button>

      <p className="text-center text-[10px] text-zinc-600">
        Al continuar aceptas los términos de RuteAI. Tu información solo será visible para tu empresa.
      </p>
    </form>
  );
}
