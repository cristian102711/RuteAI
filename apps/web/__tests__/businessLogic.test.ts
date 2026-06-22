/**
 * Tests para utilidades de lógica de negocio:
 * - Formateo de moneda CLP
 * - Cálculo de progreso de ruta
 * - Validación de estado de pedido
 * - Formateo de tiempo relativo
 */

// ─── Helpers extraídos de los componentes (lógica pura) ──────────────────────

function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount);
}

function calcularProgreso(entregados: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((entregados / total) * 100);
}

type EstadoPedido = "pendiente" | "en_ruta" | "entregado" | "fallido" | "cancelado";
function esEstadoValido(estado: string): estado is EstadoPedido {
  return ["pendiente", "en_ruta", "entregado", "fallido", "cancelado"].includes(estado);
}

function tiempoRelativo(fechaISO: string): string {
  const diff = Date.now() - new Date(fechaISO).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} d`;
}

function scoreARiesgo(score: number): "bajo" | "medio" | "alto" {
  if (score < 0.4) return "bajo";
  if (score < 0.75) return "medio";
  return "alto";
}

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("formatCLP — formateo moneda chilena", () => {
  it("formatea 29000 correctamente", () => {
    expect(formatCLP(29000)).toContain("29.000");
  });
  it("formatea 99000 correctamente", () => {
    expect(formatCLP(99000)).toContain("99.000");
  });
  it("formatea 0 correctamente", () => {
    expect(formatCLP(0)).toContain("0");
  });
  it("formatea número negativo", () => {
    expect(formatCLP(-5000)).toContain("5.000");
  });
});

describe("calcularProgreso — barra de progreso de ruta", () => {
  it("retorna 100 cuando no hay pedidos (división por cero)", () => {
    expect(calcularProgreso(0, 0)).toBe(100);
  });
  it("retorna 0 cuando nada ha sido entregado", () => {
    expect(calcularProgreso(0, 10)).toBe(0);
  });
  it("retorna 50 con 5 de 10 entregados", () => {
    expect(calcularProgreso(5, 10)).toBe(50);
  });
  it("retorna 100 con todos entregados", () => {
    expect(calcularProgreso(10, 10)).toBe(100);
  });
  it("redondea correctamente (7 de 15 = 46.6% → 47%)", () => {
    expect(calcularProgreso(7, 15)).toBe(47);
  });
});

describe("esEstadoValido — validación de estados de pedido", () => {
  it("acepta 'pendiente'", () => {
    expect(esEstadoValido("pendiente")).toBe(true);
  });
  it("acepta 'en_ruta'", () => {
    expect(esEstadoValido("en_ruta")).toBe(true);
  });
  it("acepta 'entregado'", () => {
    expect(esEstadoValido("entregado")).toBe(true);
  });
  it("acepta 'fallido'", () => {
    expect(esEstadoValido("fallido")).toBe(true);
  });
  it("acepta 'cancelado'", () => {
    expect(esEstadoValido("cancelado")).toBe(true);
  });
  it("rechaza estados inválidos ('atrasado' es derivado, no un estado)", () => {
    expect(esEstadoValido("atrasado")).toBe(false);
    expect(esEstadoValido("")).toBe(false);
    expect(esEstadoValido("PENDIENTE")).toBe(false);
  });
});

describe("tiempoRelativo — formateo de tiempo", () => {
  it("retorna 'ahora' para fechas muy recientes", () => {
    const ahora = new Date().toISOString();
    expect(tiempoRelativo(ahora)).toBe("ahora");
  });
  it("retorna 'hace X min' para menos de 1 hora", () => {
    const hace5min = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(tiempoRelativo(hace5min)).toBe("hace 5 min");
  });
  it("retorna 'hace X h' para menos de 24 horas", () => {
    const hace3horas = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
    expect(tiempoRelativo(hace3horas)).toBe("hace 3 h");
  });
  it("retorna 'hace X d' para más de 24 horas", () => {
    const hace2dias = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString();
    expect(tiempoRelativo(hace2dias)).toBe("hace 2 d");
  });
});

describe("scoreARiesgo — clasificación de riesgo IA", () => {
  it("score 0 → riesgo bajo", () => {
    expect(scoreARiesgo(0)).toBe("bajo");
  });
  it("score 0.39 → riesgo bajo", () => {
    expect(scoreARiesgo(0.39)).toBe("bajo");
  });
  it("score 0.4 → riesgo medio", () => {
    expect(scoreARiesgo(0.4)).toBe("medio");
  });
  it("score 0.74 → riesgo medio", () => {
    expect(scoreARiesgo(0.74)).toBe("medio");
  });
  it("score 0.75 → riesgo alto", () => {
    expect(scoreARiesgo(0.75)).toBe("alto");
  });
  it("score 1.0 → riesgo alto", () => {
    expect(scoreARiesgo(1.0)).toBe("alto");
  });
});

describe("iniciales — generación de iniciales de nombre", () => {
  it("genera iniciales de nombre compuesto", () => {
    expect(iniciales("Juan Pérez")).toBe("JP");
  });
  it("genera inicial de nombre simple", () => {
    expect(iniciales("Carlos")).toBe("C");
  });
  it("usa solo los primeros dos nombres", () => {
    expect(iniciales("María José González")).toBe("MJ");
  });
  it("genera en mayúsculas", () => {
    expect(iniciales("ana torres")).toBe("AT");
  });
});
