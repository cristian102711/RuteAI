import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ── 1. Obtener la primera empresa y sus repartidores reales ───────────────
  const empresa = await prisma.empresa.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!empresa) {
    console.error("❌ No existe ninguna empresa. Loguéate primero en la app para crear una.");
    process.exit(1);
  }
  console.log(`✅ Empresa encontrada: ${empresa.nombre} (${empresa.id})`);

  const repartidores = await prisma.usuario.findMany({
    where: { empresaId: empresa.id, rol: "repartidor" },
    take: 3,
  });
  console.log(`👥 Repartidores reales: ${repartidores.length}`);

  // IDs de repartidores (null si no hay)
  const r0 = repartidores[0]?.id ?? null;
  const r1 = repartidores[1]?.id ?? null;
  const r2 = repartidores[2]?.id ?? null;

  const ahora = new Date();

  // ── 2. Borrar datos de demo previos (para poder re-ejecutar) ──────────────
  await prisma.alerta.deleteMany({ where: { empresaId: empresa.id, mensaje: { startsWith: "[DEMO]" } } });
  await prisma.pedido.deleteMany({ where: { empresaId: empresa.id, producto: { startsWith: "[DEMO]" } } });
  console.log("🧹 Datos de demo anteriores eliminados");

  // ── 3. Pedidos de demo ────────────────────────────────────────────────────
  const pedidosData = [
    // Entregados (ayer / hace 2 días)
    {
      nombreCliente: "Ana Torres Vega",
      clienteTelefono: "+56912345678",
      direccion: "Av. Providencia 1234, Santiago",
      lat: -33.4307, lng: -70.6097,
      producto: "[DEMO] iPhone 15 Pro",
      horarioPreferido: "10:00 - 13:00",
      estado: "entregado",
      scoreRiesgo: 12,
      repartidorId: r0,
      createdAt: new Date(ahora.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      nombreCliente: "Carlos Mendoza",
      clienteTelefono: "+56987654321",
      direccion: "Las Condes 4500, Santiago",
      lat: -33.4109, lng: -70.5780,
      producto: "[DEMO] MacBook Air M3",
      horarioPreferido: "14:00 - 18:00",
      estado: "entregado",
      scoreRiesgo: 8,
      repartidorId: r1 ?? r0,
      createdAt: new Date(ahora.getTime() - 26 * 60 * 60 * 1000),
    },
    {
      nombreCliente: "Sofía Ramírez",
      clienteTelefono: "+56911223344",
      direccion: "Av. Ossa 1055, La Reina",
      lat: -33.4503, lng: -70.5543,
      producto: "[DEMO] Zapatillas Nike Air",
      horarioPreferido: "09:00 - 12:00",
      estado: "entregado",
      scoreRiesgo: 5,
      repartidorId: r0,
      createdAt: new Date(ahora.getTime() - 20 * 60 * 60 * 1000),
    },
    {
      nombreCliente: "Pedro Soto",
      clienteTelefono: "+56944556677",
      direccion: "Av. Vitacura 2939, Vitacura",
      lat: -33.4015, lng: -70.5879,
      producto: "[DEMO] Smart TV Samsung 55\"",
      horarioPreferido: "10:00 - 14:00",
      estado: "entregado",
      scoreRiesgo: 15,
      repartidorId: r1 ?? r0,
      createdAt: new Date(ahora.getTime() - 4 * 60 * 60 * 1000),
    },
    // En ruta (hoy)
    {
      nombreCliente: "María Sepúlveda",
      clienteTelefono: "+56933445566",
      direccion: "Av. Irarrázaval 2250, Ñuñoa",
      lat: -33.4565, lng: -70.6110,
      producto: "[DEMO] Tablet iPad Air",
      horarioPreferido: "13:00 - 17:00",
      estado: "en_ruta",
      scoreRiesgo: 45,
      repartidorId: r0,
      createdAt: new Date(ahora.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      nombreCliente: "Diego Fernández",
      clienteTelefono: "+56966778899",
      direccion: "Gran Avenida 9200, La Cisterna",
      lat: -33.5288, lng: -70.6540,
      producto: "[DEMO] Silla gamer RGB",
      horarioPreferido: "12:00 - 16:00",
      estado: "en_ruta",
      scoreRiesgo: 62,
      repartidorId: r1 ?? r0,
      createdAt: new Date(ahora.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      nombreCliente: "Valentina Cruz",
      clienteTelefono: "+56977889900",
      direccion: "Pedro de Valdivia 1814, Providencia",
      lat: -33.4340, lng: -70.6120,
      producto: "[DEMO] Consola PS5",
      horarioPreferido: "15:00 - 19:00",
      estado: "en_ruta",
      scoreRiesgo: 78,
      repartidorId: r2 ?? r0,
      createdAt: new Date(ahora.getTime() - 1.5 * 60 * 60 * 1000),
    },
    // Pendientes (hoy recién creados)
    {
      nombreCliente: "Roberto Gutiérrez",
      clienteTelefono: "+56988990011",
      direccion: "Av. Kennedy 5413, Las Condes",
      lat: -33.4071, lng: -70.5686,
      producto: "[DEMO] Robot aspiradora Roomba",
      horarioPreferido: "10:00 - 13:00",
      estado: "pendiente",
      scoreRiesgo: 32,
      repartidorId: null,
      createdAt: new Date(ahora.getTime() - 30 * 60 * 1000),
    },
    {
      nombreCliente: "Gabriela Morales",
      clienteTelefono: "+56999001122",
      direccion: "Av. Los Leones 1070, Providencia",
      lat: -33.4234, lng: -70.6222,
      producto: "[DEMO] Cafetera Nespresso",
      horarioPreferido: "14:00 - 18:00",
      estado: "pendiente",
      scoreRiesgo: 18,
      repartidorId: r0,
      createdAt: new Date(ahora.getTime() - 15 * 60 * 1000),
    },
    {
      nombreCliente: "Andrés Paredes",
      clienteTelefono: "+56900112233",
      direccion: "Av. Colón 4850, Macul",
      lat: -33.4807, lng: -70.5977,
      producto: "[DEMO] Monitor LG 27\"",
      horarioPreferido: "09:00 - 12:00",
      estado: "pendiente",
      scoreRiesgo: 55,
      repartidorId: null,
      createdAt: new Date(ahora.getTime() - 5 * 60 * 1000),
    },
    // Fallidos
    {
      nombreCliente: "Lorena Vidal",
      clienteTelefono: "+56911334455",
      direccion: "Av. Matta 1200, Santiago Centro",
      lat: -33.4649, lng: -70.6483,
      producto: "[DEMO] Batidora Kitchen Aid",
      horarioPreferido: "10:00 - 13:00",
      estado: "fallido",
      scoreRiesgo: 85,
      motivoFallo: "Nadie en domicilio al momento de la entrega",
      repartidorId: r1 ?? r0,
      createdAt: new Date(ahora.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      nombreCliente: "Ignacio Contreras",
      clienteTelefono: "+56922334455",
      direccion: "Av. Departamental 1500, La Florida",
      lat: -33.5242, lng: -70.5954,
      producto: "[DEMO] Bicicleta eléctrica",
      horarioPreferido: "13:00 - 17:00",
      estado: "fallido",
      scoreRiesgo: 91,
      motivoFallo: "Dirección incorrecta — edificio no existe",
      repartidorId: r2 ?? r0,
      createdAt: new Date(ahora.getTime() - 8 * 60 * 60 * 1000),
    },
  ];

  console.log(`📦 Creando ${pedidosData.length} pedidos de demo...`);
  const pedidosCreados = await Promise.all(
    pedidosData.map((p) =>
      prisma.pedido.create({
        data: {
          ...p,
          empresaId: empresa.id,
        },
      })
    )
  );
  console.log(`✅ ${pedidosCreados.length} pedidos creados`);

  // ── 4. Alertas de demo ────────────────────────────────────────────────────
  const pedidoEnRuta = pedidosCreados.find((p) => p.estado === "en_ruta" && p.scoreRiesgo! >= 70);
  const pedidoFallido = pedidosCreados.find((p) => p.estado === "fallido");

  const alertasData = [
    {
      tipo: "riesgo_alto",
      mensaje: `[DEMO] Pedido de Valentina Cruz tiene score IA de 78% — alta probabilidad de fallo en entrega`,
      leida: false,
      repartidorId: r2 ?? r0,
      pedidoId: pedidoEnRuta?.id,
      createdAt: new Date(ahora.getTime() - 45 * 60 * 1000),
    },
    {
      tipo: "retraso",
      mensaje: `[DEMO] Diego Fernández lleva 40 minutos de retraso en su ruta — ventana horaria vence en 20 min`,
      leida: false,
      repartidorId: r1 ?? r0,
      createdAt: new Date(ahora.getTime() - 20 * 60 * 1000),
    },
    {
      tipo: "desvio",
      mensaje: `[DEMO] Repartidor se ha desviado 2.3 km de la ruta óptima en Sector Maipú`,
      leida: false,
      repartidorId: r0,
      createdAt: new Date(ahora.getTime() - 10 * 60 * 1000),
    },
    {
      tipo: "riesgo_alto",
      mensaje: `[DEMO] Pedido de Andrés Paredes en zona de alto riesgo — 3 fallos anteriores en ese sector`,
      leida: false,
      repartidorId: null,
      createdAt: new Date(ahora.getTime() - 5 * 60 * 1000),
    },
    {
      tipo: "retraso",
      mensaje: `[DEMO] Lorena Vidal — entrega fallida por segundo intento. SLA vencido hace 12 minutos`,
      leida: false,
      repartidorId: r1 ?? r0,
      pedidoId: pedidoFallido?.id,
      createdAt: new Date(ahora.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      tipo: "desvio",
      mensaje: `[DEMO] Tráfico crítico detectado en Ruta 5 Sur — se recomienda ruta alternativa por Autopista Central`,
      leida: true, // Ya resuelta
      repartidorId: r0,
      createdAt: new Date(ahora.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      tipo: "riesgo_alto",
      mensaje: `[DEMO] Entrega de Ignacio Contreras marcada como fallida — dirección incorrecta reportada`,
      leida: true, // Ya resuelta
      repartidorId: r2 ?? r0,
      pedidoId: pedidoFallido?.id,
      createdAt: new Date(ahora.getTime() - 7 * 60 * 60 * 1000),
    },
  ];

  console.log(`🚨 Creando ${alertasData.length} alertas de demo...`);
  await Promise.all(
    alertasData.map((a) =>
      prisma.alerta.create({
        data: {
          ...a,
          empresaId: empresa.id,
        },
      })
    )
  );
  console.log(`✅ ${alertasData.length} alertas creadas`);

  // ── 5. Ubicaciones GPS (pings simulados para el mapa) ─────────────────────
  if (r0) {
    const pings = [
      { lat: -33.4560, lng: -70.6122 },
      { lat: -33.4580, lng: -70.6100 },
      { lat: -33.4600, lng: -70.6080 },
    ];
    await Promise.all(
      pings.map((p, i) =>
        prisma.ubicacion.create({
          data: {
            ...p,
            repartidorId: r0,
            empresaId: empresa.id,
            timestamp: new Date(ahora.getTime() - (3 - i) * 2 * 60 * 1000),
          },
        })
      )
    );
    console.log(`📍 3 pings GPS creados para repartidor 1`);
  }

  if (r1) {
    await prisma.ubicacion.create({
      data: {
        lat: -33.5280,
        lng: -70.6545,
        repartidorId: r1,
        empresaId: empresa.id,
        timestamp: new Date(ahora.getTime() - 5 * 60 * 1000),
      },
    });
    console.log(`📍 1 ping GPS creado para repartidor 2`);
  }

  // ── 6. Reporte Cache (para gráfico semanal del dashboard) ─────────────────
  const diasSemana = 7;
  for (let i = diasSemana; i >= 1; i--) {
    const fecha = new Date(ahora);
    fecha.setDate(fecha.getDate() - i);
    fecha.setHours(0, 0, 0, 0);

    const entregados = Math.floor(Math.random() * 8) + 3;   // 3-10
    const fallidos   = Math.floor(Math.random() * 2);        // 0-1
    const total      = entregados + fallidos + Math.floor(Math.random() * 3);

    await prisma.reporteCache.upsert({
      where: { empresaId_fecha: { empresaId: empresa.id, fecha } },
      create: {
        empresaId: empresa.id,
        fecha,
        datos: { entregados, fallidos, total, eficiencia: Math.round((entregados / total) * 100) },
      },
      update: {
        datos: { entregados, fallidos, total, eficiencia: Math.round((entregados / total) * 100) },
      },
    });
  }
  console.log(`📊 7 días de datos del gráfico semanal generados`);

  // ── 7. Resumen final ──────────────────────────────────────────────────────
  const resumen = await prisma.pedido.groupBy({
    by: ["estado"],
    where: { empresaId: empresa.id },
    _count: { id: true },
  });

  console.log("\n══════════════════════════════════════");
  console.log("🎉 SEED DE DEMO COMPLETADO");
  console.log("══════════════════════════════════════");
  console.log(`Empresa:  ${empresa.nombre}`);
  console.log(`Pedidos:`);
  resumen.forEach((r) => console.log(`  ${r.estado}: ${r._count.id}`));
  const totalAlertas = await prisma.alerta.count({ where: { empresaId: empresa.id } });
  console.log(`Alertas: ${totalAlertas} (${alertasData.filter(a => !a.leida).length} activas)`);
  console.log("══════════════════════════════════════");
  console.log(`\n✅ Abre: https://ruteai.vercel.app/dashboard`);
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
