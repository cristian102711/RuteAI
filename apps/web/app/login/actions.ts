// Re-exporta desde el logger centralizado (lib/authLogger.ts).
// Esto permite que otros Server Actions también usen logAuthEvent sin duplicar lógica.
export { logAuthEvent } from "@/lib/authLogger";
