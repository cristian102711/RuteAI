// ============================================================
// Core Service Client — Conecta apps/web (BFF) con apps/core
// Solo se ejecuta en el SERVIDOR (Server Actions / API Routes / RSC).
// El web actúa como BFF: valida la sesión Supabase, extrae el
// access_token y lo reenvía a core como Bearer. Core lo valida
// contra auth-service (/api/v1/auth/me).
// ============================================================

import { createClient } from "@/lib/supabaseServer";

const CORE_SERVICE_URL =
  process.env.CORE_SERVICE_URL ?? "http://localhost:3003";

// Envelope estándar de core: { success, data, error, total? }
interface CoreEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
  message?: string;
  details?: unknown;
}

export class CoreServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "CoreServiceError";
    this.status = status;
  }
}

interface CallCoreOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | undefined>;
  // Token explícito; si no se entrega, se obtiene de la sesión Supabase.
  token?: string;
  timeoutMs?: number;
}

// ── Obtener el access_token de la sesión Supabase ───────────────
export async function obtenerTokenSesion(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// ── Cliente principal ───────────────────────────────────────────
// Devuelve el `data` ya desempaquetado del envelope de core.
// Lanza CoreServiceError (con status) si core responde con error.
export async function callCore<T>(
  path: string,
  options: CallCoreOptions = {}
): Promise<T> {
  const { method = "GET", body, query, timeoutMs = 8000 } = options;

  const token = options.token ?? (await obtenerTokenSesion());
  if (!token) {
    throw new CoreServiceError("No autorizado", 401);
  }

  // Construir URL con query params
  const url = new URL(`${CORE_SERVICE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    console.error(`[CoreClient ${method} ${path}] Error de red:`, err);
    throw new CoreServiceError("No se pudo conectar con core-service", 503);
  }

  let json: CoreEnvelope<T>;
  try {
    json = (await response.json()) as CoreEnvelope<T>;
  } catch {
    throw new CoreServiceError(
      `core-service respondió con status ${response.status} sin JSON`,
      response.status
    );
  }

  if (!response.ok || json.success === false) {
    throw new CoreServiceError(
      json.error ?? `core-service respondió con status ${response.status}`,
      response.status
    );
  }

  return json.data as T;
}
