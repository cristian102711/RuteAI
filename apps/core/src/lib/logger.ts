export const logger = {
  info(message: string, meta?: Record<string, any>) {
    console.log(
      JSON.stringify({
        level: "info",
        message,
        ...meta,
        timestamp: new Date().toISOString(),
      })
    );
  },

  warn(message: string, meta?: Record<string, any>) {
    console.warn(
      JSON.stringify({
        level: "warn",
        message,
        ...meta,
        timestamp: new Date().toISOString(),
      })
    );
  },

  error(message: string, error?: any, meta?: Record<string, any>) {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ...meta,
        timestamp: new Date().toISOString(),
      })
    );
  },
};
