/**
 * Tests de la lógica logística SLA (apps/web/lib/logistica.ts):
 * - atraso derivado (estaAtrasado / minutosAtraso)
 * - entrega a tiempo y métricas agregadas (OTD)
 * - validación de estados y terminalidad
 */
import {
  estaAtrasado,
  minutosAtraso,
  entregadoATiempo,
  calcularMetricasSLA,
  esEstadoValido,
  esTerminal,
  formatearAtraso,
} from "@/lib/logistica";

const AHORA = new Date("2026-06-17T12:00:00.000Z");
const hace = (min: number) => new Date(AHORA.getTime() - min * 60_000);
const en = (min: number) => new Date(AHORA.getTime() + min * 60_000);

describe("estaAtrasado — condición SLA derivada", () => {
  it("no está atrasado si no hay límite definido", () => {
    expect(estaAtrasado({ estado: "en_ruta", fechaEntregaLimite: null }, AHORA)).toBe(false);
  });
  it("está atrasado si el límite ya pasó y sigue activo", () => {
    expect(estaAtrasado({ estado: "en_ruta", fechaEntregaLimite: hace(30) }, AHORA)).toBe(true);
  });
  it("no está atrasado si el límite es futuro", () => {
    expect(estaAtrasado({ estado: "pendiente", fechaEntregaLimite: en(30) }, AHORA)).toBe(false);
  });
  it("un entregado nunca cuenta como atrasado activo", () => {
    expect(estaAtrasado({ estado: "entregado", fechaEntregaLimite: hace(120) }, AHORA)).toBe(false);
  });
  it("un cancelado nunca cuenta como atrasado activo", () => {
    expect(estaAtrasado({ estado: "cancelado", fechaEntregaLimite: hace(120) }, AHORA)).toBe(false);
  });
});

describe("minutosAtraso — minutos fuera de plazo", () => {
  it("0 si no hay límite", () => {
    expect(minutosAtraso({ estado: "en_ruta", fechaEntregaLimite: null }, AHORA)).toBe(0);
  });
  it("0 si va dentro de plazo", () => {
    expect(minutosAtraso({ estado: "en_ruta", fechaEntregaLimite: en(15) }, AHORA)).toBe(0);
  });
  it("acumula minutos desde el límite si sigue activo", () => {
    expect(minutosAtraso({ estado: "en_ruta", fechaEntregaLimite: hace(45) }, AHORA)).toBe(45);
  });
  it("para entregados mide límite → entregadoEn (cuánto tarde llegó)", () => {
    expect(
      minutosAtraso(
        { estado: "entregado", fechaEntregaLimite: hace(60), entregadoEn: hace(40) },
        AHORA
      )
    ).toBe(20);
  });
  it("0 para un cancelado aunque haya vencido", () => {
    expect(minutosAtraso({ estado: "cancelado", fechaEntregaLimite: hace(60) }, AHORA)).toBe(0);
  });
});

describe("entregadoATiempo", () => {
  it("true si entregó antes del límite", () => {
    expect(
      entregadoATiempo({ estado: "entregado", fechaEntregaLimite: en(10), entregadoEn: hace(5) })
    ).toBe(true);
  });
  it("false si entregó después del límite", () => {
    expect(
      entregadoATiempo({ estado: "entregado", fechaEntregaLimite: hace(30), entregadoEn: hace(5) })
    ).toBe(false);
  });
  it("true (no penaliza) si no hay límite", () => {
    expect(entregadoATiempo({ estado: "entregado", fechaEntregaLimite: null, entregadoEn: hace(5) })).toBe(true);
  });
  it("false si no está entregado", () => {
    expect(entregadoATiempo({ estado: "en_ruta", fechaEntregaLimite: en(10) })).toBe(false);
  });
});

describe("calcularMetricasSLA — agregados del dashboard", () => {
  const pedidos = [
    { estado: "entregado", fechaEntregaLimite: en(30), entregadoEn: hace(10) },   // a tiempo
    { estado: "entregado", fechaEntregaLimite: hace(60), entregadoEn: hace(40) },  // 20 min tarde
    { estado: "en_ruta", fechaEntregaLimite: hace(15) },                           // atrasado activo
    { estado: "pendiente", fechaEntregaLimite: en(120) },                          // dentro de plazo
    { estado: "cancelado", fechaEntregaLimite: hace(200) },                        // no cuenta
  ];

  it("cuenta atrasados activos (solo no terminales vencidos)", () => {
    expect(calcularMetricasSLA(pedidos, AHORA).atrasadosActivos).toBe(1);
  });
  it("calcula OTD = entregados a tiempo / entregados", () => {
    const m = calcularMetricasSLA(pedidos, AHORA);
    expect(m.entregados).toBe(2);
    expect(m.entregadosATiempo).toBe(1);
    expect(m.otd).toBe(50);
  });
  it("calcula el atraso promedio de las entregas tarde", () => {
    expect(calcularMetricasSLA(pedidos, AHORA).atrasoPromedioMin).toBe(20);
  });
  it("OTD 100% cuando no hay entregas", () => {
    expect(calcularMetricasSLA([], AHORA).otd).toBe(100);
  });
});

describe("esEstadoValido / esTerminal — incluye cancelado", () => {
  it("acepta los 5 estados operativos", () => {
    for (const e of ["pendiente", "en_ruta", "entregado", "fallido", "cancelado"]) {
      expect(esEstadoValido(e)).toBe(true);
    }
  });
  it("rechaza estados inexistentes (atrasado NO es estado)", () => {
    expect(esEstadoValido("atrasado")).toBe(false);
    expect(esEstadoValido("")).toBe(false);
  });
  it("entregado y cancelado son terminales; en_ruta no", () => {
    expect(esTerminal("entregado")).toBe(true);
    expect(esTerminal("cancelado")).toBe(true);
    expect(esTerminal("en_ruta")).toBe(false);
  });
});

describe("formatearAtraso", () => {
  it("'a tiempo' cuando no hay atraso", () => {
    expect(formatearAtraso(0)).toBe("a tiempo");
  });
  it("minutos", () => {
    expect(formatearAtraso(45)).toBe("45 min");
  });
  it("horas y minutos", () => {
    expect(formatearAtraso(125)).toBe("2 h 5 min");
  });
  it("horas exactas", () => {
    expect(formatearAtraso(120)).toBe("2 h");
  });
});
