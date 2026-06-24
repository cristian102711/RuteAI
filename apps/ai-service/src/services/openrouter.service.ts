// Open Router — cliente REST compatible con la API de OpenAI.
// Usa fetch nativo (Node 18+); sin dependencias extra.
// Docs: https://openrouter.ai/docs

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
// Modelo configurable por entorno. Default: un modelo con tier gratuito vigente.
// (google/gemini-2.5-flash:free dejó de ser gratuito, por eso usamos gpt-oss-120b).
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b:free";

// ── Tipos ────────────────────────────────────────────────────

export interface ScoreIAResult {
  score: number;         // 0.0 - 1.0
  justificacion: string;
}

export interface PedidoParaOrdenar {
  id: string;
  producto: string;
  direccion: string;
  estado: string;
  scoreRiesgo?: number;  // 0-100 (como se guarda en BD)
  fechaEntregaLimite?: string | null;
  urgencia?: boolean;
}

export interface ReorganizacionResult {
  idsOrdenados: string[];
  razon: string;
}

// ── Helper: llamada genérica a Open Router ───────────────────

async function callOpenRouter(
  messages: Array<{ role: string; content: string }>,
  apiKey: string,
  model = DEFAULT_MODEL,
): Promise<string> {
  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://ruteai.vercel.app",
      "X-Title": "RuteAI",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
      max_tokens: 512,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`OpenRouter ${response.status}: ${body.slice(0, 200)}`);
  }

  const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? "";
}

// ── Score de riesgo con IA ───────────────────────────────────

export async function scorePedidoConIA(
  producto: string,
  direccion: string,
  fechaEntrega: string | null,
): Promise<ScoreIAResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn("[OpenRouter] OPENROUTER_API_KEY no configurada — score de precaución.");
    return { score: 0.1, justificacion: "Open Router no configurado — score por defecto." };
  }

  const prompt = [
    "Eres un analizador de riesgo logístico de última milla. Evalúa el riesgo de entrega fallida para el siguiente pedido.",
    "",
    `Producto / SKU: ${producto}`,
    `Dirección de entrega: ${direccion}`,
    fechaEntrega
      ? `Fecha y hora límite de entrega: ${fechaEntrega}`
      : "Sin fecha límite establecida.",
    "",
    "Factores a considerar: urgencia por cercanía de la fecha límite, tipo de producto (frágil, voluminoso, perecedero), zona de entrega (urbana céntrica, periférica, rural), historial implícito de la dirección.",
    "",
    "Responde ÚNICAMENTE con un JSON válido con este formato exacto (sin texto adicional):",
    '{ "score": <número entre 0.0 y 1.0>, "justificacion": "<una oración en español explicando el riesgo>" }',
    "",
    "score 0.0 = riesgo mínimo, 1.0 = riesgo máximo de entrega fallida.",
  ].join("\n");

  try {
    const text = await callOpenRouter([{ role: "user", content: prompt }], apiKey);
    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) throw new Error("No se encontró JSON en la respuesta de Open Router");

    const parsed = JSON.parse(match[0]);
    const rawScore = parseFloat(parsed.score);
    if (isNaN(rawScore)) throw new Error("score no es un número válido");

    const score = parseFloat(Math.min(1, Math.max(0, rawScore)).toFixed(2));
    const justificacion =
      typeof parsed.justificacion === "string" && parsed.justificacion.trim()
        ? parsed.justificacion.trim()
        : "Evaluado por IA.";

    return { score, justificacion };
  } catch (error) {
    console.error("[OpenRouter] scorePedidoConIA falló:", error);
    return {
      score: 0.15,
      justificacion: "Error al evaluar con IA — score de precaución asignado.",
    };
  }
}

// ── Reorganización de pedidos por prioridad logística ────────

export async function reorganizarPedidosConIA(
  pedidos: PedidoParaOrdenar[],
): Promise<ReorganizacionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || pedidos.length === 0) {
    return {
      idsOrdenados: pedidos.map((p) => p.id),
      razon: "Sin configuración de Open Router — orden sin cambios.",
    };
  }

  // Usamos índices numéricos (1-based) en el prompt para evitar que el modelo
  // altere o trunque los UUIDs reales. Al recibir la respuesta, mapeamos de vuelta.
  const indiceAId = pedidos.map((p, i) => ({ indice: i + 1, id: p.id }));

  const listaTexto = pedidos
    .map(
      (p, i) =>
        `${i + 1}. Posición=${i + 1} | Producto="${p.producto}" | Dirección="${p.direccion}" | Estado="${p.estado}" | Riesgo=${p.scoreRiesgo ?? 0}% | Límite="${p.fechaEntregaLimite ?? "Sin fecha"}" | Urgente=${p.urgencia ? "Sí" : "No"}`,
    )
    .join("\n");

  const prompt = [
    "Eres un optimizador de logística de última milla. Analiza la siguiente lista de pedidos y devuelve el orden óptimo de atención logística.",
    "",
    "Pedidos actuales:",
    listaTexto,
    "",
    "Criterios de priorización (en orden de importancia):",
    "1. Pedidos con fecha límite más próxima primero (urgencia de SLA).",
    "2. Pedidos marcados como urgentes.",
    "3. Pedidos con mayor score de riesgo (más probabilidad de fallo de entrega).",
    "4. Pedidos en estado 'en_ruta' antes que 'pendiente'.",
    "",
    `Hay ${pedidos.length} pedidos en total, numerados del 1 al ${pedidos.length}.`,
    "Responde ÚNICAMENTE con un JSON válido con este formato exacto (sin texto adicional):",
    `{ "orden": [<num1>, <num2>, ...], "razon": "<explicación breve en español de la estrategia usada>" }`,
    `El array 'orden' debe contener los números del 1 al ${pedidos.length} exactamente una vez, reordenados según la prioridad.`,
  ].join("\n");

  try {
    const text = await callOpenRouter([{ role: "user", content: prompt }], apiKey);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No se encontró JSON en la respuesta");

    const parsed = JSON.parse(match[0]);
    const ordenRecibido: unknown = parsed.orden;

    if (!Array.isArray(ordenRecibido) || ordenRecibido.length !== pedidos.length) {
      throw new Error(`Array inválido: esperaba ${pedidos.length} elementos, recibió ${Array.isArray(ordenRecibido) ? ordenRecibido.length : "no-array"}`);
    }

    const numerosRecibidos = ordenRecibido.map(Number);
    const esperados = pedidos.map((_, i) => i + 1).sort((a, b) => a - b);
    const recibidosOrdenados = [...numerosRecibidos].sort((a, b) => a - b);
    const esValido = esperados.every((n, i) => n === recibidosOrdenados[i]);
    if (!esValido) throw new Error(`Números inválidos: esperaba 1-${pedidos.length}, recibió ${numerosRecibidos}`);

    const idsOrdenados = numerosRecibidos.map((n) => indiceAId[n - 1].id);

    return {
      idsOrdenados,
      razon: typeof parsed.razon === "string" ? parsed.razon : "Reorganizado por IA.",
    };
  } catch (error) {
    console.error("[OpenRouter] reorganizarPedidosConIA falló:", error);
    return {
      idsOrdenados: pedidos.map((p) => p.id),
      razon: "La IA no pudo reorganizar los pedidos — se mantiene el orden original.",
    };
  }
}
