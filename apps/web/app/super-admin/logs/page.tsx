"use client";

import { useState, useEffect } from "react";
import { Search, ShieldAlert, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface LogAcceso {
  id: string;
  email: string;
  estado: string;
  detalles: string | null;
  ip: string | null;
  timestamp: string;
}

export default function SuperAdminLogs() {
  const [logs, setLogs] = useState<LogAcceso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/super-admin/logs");
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      } else {
        toast.error(data.error || "Error al cargar logs");
      }
    } catch (err) {
      toast.error("Error al conectar con el servidor de logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filtered logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.detalles && log.detalles.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.ip && log.ip.includes(searchQuery));

    const matchesEstado = estadoFilter ? log.estado.toLowerCase() === estadoFilter.toLowerCase() : true;

    return matchesSearch && matchesEstado;
  });

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-purple-500">Auditoría</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Logs de Acceso</h1>
          <p className="mt-1 text-sm text-zinc-400">Historial en tiempo real de inicios de sesión y autenticación de la plataforma.</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/10"
          title="Refrescar logs"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-white/[0.02]">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 p-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por email, IP o detalle…" 
              className="h-9 w-full rounded-md border border-zinc-800 bg-white/[0.03] pl-9 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
          
          <select 
            value={estadoFilter || ""}
            onChange={(e) => setEstadoFilter(e.target.value || null)}
            className="h-9 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          >
            <option value="">Todos los estados</option>
            <option value="exito">Éxito</option>
            <option value="error">Error / Fallo</option>
          </select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <span className="ml-2 text-zinc-400">Cargando logs...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-zinc-500">
            <ShieldAlert className="h-8 w-8 text-zinc-600 mb-2" />
            <p>No se encontraron registros de logs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-zinc-500">
                <tr className="border-b border-zinc-800">
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Usuario / Email</th>
                  <th className="px-5 py-3 font-medium">IP</th>
                  <th className="px-5 py-3 font-medium">Detalles / Evento</th>
                  <th className="px-5 py-3 font-medium">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      {log.estado === "exito" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Éxito
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400 border border-red-500/20">
                          <XCircle className="h-3.5 w-3.5" /> Fallo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-medium text-white">{log.email}</td>
                    <td className="px-5 py-3 font-mono text-zinc-400 text-xs">{log.ip || "N/A"}</td>
                    <td className="px-5 py-3 text-zinc-300">{log.detalles || "Inicio de sesión estándar"}</td>
                    <td className="px-5 py-3 text-zinc-400 text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
