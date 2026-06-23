"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, Download, MoreHorizontal, X, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Empresa {
  id: string;
  nombre: string;
  inicial: string;
  plan: string;
  estado: string;
  usuarios: number;
  entregas: string;
  pais: string;
  actividad: string;
}

export default function SuperAdminEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPlan, setNewPlan] = useState("starter");
  const [newPais, setNewPais] = useState("Chile");

  const fetchEmpresas = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/super-admin/empresas");
      const data = await res.json();
      if (data.success) {
        setEmpresas(data.data);
      } else {
        toast.error(data.error || "Error al cargar empresas");
      }
    } catch (err) {
      toast.error("Error al conectar con la base de datos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const handleCreateEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setIsSubmitLoading(true);
    try {
      const res = await fetch("/api/super-admin/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: newNombre,
          plan: newPlan,
          email: newEmail,
          pais: newPais,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Empresa creada exitosamente");
        setIsModalOpen(false);
        setNewNombre("");
        setNewEmail("");
        setNewPlan("starter");
        setNewPais("Chile");
        fetchEmpresas();
      } else {
        toast.error(data.error || "Error al crear la empresa");
      }
    } catch (err) {
      toast.error("Error de red al crear empresa");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleToggleEstado = async (id: string) => {
    try {
      const res = await fetch("/api/super-admin/empresas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Estado de la empresa actualizado");
        fetchEmpresas();
      } else {
        toast.error(data.error || "Error al cambiar estado");
      }
    } catch (err) {
      toast.error("Error de red al actualizar estado");
    }
  };

  // Filtered List
  const filteredEmpresas = empresas.filter((empresa) => {
    const matchesSearch = 
      empresa.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      empresa.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      empresa.pais.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlan = planFilter ? empresa.plan.toLowerCase() === planFilter.toLowerCase() : true;
    const matchesEstado = estadoFilter ? empresa.estado.toLowerCase() === estadoFilter.toLowerCase() : true;

    return matchesSearch && matchesPlan && matchesEstado;
  });

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-purple-500">Tenants</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Empresas (CRM)</h1>
          <p className="mt-1 text-sm text-zinc-400">Gestiona los tenants del sistema conectados a la base de datos real.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchEmpresas}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/10"
            title="Refrescar lista"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" /> Nueva empresa
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-white/[0.02]">
        
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 p-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar empresa por nombre o país…" 
              className="h-9 w-full rounded-md border border-zinc-800 bg-white/[0.03] pl-9 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
          
          <select 
            value={planFilter || ""}
            onChange={(e) => setPlanFilter(e.target.value || null)}
            className="h-9 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          >
            <option value="">Todos los planes</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="business">Business</option>
          </select>

          <select 
            value={estadoFilter || ""}
            onChange={(e) => setEstadoFilter(e.target.value || null)}
            className="h-9 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          >
            <option value="">Todos los estados</option>
            <option value="activa">Activa</option>
            <option value="inactiva">Inactiva</option>
          </select>
          
          <div className="ml-auto"></div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <span className="ml-2 text-zinc-400">Cargando base de datos...</span>
          </div>
        ) : filteredEmpresas.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-zinc-500">
            <Search className="h-8 w-8 text-zinc-600 mb-2" />
            <p>No se encontraron empresas con los filtros aplicados.</p>
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-zinc-500">
                <tr className="border-b border-zinc-800">
                  <th className="px-5 py-3 font-medium">Empresa</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Usuarios</th>
                  <th className="px-5 py-3 font-medium">Entregas</th>
                  <th className="px-5 py-3 font-medium">País</th>
                  <th className="px-5 py-3 font-medium">Última actividad</th>
                  <th className="px-5 py-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredEmpresas.map((empresa) => (
                  <tr key={empresa.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-amber-500/20 to-purple-500/20 text-xs font-bold text-amber-500 ring-1 ring-inset ring-white/10">
                          {empresa.inicial}
                        </div>
                        <div>
                          <div className="font-medium text-white">{empresa.nombre}</div>
                          <div className="text-xs text-zinc-500 font-mono">{empresa.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {empresa.plan === "Business" && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-amber-500/20 to-purple-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-inset ring-amber-500/30">
                          ★ Business
                        </span>
                      )}
                      {empresa.plan === "Pro" && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-500/15 px-2 py-0.5 text-xs font-semibold text-purple-400 ring-1 ring-inset ring-purple-500/30">
                          Pro
                        </span>
                      )}
                      {empresa.plan === "Starter" && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-white/10">
                          Starter
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {empresa.estado === "Activa" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"></span>Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-current"></span>Inactiva
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-zinc-300">{empresa.usuarios}</td>
                    <td className="px-5 py-3 tabular-nums text-zinc-300">{empresa.entregas}</td>
                    <td className="px-5 py-3 text-zinc-400">{empresa.pais}</td>
                    <td className="px-5 py-3 text-zinc-400">{empresa.actividad}</td>
                    <td className="px-5 py-3">
                      <button 
                        onClick={() => handleToggleEstado(empresa.id)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition ${
                          empresa.estado === "Activa" 
                            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30" 
                            : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                        }`}
                      >
                        {empresa.estado === "Activa" ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Pagination */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3 text-xs text-zinc-500">
          <div>Mostrando {filteredEmpresas.length} de {empresas.length}</div>
        </div>
      </div>

      {/* Add Company Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Nueva Empresa Tenant</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateEmpresa} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">Nombre de la Empresa</label>
                <input
                  type="text"
                  required
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Ej: Logística Express"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">Email Administrador (Opcional)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@empresa.com"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">Plan Contratado</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">País Operación</label>
                  <input
                    type="text"
                    value={newPais}
                    onChange={(e) => setNewPais(e.target.value)}
                    placeholder="Ej: Chile"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="flex items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-purple-600 px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitLoading ? "Creando..." : "Crear Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
