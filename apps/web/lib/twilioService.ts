// ============================================================
// Twilio Notification Service — RF-06
// Solo se ejecuta en el SERVIDOR. Nunca exponer credenciales.
// Envía SMS/WhatsApp al cliente cuando su pedido cambia de estado.
// ============================================================

import twilio from "twilio";

const TWILIO_ACCOUNT_SID  = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN   = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER  = process.env.TWILIO_FROM_NUMBER; // Ej: +14155238886 (sandbox WhatsApp)
const APP_BASE_URL        = process.env.NEXT_PUBLIC_APP_URL ?? "https://ruteai.vercel.app";

// ── Tipos ─────────────────────────────────────────────────────
type Canal = "sms" | "whatsapp";

interface NotificacionPayload {
  telefono:   string;   // Número del cliente con código de país: +56912345678
  pedidoId:   string;
  cliente:    string;
  direccion:  string;
  canal?:     Canal;    // Default: whatsapp
}

interface NotificacionResult {
  enviado:  boolean;
  sid?:     string;
  error?:   string;
}

// ── Función principal: notificar transición "en_ruta" ─────────
export async function notificarPedidoEnRuta(
  payload: NotificacionPayload
): Promise<NotificacionResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    console.warn("[Twilio] Variables de entorno no configuradas — notificación omitida");
    return { enviado: false, error: "Twilio no configurado" };
  }

  if (!payload.telefono || !payload.telefono.startsWith("+")) {
    console.warn(`[Twilio] Teléfono inválido para pedido ${payload.pedidoId}: ${payload.telefono}`);
    return { enviado: false, error: "Teléfono inválido o ausente" };
  }

  const canal: Canal = payload.canal ?? "whatsapp";
  const trackingUrl  = `${APP_BASE_URL}/tracking/${payload.pedidoId}`;

  const mensaje = [
    `¡Hola ${payload.cliente.split(" ")[0]}! 🚚`,
    `Tu pedido está en camino a ${payload.direccion}.`,
    `Sigue tu entrega en tiempo real aquí:`,
    trackingUrl,
  ].join("\n");

  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const from = canal === "whatsapp"
      ? `whatsapp:${TWILIO_FROM_NUMBER}`
      : TWILIO_FROM_NUMBER;

    const to = canal === "whatsapp"
      ? `whatsapp:${payload.telefono}`
      : payload.telefono;

    const message = await client.messages.create({ body: mensaje, from, to });

    console.info(`[Twilio] Notificación enviada — SID: ${message.sid} — Pedido: ${payload.pedidoId}`);
    return { enviado: true, sid: message.sid };
  } catch (error) {
    // No lanzamos el error para no bloquear la transición de estado del pedido
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error(`[Twilio] Falló el envío para pedido ${payload.pedidoId}:`, msg);
    return { enviado: false, error: msg };
  }
}

// ── Notificación de entrega confirmada ────────────────────────
export async function notificarPedidoEntregado(
  payload: NotificacionPayload
): Promise<NotificacionResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    return { enviado: false, error: "Twilio no configurado" };
  }

  if (!payload.telefono?.startsWith("+")) {
    return { enviado: false, error: "Teléfono inválido o ausente" };
  }

  const canal: Canal = payload.canal ?? "whatsapp";
  const trackingUrl  = `${APP_BASE_URL}/tracking/${payload.pedidoId}`;

  const mensaje = [
    `¡Tu pedido fue entregado! ✅`,
    `Hola ${payload.cliente.split(" ")[0]}, tu entrega en ${payload.direccion} fue completada.`,
    `Puedes ver la evidencia aquí:`,
    trackingUrl,
  ].join("\n");

  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const from = canal === "whatsapp" ? `whatsapp:${TWILIO_FROM_NUMBER}` : TWILIO_FROM_NUMBER;
    const to   = canal === "whatsapp" ? `whatsapp:${payload.telefono}`   : payload.telefono;

    const message = await client.messages.create({ body: mensaje, from, to });
    return { enviado: true, sid: message.sid };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error(`[Twilio] Error notificando entrega ${payload.pedidoId}:`, msg);
    return { enviado: false, error: msg };
  }
}
