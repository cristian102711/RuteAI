/**
 * Script para crear o actualizar la cuenta de Super Admin
 * Uso: node scripts/crear-admin.mjs
 */

import { createClient } from "@supabase/supabase-js";

// ── Configuración ────────────────────────────────────────────────────────────
const SUPABASE_URL        = "https://ddasvwcwaxheqcwvfhva.supabase.co";
const SERVICE_ROLE_KEY    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYXN2d2N3YXhoZXFjd3ZmaHZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAzNzk0MSwiZXhwIjoyMDg5NjEzOTQxfQ.1LXpzCs_mBqvwH0KhW9HInNDgd-ddjV0qMLGc4nnt6c";

// ✏️  CAMBIA ESTOS DATOS por los que quieras para tu admin
const ADMIN_EMAIL    = "admin@ruteai.com";
const ADMIN_PASSWORD = "Admin1234!";
const ADMIN_NOMBRE   = "Super Administrador";
// ────────────────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("🚀 Iniciando creación de cuenta Super Admin...\n");

  // 1. Verificar si el usuario ya existe en Supabase Auth
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("❌ Error al listar usuarios:", listError.message);
    process.exit(1);
  }

  const existingUser = listData?.users?.find(u => u.email === ADMIN_EMAIL);

  let userId;

  if (existingUser) {
    console.log(`ℹ️  El usuario ${ADMIN_EMAIL} ya existe. Actualizando metadatos...`);
    
    // Actualizar metadatos para asignar rol super_admin
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        user_metadata: { rol: "super_admin", nombre: ADMIN_NOMBRE },
        app_metadata:  { rol: "super_admin" },
      }
    );

    if (updateError) {
      console.error("❌ Error al actualizar usuario:", updateError.message);
      process.exit(1);
    }

    userId = existingUser.id;
    console.log("✅ Metadatos actualizados correctamente.");
  } else {
    // Crear usuario nuevo con rol super_admin
    console.log(`➕ Creando nuevo usuario: ${ADMIN_EMAIL}`);
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email:         ADMIN_EMAIL,
      password:      ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { rol: "super_admin", nombre: ADMIN_NOMBRE },
      app_metadata:  { rol: "super_admin" },
    });

    if (createError) {
      console.error("❌ Error al crear usuario:", createError.message);
      process.exit(1);
    }

    userId = createData.user.id;
    console.log("✅ Usuario de Supabase Auth creado.");
  }

  // 2. Insertar/actualizar en la tabla Usuario de Prisma (via Supabase REST directo)
  console.log("\n📦 Sincronizando con base de datos Prisma...");

  // Buscar si ya existe en la tabla Usuario
  const { data: existsInDB } = await supabase
    .from("Usuario")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existsInDB) {
    // Actualizar rol
    const { error: updateDB } = await supabase
      .from("Usuario")
      .update({ rol: "super_admin", nombre: ADMIN_NOMBRE })
      .eq("id", userId);

    if (updateDB) {
      console.warn("⚠️  No se pudo actualizar el rol en la DB:", updateDB.message);
    } else {
      console.log("✅ Rol actualizado en la tabla Usuario.");
    }
  } else {
    // Buscar o crear empresa del super admin
    let { data: empresaData } = await supabase
      .from("Empresa")
      .select("id")
      .eq("email", ADMIN_EMAIL)
      .maybeSingle();

    if (!empresaData) {
      const { data: newEmpresa, error: empresaErr } = await supabase
        .from("Empresa")
        .insert({ nombre: "RouteAI HQ", email: ADMIN_EMAIL, plan: "business", planActivo: true, activa: true })
        .select("id")
        .single();

      if (empresaErr) {
        console.warn("⚠️  No se pudo crear empresa:", empresaErr.message);
      } else {
        empresaData = newEmpresa;
        console.log("✅ Empresa 'RouteAI HQ' creada.");
      }
    }

    const { error: insertErr } = await supabase.from("Usuario").insert({
      id:        userId,
      nombre:    ADMIN_NOMBRE,
      email:     ADMIN_EMAIL,
      rol:       "super_admin",
      empresaId: empresaData?.id ?? null,
    });

    if (insertErr) {
      console.warn("⚠️  No se pudo insertar en DB:", insertErr.message);
      console.warn("    Esto es normal si ya existe. El login de admin igual funcionará.");
    } else {
      console.log("✅ Usuario insertado en tabla Usuario.");
    }
  }

  console.log("\n🎉 ¡Listo! Credenciales de acceso al Admin:");
  console.log("─────────────────────────────────────────");
  console.log(`  URL:        http://localhost:3000/login`);
  console.log(`  Email:      ${ADMIN_EMAIL}`);
  console.log(`  Contraseña: ${ADMIN_PASSWORD}`);
  console.log("─────────────────────────────────────────");
  console.log("  Después del login serás redirigido a /admin\n");
}

main().catch((err) => {
  console.error("❌ Error inesperado:", err);
  process.exit(1);
});
