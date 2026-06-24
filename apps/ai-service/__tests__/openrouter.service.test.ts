// ── openrouter.service.test.ts ───────────────────────────────────────────────
// Tests unitarios del cliente Open Router. global.fetch está mockeado: no hay
// llamadas de red reales. Cubre el modo IA del score y la reorganización por
// prioridad (incluido el mapeo índice → UUID que arregla la alteración de IDs).

import {
  scorePedidoConIA,
  reorganizarPedidosConIA,
  type PedidoParaOrdenar,
} from "../src/services/openrouter.service";

// Respuesta que imita a Open Router con un `content` dado. Se inyecta con
// jest.spyOn(global,"fetch") porque `fetch` es una propiedad del global que no
// admite asignación directa (global.fetch = ... se ignora en silencio).
function fetchResponse(content: string, ok = true, status = 200) {
  return {
    ok,
    status,
    text: async () => content,
    json: async () => ({ choices: [{ message: { content } }] }),
  };
}

function mockFetch(content: string, ok = true, status = 200) {
  return jest
    .spyOn(global, "fetch")
    .mockResolvedValue(fetchResponse(content, ok, status) as unknown as Response);
}

const KEY_ORIGINAL = process.env.OPENROUTER_API_KEY;

afterEach(() => {
  jest.restoreAllMocks();
  if (KEY_ORIGINAL === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = KEY_ORIGINAL;
});

// ─── scorePedidoConIA ─────────────────────────────────────────────────────────
describe("scorePedidoConIA", () => {
  it("sin API key → score de precaución y NO llama a la red", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const fetchSpy = jest.spyOn(global, "fetch");

    const r = await scorePedidoConIA("Laptop", "Av. Siempre Viva 123", null);

    expect(r.score).toBe(0.1);
    expect(r.justificacion).toMatch(/no configurado/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("respuesta válida → parsea score y justificación", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    mockFetch(
      '{ "score": 0.72, "justificacion": "Producto frágil y zona periférica." }',
    );

    const r = await scorePedidoConIA("Vajilla de cristal", "Camino Rural s/n", null);

    expect(r.score).toBe(0.72);
    expect(r.justificacion).toBe("Producto frágil y zona periférica.");
  });

  it("clamp: un score fuera de rango se acota a [0,1]", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    mockFetch('{ "score": 1.9, "justificacion": "x" }');

    const r = await scorePedidoConIA("p", "d", null);
    expect(r.score).toBe(1);
  });

  it("respuesta sin JSON → fallback de precaución (0.15)", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    mockFetch("lo siento, no puedo responder en JSON");
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    const r = await scorePedidoConIA("p", "d", null);
    expect(r.score).toBe(0.15);
    expect(r.justificacion).toMatch(/Error al evaluar/i);
  });

  it("error HTTP (500) → fallback de precaución", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    mockFetch("Internal Server Error", false, 500);
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    const r = await scorePedidoConIA("p", "d", null);
    expect(r.score).toBe(0.15);
  });
});

// ─── reorganizarPedidosConIA ──────────────────────────────────────────────────
describe("reorganizarPedidosConIA", () => {
  const pedidos: PedidoParaOrdenar[] = [
    { id: "dc481cf0-f52b-4d73-8d4a-6543d66eb8da", producto: "Laptop", direccion: "A", estado: "pendiente" },
    { id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", producto: "Medicinas", direccion: "B", estado: "en_ruta", urgencia: true },
    { id: "f9e8d7c6-b5a4-3210-fedc-ba9876543210", producto: "Flores", direccion: "C", estado: "pendiente" },
  ];

  it("sin API key → mantiene el orden original", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const fetchSpy = jest.spyOn(global, "fetch");

    const r = await reorganizarPedidosConIA(pedidos);

    expect(r.idsOrdenados).toEqual(pedidos.map((p) => p.id));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("lista vacía → resultado vacío sin red", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    const fetchSpy = jest.spyOn(global, "fetch");

    const r = await reorganizarPedidosConIA([]);

    expect(r.idsOrdenados).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("índices válidos → mapea a los UUID reales EXACTOS y en el orden dado", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    // El modelo responde con índices 1-based, no con los UUID.
    mockFetch('{ "orden": [2, 3, 1], "razon": "urgencia primero" }');

    const r = await reorganizarPedidosConIA(pedidos);

    expect(r.idsOrdenados).toEqual([
      "a1b2c3d4-e5f6-7890-abcd-ef1234567890", // índice 2
      "f9e8d7c6-b5a4-3210-fedc-ba9876543210", // índice 3
      "dc481cf0-f52b-4d73-8d4a-6543d66eb8da", // índice 1
    ]);
    expect(r.razon).toBe("urgencia primero");
  });

  it("orden no permutación (índice repetido) → fallback al orden original", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    mockFetch('{ "orden": [1, 1, 2], "razon": "x" }');
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    const r = await reorganizarPedidosConIA(pedidos);
    expect(r.idsOrdenados).toEqual(pedidos.map((p) => p.id));
  });

  it("longitud incorrecta → fallback al orden original", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    mockFetch('{ "orden": [1, 2], "razon": "x" }');
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    const r = await reorganizarPedidosConIA(pedidos);
    expect(r.idsOrdenados).toEqual(pedidos.map((p) => p.id));
  });
});
