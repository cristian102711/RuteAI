/**
 * authLogger.ts
 * Utilidad para registrar eventos de autenticación en el microservicio de auth.
 * No tiene "use server" — puede ser importada desde Route Handlers y Server Actions.
 */

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://ruteai-auth.vercel.app"
    : "http://localhost:3002");

export interface AuthLogPayload {
  userId: string;
  email: string;
  provider: string;
  status: string;
  error?: string;
}

/**
 * Envía un evento de autenticación al microservicio de auth.
 * Falla silenciosamente para nunca bloquear el flujo principal.
 */
export async function logAuthEvent(data: AuthLogPayload): Promise<void> {
  try {
    const body = {
      evento: "iniciar_sesion",
      userId: data.userId,
      email: data.email,
      provider: data.provider,
      status: data.status,
      error: data.error,
      timestamp: new Date().toISOString(),
    };

    console.log(`[AuthLogger] Enviando log a ${AUTH_SERVICE_URL}:`, JSON.stringify(body));

    const response = await fetch(`${AUTH_SERVICE_URL}/api/v1/auth/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(2000), // 2s timeout para no bloquear Vercel
    });

    if (!response.ok) {
      console.error(`[AuthLogger] Auth service respondió con status ${response.status}`);
    }
  } catch (err) {
    // Silencioso: si el microservicio no está disponible, no rompemos el flujo
    console.error("[AuthLogger] Error o timeout al enviar log al microservicio:", err);
  }
}
