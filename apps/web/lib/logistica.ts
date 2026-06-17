// ============================================================
// Lógica de negocio logística — pura, sin dependencias.
// Usable tanto en Server Components / Actions como en el cliente.
//
// "atrasado" NO es un estado almacenado: es una condición SLA
// derivada de fechaEntregaLimite vs el momento actual. Un pedido
// puede estar "en_ruta" Y atrasado a la vez.
// ============================================================

export const ESTADOS_PEDIDO = [
  "pendiente",
  "en_ruta",
  "entregado",
  "fallido",
  "cancelado",
] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

// Estados terminales: no admiten más transiciones de estado.
export const ESTADOS_TERMINALES: EstadoPedido[] = ["entregado", "cancelado"];

// Catálogos de motivos tipificados (habilitan analítica real)
export const MOTIVOS_FALLO = [
  { valor: "cliente_ausente", label: "Cliente ausente" },
  { valor: "direccion_erronea", label: "Dirección errónea" },
  { valor: "rechazado", label: "Pedido rechazado" },
  { valor: "sin_acceso", label: "Sin acceso al lugar" },
  { valor: "fuera_de_zona", label: "Fuera de zona" },
  { valor: "otro", label: "Otro" },
] as const;

export const MOTIVOS_CANCELACION = [
  { valor: "cliente_cancelo", label: "El cliente canceló" },
  { valor: "duplicado", label: "Pedido duplicado" },
  { valor: "error_datos", label: "Error en los datos" },
  { valor: "fuera_de_zona", label: "Fuera de zona de cobertura" },
  { valor: "otro", label: "Otro" },
] as const;

export const MOTIVOS_FALLO_VALORES = MOTIVOS_FALLO.map((m) => m.valor);
export const MOTIVOS_CANCELACION_VALORES = MOTIVOS_CANCELACION.map((m) => m.valor);

export function esEstadoValido(estado: string): estado is EstadoPedido {
  return (ESTADOS_PEDIDO as readonly string[]).includes(estado);
}

export function esTerminal(estado: string): boolean {
  return (ESTADOS_TERMINALES as readonly string[]).includes(estado);
}

type PedidoSLA = {
  estado: string;
  fechaEntregaLimite?: Date | string | null;
  entregadoEn?: Date | string | null;
};

/** ¿El pedido está incumpliendo su SLA ahora mismo? (condición derivada) */
export function estaAtrasado(p: PedidoSLA, ahora: Date = new Date()): boolean {
  if (!p.fechaEntregaLimite) return false;
  if (esTerminal(p.estado)) return false; // entregado/cancelado ya no acumulan atraso
  return ahora.getTime() > new Date(p.fechaEntregaLimite).getTime();
}

/**
 * Minutos de atraso del pedido.
 * - Si ya fue entregado: atraso = entregadoEn - límite (cuánto tarde llegó).
 * - Si sigue activo: atraso = ahora - límite (cuánto lleva acumulado).
 * Devuelve 0 si llegó a tiempo o no tiene límite/está cancelado.
 */
export function minutosAtraso(p: PedidoSLA, ahora: Date = new Date()): number {
  if (!p.fechaEntregaLimite) return 0;
  if (p.estado === "cancelado") return 0;
  const limite = new Date(p.fechaEntregaLimite).getTime();
  const fin =
    p.estado === "entregado" && p.entregadoEn
      ? new Date(p.entregadoEn).getTime()
      : ahora.getTime();
  const diffMin = Math.floor((fin - limite) / 60_000);
  return diffMin > 0 ? diffMin : 0;
}

/** ¿Una entrega ya realizada cumplió el SLA (llegó a tiempo)? */
export function entregadoATiempo(p: PedidoSLA): boolean {
  if (p.estado !== "entregado") return false;
  if (!p.fechaEntregaLimite || !p.entregadoEn) return true; // sin SLA => no penaliza
  return new Date(p.entregadoEn).getTime() <= new Date(p.fechaEntregaLimite).getTime();
}

/** Formatea minutos de atraso a un texto compacto: "25 min", "2 h 5 min". */
export function formatearAtraso(min: number): string {
  if (min <= 0) return "a tiempo";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

/** Métricas SLA agregadas para el dashboard. */
export function calcularMetricasSLA(
  pedidos: PedidoSLA[],
  ahora: Date = new Date()
): {
  atrasadosActivos: number;
  entregados: number;
  entregadosATiempo: number;
  otd: number; // % On-Time Delivery
  atrasoPromedioMin: number; // promedio de minutos de atraso entre los entregados tarde
} {
  let atrasadosActivos = 0;
  let entregados = 0;
  let entregadosATiempo = 0;
  let sumaAtrasoEntregasTarde = 0;
  let entregasTarde = 0;

  for (const p of pedidos) {
    if (estaAtrasado(p, ahora)) atrasadosActivos++;
    if (p.estado === "entregado") {
      entregados++;
      if (entregadoATiempo(p)) {
        entregadosATiempo++;
      } else {
        const min = minutosAtraso(p, ahora);
        if (min > 0) {
          sumaAtrasoEntregasTarde += min;
          entregasTarde++;
        }
      }
    }
  }

  return {
    atrasadosActivos,
    entregados,
    entregadosATiempo,
    otd: entregados > 0 ? Math.round((entregadosATiempo / entregados) * 100) : 100,
    atrasoPromedioMin:
      entregasTarde > 0 ? Math.round(sumaAtrasoEntregasTarde / entregasTarde) : 0,
  };
}
