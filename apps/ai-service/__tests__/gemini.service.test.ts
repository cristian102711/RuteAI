import {
  optimizarRutaIA,
  esPermutacionValida,
  construirPrompt,
} from "../src/services/gemini.service";

const origen = { id: "o", lat: -33.45, lng: -70.66 };
const puntos = [
  { id: "a", lat: -33.40, lng: -70.60 },
  { id: "b", lat: -33.42, lng: -70.62 },
  { id: "c", lat: -33.44, lng: -70.64 },
];

// Construye un mock de fetch que responde como la API de Gemini con `orden`.
function mockGeminiOK(orden: string[], razon = "ruta óptima") {
  return jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify({ orden, razon }) }] } }],
    }),
  }) as unknown as typeof fetch;
}

describe("esPermutacionValida", () => {
  it("acepta una permutación exacta", () => {
    expect(esPermutacionValida(["a", "b", "c"], ["c", "a", "b"])).toBe(true);
  });
  it("rechaza si falta o sobra un id", () => {
    expect(esPermutacionValida(["a", "b", "c"], ["a", "b"])).toBe(false);
    expect(esPermutacionValida(["a", "b", "c"], ["a", "b", "c", "d"])).toBe(false);
  });
  it("rechaza si hay ids repetidos / distintos", () => {
    expect(esPermutacionValida(["a", "b", "c"], ["a", "a", "b"])).toBe(false);
    expect(esPermutacionValida(["a", "b", "c"], ["x", "y", "z"])).toBe(false);
  });
  it("rechaza valores no-array", () => {
    expect(esPermutacionValida(["a"], "a")).toBe(false);
    expect(esPermutacionValida(["a"], null)).toBe(false);
  });
});

describe("construirPrompt", () => {
  it("incluye los ids de las paradas y pide JSON", () => {
    const prompt = construirPrompt(origen, puntos);
    expect(prompt).toContain('"a"');
    expect(prompt).toContain('"orden"');
    expect(prompt).toMatch(/JSON/i);
  });
});

describe("optimizarRutaIA", () => {
  it("usa Gemini cuando devuelve una permutación válida", async () => {
    const fetchMock = mockGeminiOK(["b", "a", "c"]);
    const r = await optimizarRutaIA(origen, puntos, { fetch: fetchMock, apiKey: "k", model: "m" });
    expect(r.algoritmo).toBe("gemini");
    expect(r.ruta[0].id).toBe("o");                       // origen primero
    expect(r.ruta.map((p) => p.id)).toEqual(["o", "b", "a", "c"]);
    expect(r.razon).toBe("ruta óptima");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("cae al heurístico si Gemini devuelve un orden inválido", async () => {
    const fetchMock = mockGeminiOK(["a", "a", "a"]); // no es permutación
    const r = await optimizarRutaIA(origen, puntos, { fetch: fetchMock, apiKey: "k" });
    expect(r.algoritmo).toBe("nearest-neighbor");
    expect(r.ruta[0].id).toBe("o");
    expect(r.ruta).toHaveLength(4);
  });

  it("cae al heurístico ante 429 (cuota agotada)", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) }) as unknown as typeof fetch;
    const r = await optimizarRutaIA(origen, puntos, { fetch: fetchMock, apiKey: "k" });
    expect(r.algoritmo).toBe("nearest-neighbor");
  });

  it("cae al heurístico ante excepción de red", async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error("network")) as unknown as typeof fetch;
    const r = await optimizarRutaIA(origen, puntos, { fetch: fetchMock, apiKey: "k" });
    expect(r.algoritmo).toBe("nearest-neighbor");
  });

  it("sin API key no llama a la red y usa el heurístico", async () => {
    const fetchMock = jest.fn() as unknown as typeof fetch;
    const r = await optimizarRutaIA(origen, puntos, { fetch: fetchMock, apiKey: "" });
    expect(r.algoritmo).toBe("nearest-neighbor");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
