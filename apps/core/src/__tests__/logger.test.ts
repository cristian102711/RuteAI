// ================================================================
// Tests unitarios para @ruteai/core
// Cubre: logger.ts (JSON Structured Logger)
// Patrón: AAA (Arrange - Act - Assert)
// ================================================================

import { logger } from "../lib/logger";

describe("logger (JSON Structured Logger)", () => {
  let consoleSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("logger.info()", () => {
    it("emite JSON con level='info' y el mensaje correcto", () => {
      logger.info("Pedido creado");

      const llamada = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(llamada);

      expect(parsed.level).toBe("info");
      expect(parsed.message).toBe("Pedido creado");
    });

    it("incluye timestamp en formato ISO 8601", () => {
      logger.info("Test");

      const parsed = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("incluye metadatos opcionales en el JSON", () => {
      logger.info("Usuario autenticado", { userId: "abc-123", rol: "encargado" });

      const parsed = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(parsed.userId).toBe("abc-123");
      expect(parsed.rol).toBe("encargado");
    });
  });

  describe("logger.warn()", () => {
    it("emite JSON con level='warn'", () => {
      logger.warn("Rate limit excedido", { ip: "192.168.1.1" });

      const parsed = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
      expect(parsed.level).toBe("warn");
      expect(parsed.message).toBe("Rate limit excedido");
      expect(parsed.ip).toBe("192.168.1.1");
    });
  });

  describe("logger.error()", () => {
    it("emite JSON con level='error' e incluye el mensaje del Error", () => {
      const err = new Error("Conexión rechazada");
      logger.error("Error de base de datos", err);

      const parsed = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(parsed.level).toBe("error");
      expect(parsed.message).toBe("Error de base de datos");
      expect(parsed.error).toBe("Conexión rechazada");
    });

    it("incluye el stack trace cuando el error es una instancia de Error", () => {
      const err = new Error("fallo");
      logger.error("Error interno", err);

      const parsed = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(parsed.stack).toBeDefined();
    });

    it("convierte a string cuando el error no es instancia de Error", () => {
      logger.error("Error inesperado", "string de error");

      const parsed = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(parsed.error).toBe("string de error");
    });
  });
});
