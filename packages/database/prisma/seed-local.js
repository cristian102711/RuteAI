// ============================================================
// seed-local.js — Datos de prueba LOCALES (JavaScript puro, sin ts-node).
//
// Crea, sobre la primera empresa existente:
//   - 4 repartidores (rol="repartidor")  [marca: email @demo.local]
//   - 16 pedidos cubriendo TODOS los estados y escenarios SLA
//     (a tiempo, entregado tarde, atrasado activo, fallido, cancelado)
//   - Timeline de eventos (EventoPedido) por pedido
//   - 2 rutas, alertas, pings GPS con velocidad y gráfico semanal
//
// Requisito: haber iniciado sesión una vez en http://localhost:3000
//            para que el onboarding cree la empresa + tu usuario encargado.
//
// Es IDEMPOTENTE: borra los datos [DEMO] previos antes de recrearlos.
//   Ejecutar:  node prisma/seed-local.js   (desde packages/database)
// ============================================================
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ahora = new Date();
const min = (n) => new Date(ahora.getTime() + n * 60_000);
const hr = (n) => new Date(ahora.getTime() + n * 60 * 60_000);
const day = (n) => new Date(ahora.getTime() + n * 24 * 60 * 60_000);

async function main() {
  // ── 1. Empresa (creada por el onboarding al loguearte) ─────────────────────
  const empresa = await prisma.empresa.findFirst({ orderBy: { createdAt: "asc" } });
  if (!empresa) {
    console.error(
      "\n❌ No existe ninguna empresa en la DB local.\n" +
        "   Inicia sesión una vez en http://localhost:3000 y completa el\n" +
        "   onboarding (nombre de empresa). Eso crea la empresa + tu usuario\n" +
        "   encargado. Luego vuelve a correr este seed.\n"
    );
    process.exit(1);
  }
  console.log(`✅ Empresa: ${empresa.nombre} (${empresa.id})`);

  // ── 2. Limpieza de datos [DEMO] previos (orden por FKs) ────────────────────
  const repartidoresPrevios = await prisma.usuario.findMany({
    where: { empresaId: empresa.id, email: { endsWith: "@demo.local" } },
    select: { id: true },
  });
  const idsPrevios = repartidoresPrevios.map((r) => r.id);

  await prisma.alerta.deleteMany({ where: { empresaId: empresa.id, mensaje: { startsWith: "[DEMO]" } } });
  // Borra pedidos demo (cascada a EventoPedido)
  await prisma.pedido.deleteMany({ where: { empresaId: empresa.id, producto: { startsWith: "[DEMO]" } } });
  if (idsPrevios.length) {
    await prisma.ruta.deleteMany({ where: { repartidorId: { in: idsPrevios } } });
    await prisma.ubicacion.deleteMany({ where: { repartidorId: { in: idsPrevios } } });
    await prisma.usuario.deleteMany({ where: { id: { in: idsPrevios } } });
  }
  console.log("🧹 Datos [DEMO] anteriores eliminados");

  // ── 3. Repartidores ────────────────────────────────────────────────────────
  const repartidoresData = [
    { nombre: "Juan Pérez",    email: "juan.perez@demo.local",    telefono: "+56911111111", vehiculo: "Moto",   patente: "JP-10-20" },
    { nombre: "Camila Rojas",  email: "camila.rojas@demo.local",  telefono: "+56922222222", vehiculo: "Auto",   patente: "CR-30-40" },
    { nombre: "Diego Fuentes", email: "diego.fuentes@demo.local", telefono: "+56933333333", vehiculo: "Furgón", patente: "DF-50-60" },
    { nombre: "Tomás Silva",   email: "tomas.silva@demo.local",   telefono: "+56944444444", vehiculo: "Moto",   patente: "TS-70-80" },
  ];
  const repartidores = [];
  for (const r of repartidoresData) {
    repartidores.push(
      await prisma.usuario.create({
        data: { id: crypto.randomUUID(), rol: "repartidor", empresaId: empresa.id, ...r },
      })
    );
  }
  const [r0, r1, r2, r3] = repartidores.map((r) => r.id);
  console.log(`👥 ${repartidores.length} repartidores creados`);

  // ── 4. Rutas (agrupan los pedidos en_ruta) ─────────────────────────────────
  const rutaJuan = await prisma.ruta.create({
    data: { fecha: ahora, estado: "en_curso", empresaId: empresa.id, repartidorId: r0 },
  });
  const rutaCamila = await prisma.ruta.create({
    data: { fecha: ahora, estado: "en_curso", empresaId: empresa.id, repartidorId: r1 },
  });
  console.log("🛣️  2 rutas creadas (en_curso)");

  // ── 5. Pedidos (16) — cada uno con su escenario SLA explícito ──────────────
  // Helper: crea el pedido y su timeline de eventos en una transacción.
  async function crearPedido(p, eventos) {
    const pedido = await prisma.pedido.create({ data: { ...p, empresaId: empresa.id } });
    if (eventos && eventos.length) {
      await prisma.eventoPedido.createMany({
        data: eventos.map((e) => ({ ...e, pedidoId: pedido.id })),
      });
    }
    return pedido;
  }

  const A = "Av. Providencia 1234, Santiago";
  const pedidos = [
    // ─── ENTREGADOS A TIEMPO (5) → suben OTD ───────────────────────────────
    {
      p: { nombreCliente: "Ana Torres", clienteTelefono: "+56912345678", direccion: A,
           lat: -33.4307, lng: -70.6097, producto: "[DEMO] iPhone 15 Pro", horarioPreferido: "10:00 - 13:00",
           estado: "entregado", scoreRiesgo: 0.12, repartidorId: r0,
           fechaEntregaLimite: hr(-2), despachadoEn: hr(-4), entregadoEn: hr(-2.5),
           createdAt: hr(-5), rutaId: rutaJuan.id },
      ev: [
        { tipo: "creado",     estadoNuevo: "pendiente", createdAt: hr(-5) },
        { tipo: "despachado", estadoAnterior: "pendiente", estadoNuevo: "en_ruta", createdAt: hr(-4) },
        { tipo: "entregado",  estadoAnterior: "en_ruta", estadoNuevo: "entregado", createdAt: hr(-2.5), metadata: { sinFoto: false } },
      ],
    },
    {
      p: { nombreCliente: "Carlos Mendoza", clienteTelefono: "+56987654321", direccion: "Las Condes 4500, Santiago",
           lat: -33.4109, lng: -70.5780, producto: "[DEMO] MacBook Air M3", horarioPreferido: "14:00 - 18:00",
           estado: "entregado", scoreRiesgo: 0.08, repartidorId: r1,
           fechaEntregaLimite: hr(-3), despachadoEn: hr(-5), entregadoEn: hr(-3.4),
           createdAt: hr(-6) },
      ev: [
        { tipo: "creado",     estadoNuevo: "pendiente", createdAt: hr(-6) },
        { tipo: "despachado", estadoAnterior: "pendiente", estadoNuevo: "en_ruta", createdAt: hr(-5) },
        { tipo: "entregado",  estadoAnterior: "en_ruta", estadoNuevo: "entregado", createdAt: hr(-3.4) },
      ],
    },
    {
      p: { nombreCliente: "Sofía Ramírez", clienteTelefono: "+56911223344", direccion: "Av. Ossa 1055, La Reina",
           lat: -33.4503, lng: -70.5543, producto: "[DEMO] Zapatillas Nike Air", horarioPreferido: "09:00 - 12:00",
           estado: "entregado", scoreRiesgo: 0.05, repartidorId: r0, entregaSinFoto: true,
           fechaEntregaLimite: hr(-1.5), despachadoEn: hr(-3), entregadoEn: hr(-2),
           createdAt: hr(-4) },
      ev: [
        { tipo: "creado",     estadoNuevo: "pendiente", createdAt: hr(-4) },
        { tipo: "despachado", estadoAnterior: "pendiente", estadoNuevo: "en_ruta", createdAt: hr(-3) },
        { tipo: "entregado",  estadoAnterior: "en_ruta", estadoNuevo: "entregado", createdAt: hr(-2), descripcion: "Entrega confirmada sin foto", metadata: { sinFoto: true } },
      ],
    },
    {
      p: { nombreCliente: "Pedro Soto", clienteTelefono: "+56944556677", direccion: "Av. Vitacura 2939, Vitacura",
           lat: -33.4015, lng: -70.5879, producto: '[DEMO] Smart TV Samsung 55"', horarioPreferido: "10:00 - 14:00",
           estado: "entregado", scoreRiesgo: 0.15, repartidorId: r2,
           fechaEntregaLimite: hr(-1), despachadoEn: hr(-3), entregadoEn: hr(-1.2),
           createdAt: hr(-4) },
      ev: [
        { tipo: "creado",     estadoNuevo: "pendiente", createdAt: hr(-4) },
        { tipo: "despachado", estadoAnterior: "pendiente", estadoNuevo: "en_ruta", createdAt: hr(-3) },
        { tipo: "entregado",  estadoAnterior: "en_ruta", estadoNuevo: "entregado", createdAt: hr(-1.2) },
      ],
    },
    {
      p: { nombreCliente: "Francisca Díaz", clienteTelefono: "+56955667788", direccion: "Av. Apoquindo 6410, Las Condes",
           lat: -33.4084, lng: -70.5662, producto: "[DEMO] AirPods Pro", horarioPreferido: "11:00 - 15:00",
           estado: "entregado", scoreRiesgo: 0.10, repartidorId: r3,
           fechaEntregaLimite: min(-30), despachadoEn: hr(-2), entregadoEn: min(-50),
           createdAt: hr(-3) },
      ev: [
        { tipo: "creado",     estadoNuevo: "pendiente", createdAt: hr(-3) },
        { tipo: "despachado", estadoAnterior: "pendiente", estadoNuevo: "en_ruta", createdAt: hr(-2) },
        { tipo: "entregado",  estadoAnterior: "en_ruta", estadoNuevo: "entregado", createdAt: min(-50) },
      ],
    },

    // ─── ENTREGADOS TARDE (2) → bajan OTD, suben atraso promedio ───────────
    {
      p: { nombreCliente: "Roberto Vega", clienteTelefono: "+56966778899", direccion: "Av. Matta 1200, Santiago Centro",
           lat: -33.4649, lng: -70.6483, producto: "[DEMO] Refrigerador LG", horarioPreferido: "10:00 - 13:00",
           estado: "entregado", scoreRiesgo: 0.55, repartidorId: r1,
           fechaEntregaLimite: hr(-4), despachadoEn: hr(-5), entregadoEn: hr(-3), // 60 min tarde
           createdAt: hr(-6) },
      ev: [
        { tipo: "creado",     estadoNuevo: "pendiente", createdAt: hr(-6) },
        { tipo: "despachado", estadoAnterior: "pendiente", estadoNuevo: "en_ruta", createdAt: hr(-5) },
        { tipo: "atraso",     descripcion: "Entrega fuera de plazo", createdAt: hr(-4), metadata: { minutosAtraso: 60 } },
        { tipo: "entregado",  estadoAnterior: "en_ruta", estadoNuevo: "entregado", createdAt: hr(-3), metadata: { minutosAtraso: 60 } },
      ],
    },
    {
      p: { nombreCliente: "Lucía Herrera", clienteTelefono: "+56977889900", direccion: "Av. Macul 2950, Macul",
           lat: -33.4807, lng: -70.5977, producto: "[DEMO] Lavadora Mademsa", horarioPreferido: "09:00 - 12:00",
           estado: "entregado", scoreRiesgo: 0.48, repartidorId: r2,
           fechaEntregaLimite: hr(-6), despachadoEn: hr(-7), entregadoEn: hr(-5.25), // 45 min tarde
           createdAt: hr(-8) },
      ev: [
        { tipo: "creado",     estadoNuevo: "pendiente", createdAt: hr(-8) },
        { tipo: "despachado", estadoAnterior: "pendiente", estadoNuevo: "en_ruta", createdAt: hr(-7) },
        { tipo: "entregado",  estadoAnterior: "en_ruta", estadoNuevo: "entregado", createdAt: hr(-5.25), metadata: { minutosAtraso: 45 } },
      ],
    },

    // ─── EN RUTA ATRASADOS (2) → "Atrasados ahora" + badge rojo ────────────
    {
      p: { nombreCliente: "María Sepúlveda", clienteTelefono: "+56933445566", direccion: "Av. Irarrázaval 2250, Ñuñoa",
           lat: -33.4565, lng: -70.6110, producto: "[DEMO] Tablet iPad Air", horarioPreferido: "13:00 - 15:00",
           estado: "en_ruta", scoreRiesgo: 0.62, repartidorId: r0,
           fechaEntregaLimite: min(-40), despachadoEn: hr(-2), createdAt: hr(-3), rutaId: rutaJuan.id },
      ev: [
        { tipo: "creado",     estadoNuevo: "pendiente", createdAt: hr(-3) },
        { tipo: "despachado", estadoAnterior: "pendiente", estadoNuevo: "en_ruta", createdAt: hr(-2) },
      ],
    },
    {
      p: { nombreCliente: "Diego Fernández", clienteTelefono: "+56966778800", direccion: "Gran Avenida 9200, La Cisterna",
           lat: -33.5288, lng: -70.6540, producto: "[DEMO] Silla gamer RGB", horarioPreferido: "12:00 - 14:00",
           estado: "en_ruta", scoreRiesgo: 0.78, repartidorId: r1,
           fechaEntregaLimite: min(-90), despachadoEn: hr(-3), createdAt: hr(-4), rutaId: rutaCamila.id },
      ev: [
        { tipo: "creado",     estadoNuevo: "pendiente", createdAt: hr(-4) },
        { tipo: "despachado", estadoAnterior: "pendiente", estadoNuevo: "en_ruta", createdAt: hr(-3) },
      ],
    },

    // ─── EN RUTA A TIEMPO (1) ──────────────────────────────────────────────
    {
      p: { nombreCliente: "Valentina Cruz", clienteTelefono: "+56977889911", direccion: "Pedro de Valdivia 1814, Providencia",
           lat: -33.4340, lng: -70.6120, producto: "[DEMO] Consola PS5", horarioPreferido: "15:00 - 19:00",
           estado: "en_ruta", scoreRiesgo: 0.30, repartidorId: r0,
           fechaEntregaLimite: hr(1.5), despachadoEn: min(-30), createdAt: hr(-1), rutaId: rutaJuan.id },
      ev: [
        { tipo: "creado",     estadoNuevo: "pendiente", createdAt: hr(-1) },
        { tipo: "despachado", estadoAnterior: "pendiente", estadoNuevo: "en_ruta", createdAt: min(-30) },
      ],
    },

    // ─── PENDIENTE ATRASADO (1) → sin asignar, ya venció ───────────────────
    {
      p: { nombreCliente: "Andrés Paredes", clienteTelefono: "+56900112233", direccion: "Av. Colón 4850, Macul",
           lat: -33.4807, lng: -70.5977, producto: "[DEMO] Monitor LG 27\"", horarioPreferido: "09:00 - 12:00",
           estado: "pendiente", scoreRiesgo: 0.40, repartidorId: null,
           fechaEntregaLimite: min(-20), createdAt: hr(-2) },
      ev: [{ tipo: "creado", estadoNuevo: "pendiente", createdAt: hr(-2) }],
    },

    // ─── PENDIENTES A TIEMPO (2) ───────────────────────────────────────────
    {
      p: { nombreCliente: "Gabriela Morales", clienteTelefono: "+56999001122", direccion: "Av. Los Leones 1070, Providencia",
           lat: -33.4234, lng: -70.6222, producto: "[DEMO] Cafetera Nespresso", horarioPreferido: "14:00 - 18:00",
           estado: "pendiente", scoreRiesgo: 0.18, repartidorId: r3,
           fechaEntregaLimite: hr(3), createdAt: min(-15) },
      ev: [{ tipo: "creado", estadoNuevo: "pendiente", createdAt: min(-15) }],
    },
    {
      p: { nombreCliente: "Roberto Gutiérrez", clienteTelefono: "+56988990011", direccion: "Av. Kennedy 5413, Las Condes",
           lat: -33.4071, lng: -70.5686, producto: "[DEMO] Robot aspiradora Roomba", horarioPreferido: "10:00 - 13:00",
           estado: "pendiente", scoreRiesgo: 0.32, repartidorId: null,
           fechaEntregaLimite: hr(5), createdAt: min(-8) },
      ev: [{ tipo: "creado", estadoNuevo: "pendiente", createdAt: min(-8) }],
    },

    // ─── FALLIDOS (2) → re-agendables, con motivo e intentos ───────────────
    {
      p: { nombreCliente: "Lorena Vidal", clienteTelefono: "+56911334455", direccion: "Av. Independencia 800, Independencia",
           lat: -33.4180, lng: -70.6560, producto: "[DEMO] Batidora Kitchen Aid", horarioPreferido: "10:00 - 13:00",
           estado: "fallido", scoreRiesgo: 0.85, repartidorId: r1, intentosEntrega: 1,
           motivoFallo: "cliente_ausente", fechaEntregaLimite: hr(-1), despachadoEn: hr(-3), createdAt: hr(-4) },
      ev: [
        { tipo: "creado",     estadoNuevo: "pendiente", createdAt: hr(-4) },
        { tipo: "despachado", estadoAnterior: "pendiente", estadoNuevo: "en_ruta", createdAt: hr(-3) },
        { tipo: "fallido",    estadoAnterior: "en_ruta", estadoNuevo: "fallido", motivo: "cliente_ausente", descripcion: "Nadie en el domicilio", createdAt: hr(-1) },
      ],
    },
    {
      p: { nombreCliente: "Ignacio Contreras", clienteTelefono: "+56922334455", direccion: "Av. Departamental 1500, La Florida",
           lat: -33.5242, lng: -70.5954, producto: "[DEMO] Bicicleta eléctrica", horarioPreferido: "13:00 - 17:00",
           estado: "fallido", scoreRiesgo: 0.91, repartidorId: r2, intentosEntrega: 2,
           motivoFallo: "direccion_erronea", fechaEntregaLimite: hr(-2), despachadoEn: hr(-5), createdAt: hr(-6) },
      ev: [
        { tipo: "creado",     estadoNuevo: "pendiente", createdAt: hr(-6) },
        { tipo: "despachado", estadoAnterior: "pendiente", estadoNuevo: "en_ruta", createdAt: hr(-5) },
        { tipo: "reintento",  descripcion: "Segundo intento de entrega", createdAt: hr(-3), metadata: { intento: 2 } },
        { tipo: "fallido",    estadoAnterior: "en_ruta", estadoNuevo: "fallido", motivo: "direccion_erronea", descripcion: "Edificio inexistente", createdAt: hr(-2) },
      ],
    },

    // ─── CANCELADO (1) → terminal, no admite más cambios (core 409) ────────
    {
      p: { nombreCliente: "Patricia Núñez", clienteTelefono: "+56933445500", direccion: "Av. Grecia 4500, Peñalolén",
           lat: -33.4690, lng: -70.5560, producto: "[DEMO] Set de ollas", horarioPreferido: "10:00 - 14:00",
           estado: "cancelado", scoreRiesgo: 0.25, repartidorId: null,
           motivoCancelacion: "cliente_cancelo", canceladoEn: hr(-1), createdAt: hr(-5) },
      ev: [
        { tipo: "creado",    estadoNuevo: "pendiente", createdAt: hr(-5) },
        { tipo: "cancelado", estadoAnterior: "pendiente", estadoNuevo: "cancelado", motivo: "cliente_cancelo", descripcion: "El cliente canceló el pedido", createdAt: hr(-1) },
      ],
    },
  ];

  console.log(`📦 Creando ${pedidos.length} pedidos con timeline...`);
  const creados = [];
  for (const item of pedidos) {
    creados.push(await crearPedido(item.p, item.ev));
  }
  console.log(`✅ ${creados.length} pedidos creados`);

  // ── 6. Alertas ─────────────────────────────────────────────────────────────
  const alertas = [
    { tipo: "riesgo_alto", mensaje: "[DEMO] Diego Fernández (score IA 78%) lleva 90 min de atraso — riesgo de incumplir SLA", leida: false, repartidorId: r1, createdAt: min(-25) },
    { tipo: "retraso",     mensaje: "[DEMO] María Sepúlveda atrasada 40 min — ventana 13:00-15:00 vencida", leida: false, repartidorId: r0, createdAt: min(-15) },
    { tipo: "riesgo_alto", mensaje: "[DEMO] Pedido sin asignar (Andrés Paredes) ya venció su hora límite", leida: false, repartidorId: null, createdAt: min(-10) },
    { tipo: "desvio",      mensaje: "[DEMO] Camila Rojas se desvió 2.3 km de la ruta óptima en La Cisterna", leida: false, repartidorId: r1, createdAt: min(-8) },
    { tipo: "retraso",     mensaje: "[DEMO] Lorena Vidal — entrega fallida (cliente ausente). Re-agendar", leida: true, repartidorId: r1, createdAt: hr(-1) },
    { tipo: "riesgo_alto", mensaje: "[DEMO] Ignacio Contreras — 2º fallo por dirección errónea", leida: true, repartidorId: r2, createdAt: hr(-2) },
  ];
  for (const a of alertas) await prisma.alerta.create({ data: { ...a, empresaId: empresa.id } });
  console.log(`🚨 ${alertas.length} alertas creadas (${alertas.filter((a) => !a.leida).length} activas)`);

  // ── 7. Pings GPS (con velocidad) para el mapa en vivo ──────────────────────
  const pingsJuan = [
    { lat: -33.4560, lng: -70.6122, velocidad: 32 },
    { lat: -33.4580, lng: -70.6100, velocidad: 28 },
    { lat: -33.4600, lng: -70.6080, velocidad: 41 },
  ];
  for (let i = 0; i < pingsJuan.length; i++) {
    await prisma.ubicacion.create({
      data: { ...pingsJuan[i], repartidorId: r0, empresaId: empresa.id, timestamp: min(-(pingsJuan.length - i) * 2) },
    });
  }
  await prisma.ubicacion.create({ data: { lat: -33.5280, lng: -70.6545, velocidad: 47, repartidorId: r1, empresaId: empresa.id, timestamp: min(-3) } });
  console.log(`📍 ${pingsJuan.length + 1} pings GPS creados`);

  // ── 8. Gráfico semanal (ReporteCache) ──────────────────────────────────────
  for (let i = 7; i >= 1; i--) {
    const fecha = new Date(ahora);
    fecha.setDate(fecha.getDate() - i);
    fecha.setHours(0, 0, 0, 0);
    const entregados = Math.floor(Math.random() * 8) + 3;
    const fallidos = Math.floor(Math.random() * 2);
    const total = entregados + fallidos + Math.floor(Math.random() * 3);
    const datos = { entregados, fallidos, total, eficiencia: Math.round((entregados / total) * 100) };
    await prisma.reporteCache.upsert({
      where: { empresaId_fecha: { empresaId: empresa.id, fecha } },
      create: { empresaId: empresa.id, fecha, datos },
      update: { datos },
    });
  }
  console.log("📊 7 días de gráfico semanal generados");

  // ── 9. Resumen ──────────────────────────────────────────────────────────────
  const resumen = await prisma.pedido.groupBy({
    by: ["estado"],
    where: { empresaId: empresa.id, producto: { startsWith: "[DEMO]" } },
    _count: { id: true },
  });
  console.log("\n══════════════════════════════════════");
  console.log("🎉 SEED LOCAL COMPLETADO");
  console.log("══════════════════════════════════════");
  console.log(`Empresa:      ${empresa.nombre}`);
  console.log(`Repartidores: ${repartidores.length}`);
  console.log("Pedidos [DEMO] por estado:");
  resumen.forEach((r) => console.log(`  ${r.estado.padEnd(10)} ${r._count.id}`));
  console.log("SLA esperado en el dashboard:");
  console.log("  Atrasados ahora: 4  (2 en_ruta + 1 pendiente + 2 fallidos vencidos = revisa)");
  console.log("  OTD %: 5 a tiempo / 7 entregados ≈ 71%");
  console.log("  Atraso promedio: ~52 min (60 y 45)");
  console.log("══════════════════════════════════════");
  console.log("👉 Abre http://localhost:3000/dashboard y recarga.\n");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed-local:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
