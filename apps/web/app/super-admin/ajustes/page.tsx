"use client";

import { useState } from "react";
import { Save, ShieldAlert, Cpu, Mail, Globe, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function SuperAdminAjustes() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [rateLimit, setRateLimit] = useState(100);
  const [alertEmail, setAlertEmail] = useState("soporte@routeai.app");
  const [iaProvider, setIaProvider] = useState("openai");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Simular guardado
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Ajustes de la plataforma guardados correctamente");
    }, 1000);
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div>
        <div className="text-xs uppercase tracking-widest text-purple-500">Configuración global</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Ajustes</h1>
        <p className="mt-1 text-sm text-zinc-400">Modifica las variables de operación de la plataforma RouteAI.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        {/* Mantenimiento */}
        <div className="rounded-xl border border-zinc-800 bg-white/[0.02] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-semibold text-white">Estado de la Plataforma</h3>
              <p className="text-xs text-zinc-400">Controla el acceso público a los servicios.</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
            <div>
              <div className="text-sm font-medium text-white">Modo Mantenimiento</div>
              <div className="text-xs text-zinc-500">Bloquea el acceso a todos los dashboards y muestra una pantalla de mantenimiento.</div>
            </div>
            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                maintenanceMode ? "bg-amber-500" : "bg-zinc-800"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  maintenanceMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Límites de la API */}
        <div className="rounded-xl border border-zinc-800 bg-white/[0.02] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-purple-500" />
            <div>
              <h3 className="text-sm font-semibold text-white">Límites de Tráfico y API</h3>
              <p className="text-xs text-zinc-400">Configura políticas de consumo global.</p>
            </div>
          </div>
          
          <div className="grid gap-4 pt-3 border-t border-zinc-800/50 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">Límite Global de Peticiones (p/min)</label>
              <input
                type="number"
                value={rateLimit}
                onChange={(e) => setRateLimit(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">Email de Soporte Técnico</label>
              <input
                type="email"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Proveedor IA */}
        <div className="rounded-xl border border-zinc-800 bg-white/[0.02] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-semibold text-white">Configuración del Motor de IA</h3>
              <p className="text-xs text-zinc-400">Modifica el proveedor de procesamiento inteligente.</p>
            </div>
          </div>
          
          <div className="pt-3 border-t border-zinc-800/50">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">Proveedor de LLM</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "openai", name: "OpenAI GPT-4o", desc: "Recomendado para producción" },
                { id: "gemini", name: "Gemini 1.5 Pro", desc: "Alto rendimiento y velocidad" }
              ].map((prov) => (
                <div
                  key={prov.id}
                  onClick={() => setIaProvider(prov.id)}
                  className={`border rounded-xl p-4 cursor-pointer transition flex items-start gap-3 ${
                    iaProvider === prov.id 
                      ? "border-amber-500 bg-amber-500/5" 
                      : "border-zinc-800 bg-white/[0.01] hover:bg-white/[0.03]"
                  }`}
                >
                  <input
                    type="radio"
                    checked={iaProvider === prov.id}
                    onChange={() => {}}
                    className="mt-1 accent-amber-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-white">{prov.name}</div>
                    <div className="text-xs text-zinc-500">{prov.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Guardar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:opacity-90 transition disabled:opacity-50"
          >
            {isSaving ? "Guardando..." : "Guardar Ajustes"}
            <Save className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
