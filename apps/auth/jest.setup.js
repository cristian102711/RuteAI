// Evita app.listen() en tests y provee credenciales Supabase ficticias para que
// el cliente admin se instancie sin red ni .env real (los tests de /health y de
// validación Zod no llaman a Supabase). dotenv no sobreescribe vars ya definidas.
process.env.NODE_ENV = "production";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost:54321";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-service-role-key";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "test-anon-key";
