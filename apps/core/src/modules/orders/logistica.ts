// ============================================================
// Lógica logística del core — pura, sin dependencias.
// (Espejo del helper de web/lib/logistica.ts. Cada servicio se
//  mantiene autocontenido siguiendo la arquitectura de microservicios.)
// ============================================================

export const ESTADOS_PEDIDO = [
  "pendiente",
  "en_ruta",
  "entregado",
  "fallido",
  "cancelado",
] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export const ESTADOS_TERMINALES: EstadoPedido[] = ["entregado", "cancelado"];

export const MOTIVOS_FALLO_VALORES = [
  "cliente_ausente",
  "direccion_erronea",
  "rechazado",
  "sin_acceso",
  "fuera_de_zona",
  "otro",
] as const;

export const MOTIVOS_CANCELACION_VALORES = [
  "cliente_cancelo",
  "duplicado",
  "error_datos",
  "fuera_de_zona",
  "otro",
] as const;

export function esTerminal(estado: string): boolean {
  return (ESTADOS_TERMINALES as readonly string[]).includes(estado);
}

export function minutosAtraso(
  fechaEntregaLimite: Date | string | null | undefined,
  hasta: Date | string | null | undefined,
  ahora: Date = new Date()
): number {
  if (!fechaEntregaLimite) return 0;
  const limite = new Date(fechaEntregaLimite).getTime();
  const fin = hasta ? new Date(hasta).getTime() : ahora.getTime();
  const diffMin = Math.floor((fin - limite) / 60_000);
  return diffMin > 0 ? diffMin : 0;
}
