import prisma from "@ruteai/database";

const ADMIN_EMAIL  = "admin@ruteai.com";
const ADMIN_NOMBRE = "Super Administrador";
// Este es el ID que Supabase Auth asignó al usuario recién creado
// Lo obtendremos buscando por email en la tabla si existe

async function main() {
  console.log("🔍 Verificando existencia del admin en la base de datos...\n");

  const existente = await prisma.usuario.findFirst({
    where: { email: ADMIN_EMAIL },
    include: { empresa: true },
  });

  if (existente) {
    console.log("✅ El usuario admin YA existe en la DB:");
    console.log(`   ID:    ${existente.id}`);
    console.log(`   Email: ${existente.email}`);
    console.log(`   Rol:   ${existente.rol}`);
    if (existente.empresa) {
      console.log(`   Empresa: ${existente.empresa.nombre}`);
    }

    // Asegurar que tenga rol super_admin
    if (existente.rol !== "super_admin") {
      await prisma.usuario.update({
        where: { id: existente.id },
        data: { rol: "super_admin" },
      });
      console.log("✅ Rol actualizado a super_admin.");
    } else {
      console.log("✅ El rol super_admin ya está asignado correctamente.");
    }
  } else {
    console.log("ℹ️  El usuario admin NO está en la tabla Usuario de Prisma.");
    console.log("   Esto ocurre porque el script anterior no pudo escribir en la DB.");
    console.log("   Solucionando con Prisma directamente...\n");

    // Crear empresa admin si no existe
    let empresa = await prisma.empresa.findFirst({ where: { email: ADMIN_EMAIL } });
    if (!empresa) {
      empresa = await prisma.empresa.create({
        data: {
          nombre:     "RouteAI HQ",
          email:      ADMIN_EMAIL,
          plan:       "business",
          planActivo: true,
          activa:     true,
        },
      });
      console.log(`✅ Empresa "RouteAI HQ" creada (ID: ${empresa.id})`);
    } else {
      console.log(`ℹ️  Empresa existente: ${empresa.nombre} (ID: ${empresa.id})`);
    }

    // Necesitamos el UUID de Supabase Auth — lo buscamos via Supabase admin
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      "https://ddasvwcwaxheqcwvfhva.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYXN2d2N3YXhoZXFjd3ZmaHZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAzNzk0MSwiZXhwIjoyMDg5NjEzOTQxfQ.1LXpzCs_mBqvwH0KhW9HInNDgd-ddjV0qMLGc4nnt6c",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: listData } = await supabase.auth.admin.listUsers();
    const authUser = listData?.users?.find((u) => u.email === ADMIN_EMAIL);

    if (!authUser) {
      console.error("❌ No se encontró el usuario en Supabase Auth. Vuelve a ejecutar crear-admin.mjs");
      return;
    }

    await prisma.usuario.create({
      data: {
        id:        authUser.id,
        nombre:    ADMIN_NOMBRE,
        email:     ADMIN_EMAIL,
        rol:       "super_admin",
        empresaId: empresa.id,
      },
    });

    console.log(`✅ Usuario admin creado en Prisma con ID: ${authUser.id}`);
  }

  console.log("\n🎉 ¡Todo listo! Ya puedes iniciar sesión en:");
  console.log("   http://localhost:3000/login");
  console.log("   Email:      admin@ruteai.com");
  console.log("   Contraseña: Admin1234!");
  console.log("   → Serás redirigido automáticamente a /admin\n");
}

main()
  .catch((e) => console.error("❌ Error:", e.message))
  .finally(() => prisma.$disconnect());
