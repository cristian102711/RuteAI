"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import type { Alerta } from "@prisma/client";

type AlertaConRepartidor = Alerta & {
  repartidor: { id: string; nombre: string } | null;
};

// Hook que escucha nuevas alertas por Realtime y actualiza el estado
export function useAlertasRealtime(empresaId: string, alertasIniciales: AlertaConRepartidor[]) {
  const [alertas, setAlertas] = useState<AlertaConRepartidor[]>(alertasIniciales);

  // Marca una alerta como leída optimistamente y sincroniza con la API
  const marcarLeida = useCallback(async (alertaId: string) => {
    setAlertas((prev) =>
      prev.map((a) => (a.id === alertaId ? { ...a, leida: true } : a))
    );
    await fetch("/api/alertas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertaId }),
    });
  }, []);

  const marcarTodasLeidas = useCallback(async () => {
    const noLeidas = alertas.filter((a) => !a.leida);
    setAlertas((prev) => prev.map((a) => ({ ...a, leida: true })));
    await Promise.all(
      noLeidas.map((a) =>
        fetch("/api/alertas", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alertaId: a.id }),
        })
      )
    );
  }, [alertas]);

  useEffect(() => {
    const supabase = createClient();

    // Suscribirse a cambios en tabla Alerta de esta empresa via Realtime
    const channel = supabase
      .channel(`alertas_${empresaId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Alerta",
          filter: `empresaId=eq.${empresaId}`,
        },
        (payload) => {
          // Agregar la nueva alerta al inicio de la lista
          const nuevaAlerta = payload.new as AlertaConRepartidor;
          setAlertas((prev) => [{ ...nuevaAlerta, repartidor: null }, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [empresaId]);

  return { alertas, marcarLeida, marcarTodasLeidas };
}
