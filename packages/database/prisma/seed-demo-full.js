// seed-demo-full.js — Seed COMPLETO para simulación
// Crea repartidores ficticios en la DB (sin Supabase Auth necesario para GPS)
// El simulador /api/dev/simular-gps mueve los pines en el mapa automáticamente.
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();

async function main() {
  // ── 1. Empresa ────────────────────────────────────────────────────────────
  const empresaNombreFiltro = process.env.EMPRESA_NOMBRE;
  const empresaIdFiltro     = process.env.EMPRESA_ID;

  let empresa;
  if (empresaIdFiltro) {
    empresa = await prisma.empresa.findUnique({ where: { id: empresaIdFiltro } });
  } else if (empresaNombreFiltro) {
    empresa = await prisma.empresa.findFirst({ where: { nombre: { contains: empresaNombreFiltro, mode: "insensitive" } } });
  } else {
    empresa = await prisma.empresa.findFirst({ orderBy: { createdAt: "asc" } });
  }

  if (!empresa) { console.error("❌ No hay empresa. Loguéate primero."); process.exit(1); }
  console.log(`✅ Empresa: ${empresa.nombre} (${empresa.id})`);
  const empresaId = empresa.id;
  const ahora = new Date();

  // ── 2. Limpiar datos demo anteriores ─────────────────────────────────────
  await prisma.alerta.deleteMany({ where: { empresaId, mensaje: { startsWith: "[DEMO]" } } });
  await prisma.pedido.deleteMany({ where: { empresaId, producto: { startsWith: "[DEMO]" } } });
  // Eliminar repartidores demo anteriores (identificados por email @demo.ruteai)
  const repsViejos = await prisma.usuario.findMany({ where: { empresaId, email: { contains: "@demo.ruteai" } } });
  if (repsViejos.length > 0) {
    await prisma.ubicacion.deleteMany({ where: { repartidorId: { in: repsViejos.map(r => r.id) } } });
    await prisma.usuario.deleteMany({ where: { empresaId, email: { contains: "@demo.ruteai" } } });
  }
  console.log("🧹 Demo anterior limpiado");

  // ── 3. Crear repartidores ficticios ───────────────────────────────────────
  const suffix = empresaId.slice(0, 8); // Prefijo único por empresa
  const repartidoresData = [
    { id: randomUUID(), nombre: "Carlos Ríos",    email: `carlos-${suffix}@demo.ruteai`,  vehiculo: "Moto Yamaha",   patente: "DEMO-01", telefono: "+56911111111" },
    { id: randomUUID(), nombre: "Mateo Álvarez",  email: `mateo-${suffix}@demo.ruteai`,   vehiculo: "Furgón Ducato", patente: "DEMO-02", telefono: "+56922222222" },
    { id: randomUUID(), nombre: "Lucía Ramírez",  email: `lucia-${suffix}@demo.ruteai`,   vehiculo: "Auto Suzuki",   patente: "DEMO-03", telefono: "+56933333333" },
  ];

  const reps = await Promise.all(
    repartidoresData.map(r =>
      prisma.usuario.create({
        data: { ...r, rol: "repartidor", empresaId },
      })
    )
  );
  const [r0, r1, r2] = reps;
  console.log(`👥 ${reps.length} repartidores de demo creados:`);
  reps.forEach(r => console.log(`   • ${r.nombre} (${r.vehiculo})`));

  // ── 4. Pedidos ────────────────────────────────────────────────────────────
  // fechaEntregaLimite: nueva columna SLA del merge de tu compañero
  const hoy18h = new Date(ahora); hoy18h.setHours(18, 0, 0, 0);
  const hoy20h = new Date(ahora); hoy20h.setHours(20, 0, 0, 0);
  const hoy14h = new Date(ahora); hoy14h.setHours(14, 0, 0, 0);

  const pedidosData = [
    // ENTREGADOS (ayer / anteayer)
    { nombreCliente:"Ana Torres Vega",    clienteTelefono:"+56912345678", direccion:"Av. Providencia 1234, Santiago",    lat:-33.4307, lng:-70.6097, producto:"[DEMO] iPhone 15 Pro",         estado:"entregado", scoreRiesgo:12, repartidorId:r0.id, entregadoEn: new Date(ahora.getTime()-22*3600*1000), despachadoEn: new Date(ahora.getTime()-24*3600*1000), createdAt: new Date(ahora.getTime()-26*3600*1000) },
    { nombreCliente:"Carlos Mendoza",     clienteTelefono:"+56987654321", direccion:"Las Condes 4500, Santiago",         lat:-33.4109, lng:-70.5780, producto:"[DEMO] MacBook Air M3",        estado:"entregado", scoreRiesgo:8,  repartidorId:r1.id, entregadoEn: new Date(ahora.getTime()-20*3600*1000), despachadoEn: new Date(ahora.getTime()-22*3600*1000), createdAt: new Date(ahora.getTime()-2*24*3600*1000) },
    { nombreCliente:"Sofía Ramírez",      clienteTelefono:"+56911223344", direccion:"Av. Ossa 1055, La Reina",           lat:-33.4503, lng:-70.5543, producto:"[DEMO] Zapatillas Nike Air",  estado:"entregado", scoreRiesgo:5,  repartidorId:r0.id, entregadoEn: new Date(ahora.getTime()-18*3600*1000), despachadoEn: new Date(ahora.getTime()-20*3600*1000), createdAt: new Date(ahora.getTime()-22*3600*1000) },
    { nombreCliente:"Pedro Soto",         clienteTelefono:"+56944556677", direccion:"Av. Vitacura 2939, Vitacura",       lat:-33.4015, lng:-70.5879, producto:"[DEMO] Smart TV Samsung 55\"", estado:"entregado", scoreRiesgo:15, repartidorId:r2.id, entregadoEn: new Date(ahora.getTime()-4*3600*1000),  despachadoEn: new Date(ahora.getTime()-6*3600*1000),  createdAt: new Date(ahora.getTime()-8*3600*1000)  },
    // EN RUTA — con SLA activo
    { nombreCliente:"María Sepúlveda",    clienteTelefono:"+56933445566", direccion:"Av. Irarrázaval 2250, Ñuñoa",      lat:-33.4565, lng:-70.6110, producto:"[DEMO] Tablet iPad Air",      estado:"en_ruta",  scoreRiesgo:45, repartidorId:r0.id, despachadoEn: new Date(ahora.getTime()-90*60*1000),  fechaEntregaLimite: hoy18h, horarioPreferido:"16:00-18:00", createdAt: new Date(ahora.getTime()-3*3600*1000)  },
    { nombreCliente:"Diego Fernández",    clienteTelefono:"+56966778899", direccion:"Gran Avenida 9200, La Cisterna",    lat:-33.5288, lng:-70.6540, producto:"[DEMO] Silla gamer RGB",       estado:"en_ruta",  scoreRiesgo:62, repartidorId:r1.id, despachadoEn: new Date(ahora.getTime()-60*60*1000),  fechaEntregaLimite: hoy20h, horarioPreferido:"18:00-20:00", createdAt: new Date(ahora.getTime()-2*3600*1000)  },
    { nombreCliente:"Valentina Cruz",     clienteTelefono:"+56977889900", direccion:"Pedro de Valdivia 1814, Providencia",lat:-33.4340,lng:-70.6120, producto:"[DEMO] Consola PS5",           estado:"en_ruta",  scoreRiesgo:78, repartidorId:r2.id, despachadoEn: new Date(ahora.getTime()-45*60*1000),  fechaEntregaLimite: hoy14h, horarioPreferido:"13:00-15:00", createdAt: new Date(ahora.getTime()-90*60*1000)   },
    // PENDIENTES
    { nombreCliente:"Roberto Gutiérrez",  clienteTelefono:"+56988990011", direccion:"Av. Kennedy 5413, Las Condes",      lat:-33.4071, lng:-70.5686, producto:"[DEMO] Robot Roomba i7+",     estado:"pendiente", scoreRiesgo:32, repartidorId:null, createdAt: new Date(ahora.getTime()-30*60*1000) },
    { nombreCliente:"Gabriela Morales",   clienteTelefono:"+56999001122", direccion:"Av. Los Leones 1070, Providencia",  lat:-33.4234, lng:-70.6222, producto:"[DEMO] Cafetera Nespresso",   estado:"pendiente", scoreRiesgo:18, repartidorId:r0.id, createdAt: new Date(ahora.getTime()-15*60*1000) },
    { nombreCliente:"Andrés Paredes",     clienteTelefono:"+56900112233", direccion:"Av. Colón 4850, Macul",             lat:-33.4807, lng:-70.5977, producto:"[DEMO] Monitor LG 27\"",      estado:"pendiente", scoreRiesgo:55, repartidorId:null, createdAt: new Date(ahora.getTime()-5*60*1000)  },
    // FALLIDOS / CANCELADOS
    { nombreCliente:"Lorena Vidal",       clienteTelefono:"+56911334455", direccion:"Av. Matta 1200, Santiago Centro",   lat:-33.4649, lng:-70.6483, producto:"[DEMO] Batidora Kitchen Aid",  estado:"fallido",  scoreRiesgo:85, repartidorId:r1.id, motivoFallo:"Nadie en domicilio al 2do intento", intentosEntrega:2, createdAt: new Date(ahora.getTime()-5*3600*1000)  },
    { nombreCliente:"Ignacio Contreras",  clienteTelefono:"+56922334455", direccion:"Av. Departamental 1500, La Florida",lat:-33.5242, lng:-70.5954, producto:"[DEMO] Bicicleta eléctrica",  estado:"cancelado", scoreRiesgo:91, repartidorId:r2.id, motivoCancelacion:"Cliente solicitó anulación", canceladoEn: new Date(ahora.getTime()-2*3600*1000), createdAt: new Date(ahora.getTime()-8*3600*1000)  },
  ];

  console.log(`📦 Creando ${pedidosData.length} pedidos...`);
  const pedidos = [];
  for (const p of pedidosData) {
    const pedido = await prisma.pedido.create({ data: { ...p, empresaId } });
    pedidos.push(pedido);
  }
  console.log(`✅ ${pedidos.length} pedidos creados`);

  // ── 5. Pings GPS iniciales (para que el simulador tenga desde dónde mover) ──
  const posicionesIniciales = [
    { repartidorId: r0.id, lat: -33.4420, lng: -70.6200 }, // Ñuñoa (camino a María S.)
    { repartidorId: r1.id, lat: -33.4900, lng: -70.6400 }, // Camino a La Cisterna
    { repartidorId: r2.id, lat: -33.4280, lng: -70.6180 }, // Providencia (camino a Valentina)
  ];
  for (const [i, pos] of posicionesIniciales.entries()) {
    // 3 pings por repartidor en los últimos 6 minutos
    for (let t = 2; t >= 0; t--) {
      await prisma.ubicacion.create({
        data: {
          ...pos,
          lat: pos.lat + (Math.random() - 0.5) * 0.002,
          lng: pos.lng + (Math.random() - 0.5) * 0.002,
          repartidorId: pos.repartidorId,
          empresaId,
          timestamp: new Date(ahora.getTime() - t * 2 * 60 * 1000),
        },
      });
    }
  }
  console.log("📍 9 pings GPS iniciales creados (3 repartidores × 3 pings)");

  // ── 6. Alertas ────────────────────────────────────────────────────────────
  const pedidoPS5   = pedidos.find(p => p.producto.includes("PS5"));
  const pedidoFallo = pedidos.find(p => p.estado === "fallido");

  const alertas = [
    { tipo:"riesgo_alto", mensaje:`[DEMO] Valentina Cruz — score IA 78% — alta probabilidad de fallo. SLA vencido hace 12 min`,        leida:false, repartidorId:r2.id, pedidoId:pedidoPS5?.id,   createdAt: new Date(ahora.getTime()-15*60*1000) },
    { tipo:"retraso",     mensaje:`[DEMO] Diego Fernández lleva 60 min en ruta — ventana 18:00-20:00 está por vencer`,                  leida:false, repartidorId:r1.id, pedidoId:null,             createdAt: new Date(ahora.getTime()-10*60*1000) },
    { tipo:"desvio",      mensaje:`[DEMO] Carlos Ríos se desvió 2.1 km de la ruta óptima — tráfico en Av. Irarrázaval`,                  leida:false, repartidorId:r0.id, pedidoId:null,             createdAt: new Date(ahora.getTime()-5*60*1000)  },
    { tipo:"riesgo_alto", mensaje:`[DEMO] Andrés Paredes en zona de riesgo alto — 3 fallos previos en sector Macul`,                    leida:false, repartidorId:null,   pedidoId:null,             createdAt: new Date(ahora.getTime()-3*60*1000)  },
    { tipo:"retraso",     mensaje:`[DEMO] Lorena Vidal — 2 intentos fallidos. Pedido marcado como fallido. SLA vencido`,               leida:false, repartidorId:r1.id, pedidoId:pedidoFallo?.id,  createdAt: new Date(ahora.getTime()-2*3600*1000) },
    { tipo:"desvio",      mensaje:`[DEMO] Tráfico crítico en Ruta 5 Sur — alternativa por Autopista Central recomendada [RESUELTA]`,   leida:true,  repartidorId:r0.id, pedidoId:null,             createdAt: new Date(ahora.getTime()-4*3600*1000) },
    { tipo:"riesgo_alto", mensaje:`[DEMO] Ignacio Contreras canceló pedido — dirección incorrecta reportada [RESUELTA]`,               leida:true,  repartidorId:r2.id, pedidoId:null,             createdAt: new Date(ahora.getTime()-6*3600*1000) },
  ];

  for (const a of alertas) {
    await prisma.alerta.create({ data: { ...a, empresaId } });
  }
  console.log(`🚨 ${alertas.length} alertas creadas (${alertas.filter(a=>!a.leida).length} activas)`);

  // ── 7. Gráfico semanal ────────────────────────────────────────────────────
  for (let i = 7; i >= 1; i--) {
    const fecha = new Date(ahora);
    fecha.setDate(fecha.getDate() - i);
    fecha.setHours(0, 0, 0, 0);
    const entregados = Math.floor(Math.random() * 8) + 4;
    const fallidos   = Math.floor(Math.random() * 2);
    const total      = entregados + fallidos + Math.floor(Math.random() * 3) + 1;
    await prisma.reporteCache.upsert({
      where: { empresaId_fecha: { empresaId, fecha } },
      create: { empresaId, fecha, datos: { entregados, fallidos, total, eficiencia: Math.round(entregados/total*100) } },
      update: { datos: { entregados, fallidos, total, eficiencia: Math.round(entregados/total*100) } },
    });
  }
  console.log("📊 7 días de datos para el gráfico semanal");

  // ── 8. Resumen ─────────────────────────────────────────────────────────────
  const resumen = await prisma.pedido.groupBy({ by:["estado"], where:{ empresaId }, _count:{ id:true } });
  const noLeidas = await prisma.alerta.count({ where:{ empresaId, leida:false } });

  console.log("\n══════════════════════════════════════════════════════");
  console.log("🎉  SEED COMPLETO — LISTO PARA SIMULACIÓN");
  console.log("══════════════════════════════════════════════════════");
  console.log(`Empresa : ${empresa.nombre}`);
  console.log(`Repartidores: ${reps.map(r=>r.nombre).join(", ")}`);
  console.log("Pedidos :");
  resumen.forEach(r => console.log(`  ${r.estado.padEnd(12)}: ${r._count.id}`));
  console.log(`Alertas : ${alertas.length} total, ${noLeidas} activas`);
  console.log("──────────────────────────────────────────────────────");
  console.log("PRÓXIMOS PASOS:");
  console.log("1. Abre el dashboard: https://ruteai.vercel.app/dashboard");
  console.log("2. Ve a Rutas → el mapa muestra los 3 repartidores en movimiento");
  console.log("3. Llama el simulador GPS desde la consola del browser:");
  console.log("   fetch('/api/dev/simular-gps',{method:'POST'}).then(r=>r.json()).then(console.log)");
  console.log("4. Cada llamada mueve los pines ~150m hacia sus pedidos");
  console.log("══════════════════════════════════════════════════════");
}

main()
  .catch(e => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
