// ============================================================
// Optimización de rutas con IA (Gemini) + fallback heurístico.
//
// optimizarRutaIA() le pide a Gemini el mejor orden de visita (TSP) y valida
// que la respuesta sea una permutación EXACTA de las paradas. Ante cualquier
// problema (sin API key, error de red, 429 por cuota, JSON inválido, orden no
// válido) cae al heurístico nearest-neighbor. Así el botón "Optimizar con IA"
// SIEMPRE devuelve una ruta usable.
// ============================================================
import { optimizarRuta } from "./ai.service";

export interface Punto {
  id: string;
  lat: number;
  lng: number;
}

export interface ResultadoOptimizacion {
  ruta: Punto[];                          // incluye el origen primero
  algoritmo: "gemini" | "nearest-neighbor";
  razon?: string;                         // explicación breve (solo Gemini)
}

// Inyectable para tests (mock de fetch).
export interface OptimizeDeps {
  fetch?: typeof fetch;
  apiKey?: string;
  model?: string;
}

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/** ¿`orden` es una permutación exacta de `ids`? (mismos elementos, sin faltar/sobrar) */
export function esPermutacionValida(ids: string[], orden: unknown): orden is string[] {
  if (!Array.isArray(orden) || orden.length !== ids.length) return false;
  const a = [...ids].sort();
  const b = [...orden].map(String).sort();
  return a.every((x, i) => x === b[i]);
}

/** Prompt determinista pidiendo SOLO JSON con el orden óptimo. */
export function construirPrompt(origen: Punto, puntos: Punto[]): string {
  const paradas = puntos
    .map((p) => `  { "id": "${p.id}", "lat": ${p.lat}, "lng": ${p.lng} }`)
    .join(",\n");
  return [
    "Eres un optimizador de rutas de última milla (TSP).",
    `Origen del repartidor: lat ${origen.lat}, lng ${origen.lng}.`,
    "Paradas a visitar (entregas):",
    `[\n${paradas}\n]`,
    "",
    "Devuelve el ORDEN ÓPTIMO de visita que minimice la distancia total recorrida",
    "partiendo desde el origen. Responde EXCLUSIVAMENTE un JSON válido con esta forma:",
    '{ "orden": ["<id1>", "<id2>", ...], "razon": "<explicación breve en español>" }',
    "El array 'orden' debe contener TODOS los ids de las paradas exactamente una vez.",
  ].join("\n");
}

/** Extrae el texto del primer candidate de la respuesta de Gemini. */
function extraerTexto(json: any): string {
  return json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function optimizarRutaIA(
  origen: Punto,
  puntos: Punto[],
  deps: OptimizeDeps = {}
): Promise<ResultadoOptimizacion> {
  const fallback = (): ResultadoOptimizacion => ({
    ruta: optimizarRuta(origen, puntos),
    algoritmo: "nearest-neighbor",
  });

  const apiKey = deps.apiKey ?? process.env.GEMINI_API_KEY;
  const model = deps.model ?? process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const doFetch = deps.fetch ?? globalThis.fetch;

  if (!apiKey || puntos.length === 0 || typeof doFetch !== "function") {
    return fallback();
  }

  try {
    const res = await doFetch(`${GEMINI_URL}/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: construirPrompt(origen, puntos) }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return fallback(); // 429 (cuota), 4xx/5xx, etc.

    const json = await res.json();
    const parsed = JSON.parse(extraerTexto(json));
    const ids = puntos.map((p) => p.id);

    if (!esPermutacionValida(ids, parsed?.orden)) return fallback();

    const porId = new Map(puntos.map((p) => [p.id, p]));
    const ruta = [origen, ...parsed.orden.map((id: string) => porId.get(id)!)];
    return {
      ruta,
      algoritmo: "gemini",
      razon: typeof parsed?.razon === "string" ? parsed.razon : undefined,
    };
  } catch {
    return fallback();
  }
}
