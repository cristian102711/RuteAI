// ── index.bootstrap.test.ts ──────────────────────────────────────────────────
// Cubre el branch y la función que quedan sin cubrir en src/index.ts:
//
//   if (process.env.NODE_ENV !== "production") {   ← branch (el lado "true")
//     app.listen(PORT, () => {
//       console.log(...)                            ← función (callback)
//     });
//   }
//
// jest.setup.js fija NODE_ENV = "production" para todos los tests, por lo que
// ese branch nunca se toma durante la suite normal. Este archivo lo cubre
// re-cargando el módulo en modo aislado con NODE_ENV = "development" y
// espiando express.application.listen para:
//   a) evitar que se abra un socket de red real, y
//   b) invocar el callback inmediatamente, cubriendo la función anónima.

describe("src/index.ts — bootstrap del servidor", () => {
  let originalEnv: string | undefined;

  beforeAll(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("llama a app.listen (y su callback) cuando NODE_ENV no es 'production'", () => {
    const consoleSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    let capturedListen: jest.Mock | undefined;

    jest.isolateModules(() => {
      // Dentro del contexto aislado, obtenemos el módulo express fresco
      // y espiamos su método 'listen' en el prototipo antes de cargar index.ts.
      const expressMod = require("express") as typeof import("express");
      capturedListen = jest
        .spyOn(expressMod.application, "listen")
        .mockImplementation(function (this: unknown, _port: unknown, cb?: unknown) {
          // Invocamos el callback para cubrir la función anónima (lines 25-26)
          if (typeof cb === "function") cb();
          return {} as ReturnType<typeof expressMod.application.listen>;
        }) as jest.Mock;

      process.env.NODE_ENV = "development";
      require("../src/index"); // ahora sí entra en el if (NODE_ENV !== "production")
    });

    expect(capturedListen).toBeDefined();
    expect(capturedListen).toHaveBeenCalled();
    // El callback invocado debe haber escrito el log de arranque
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("@ruteai/auth"),
    );

    consoleSpy.mockRestore();
    process.env.NODE_ENV = "production"; // restaurar antes de otros tests
  });
});
