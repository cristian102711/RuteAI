import {
  ESTADOS_PEDIDO,
  ESTADOS_TERMINALES,
  MOTIVOS_FALLO_VALORES,
  MOTIVOS_CANCELACION_VALORES,
  esTerminal,
  minutosAtraso,
} from "../src/modules/orders/logistica";

describe("esTerminal — estados que no admiten más transiciones", () => {
  it("entregado y cancelado son terminales", () => {
    expect(esTerminal("entregado")).toBe(true);
    expect(esTerminal("cancelado")).toBe(true);
  });
  it("pendiente, en_ruta y fallido NO son terminales", () => {
    expect(esTerminal("pendiente")).toBe(false);
    expect(esTerminal("en_ruta")).toBe(false);
    expect(esTerminal("fallido")).toBe(false);
  });
});

describe("minutosAtraso — incumplimiento de SLA", () => {
  const AHORA = new Date("2026-06-17T12:00:00Z");

  it("devuelve 0 si no hay fecha límite", () => {
    expect(minutosAtraso(null, null, AHORA)).toBe(0);
    expect(minutosAtraso(undefined, null, AHORA)).toBe(0);
  });

  it("devuelve 0 si el límite aún no vence", () => {
    const limite = new Date(AHORA.getTime() + 30 * 60_000);
    expect(minutosAtraso(limite, null, AHORA)).toBe(0);
  });

  it("cuenta minutos desde el límite hasta ahora si sigue activo", () => {
    const limite = new Date(AHORA.getTime() - 45 * 60_000);
    expect(minutosAtraso(limite, null, AHORA)).toBe(45);
  });

  it("usa 'hasta' (entregadoEn) para medir cuán tarde se entregó", () => {
    const limite = new Date(AHORA.getTime() - 60 * 60_000);
    const entregadoEn = new Date(AHORA.getTime() - 20 * 60_000); // 40 min tarde
    expect(minutosAtraso(limite, entregadoEn, AHORA)).toBe(40);
  });

  it("una entrega a tiempo (hasta <= límite) da 0", () => {
    const limite = new Date(AHORA.getTime() - 30 * 60_000);
    const entregadoEn = new Date(AHORA.getTime() - 50 * 60_000); // entregó antes del límite
    expect(minutosAtraso(limite, entregadoEn, AHORA)).toBe(0);
  });
});

describe("catálogos de estados y motivos", () => {
  it("ESTADOS_PEDIDO contiene los 5 estados", () => {
    expect(ESTADOS_PEDIDO).toEqual([
      "pendiente",
      "en_ruta",
      "entregado",
      "fallido",
      "cancelado",
    ]);
  });
  it("solo entregado y cancelado son terminales", () => {
    expect(ESTADOS_TERMINALES).toEqual(["entregado", "cancelado"]);
  });
  it("los motivos tipificados están definidos", () => {
    expect(MOTIVOS_FALLO_VALORES).toContain("cliente_ausente");
    expect(MOTIVOS_CANCELACION_VALORES).toContain("cliente_cancelo");
  });
});
