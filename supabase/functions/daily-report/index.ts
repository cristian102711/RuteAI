// ============================================================
// Supabase Edge Function: daily-report
// RF-10 — CRON de reportes diarios
//
// Trigger: Cada día a las 00:05 UTC (configurar en Supabase Dashboard)
// SELECT cron.schedule('daily-report', '5 0 * * *', 'SELECT net.http_post(...)');
//
// Genera métricas del día anterior para TODAS las empresas activas
// y las guarda en ReporteCache con idempotencia por (empresaId, fecha).
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl       = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  // Verificar que la llamada viene de Supabase (seguridad básica)
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${supabaseServiceKey}`) {
    return new Response(
      JSON.stringify({ error: "No autorizado" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fecha de ayer (el reporte siempre es del día anterior completo)
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  const fechaReporte = ayer.toISOString().split("T")[0]; // "YYYY-MM-DD"
  const inicioDia    = `${fechaReporte}T00:00:00.000Z`;
  const finDia       = `${fechaReporte}T23:59:59.999Z`;

  try {
    // 1. Obtener todas las empresas activas
    const { data: empresas, error: empresasError } = await supabase
      .from("Empresa")
      .select("id, nombre")
      .eq("activa", true);

    if (empresasError) throw empresasError;
    if (!empresas || empresas.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No hay empresas activas" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const resultados: string[] = [];

    // 2. Por cada empresa, calcular métricas del día
    for (const empresa of empresas) {
      const { data: pedidos, error: pedidosError } = await supabase
        .from("Pedido")
        .select("id, estado, scoreRiesgo, createdAt")
        .eq("empresaId", empresa.id)
        .gte("createdAt", inicioDia)
        .lte("createdAt", finDia);

      if (pedidosError) {
        console.error(`Error pedidos empresa ${empresa.id}:`, pedidosError);
        continue;
      }

      const total     = pedidos?.length ?? 0;
      const entregados = pedidos?.filter(p => p.estado === "entregado").length ?? 0;
      const fallidos   = pedidos?.filter(p => p.estado === "fallido").length ?? 0;
      const enRuta     = pedidos?.filter(p => p.estado === "en_ruta").length ?? 0;
      const pendientes = pedidos?.filter(p => p.estado === "pendiente").length ?? 0;

      const tasaExito      = total > 0 ? Math.round((entregados / total) * 100) : 0;
      const scorePromedio  = total > 0
        ? parseFloat(
            (pedidos!.reduce((acc, p) => acc + (p.scoreRiesgo ?? 0), 0) / total).toFixed(2)
          )
        : 0;

      const datos = {
        fecha:          fechaReporte,
        empresa:        empresa.nombre,
        total,
        entregados,
        fallidos,
        enRuta,
        pendientes,
        tasaExito,
        scorePromedioRiesgo: scorePromedio,
        generadoEn:     new Date().toISOString(),
      };

      // 3. Upsert idempotente: si ya existe para esta empresa+fecha, actualiza
      const { error: upsertError } = await supabase
        .from("ReporteCache")
        .upsert(
          {
            empresaId: empresa.id,
            fecha:     fechaReporte,
            datos,
          },
          { onConflict: "empresaId,fecha" }
        );

      if (upsertError) {
        console.error(`Error guardando reporte empresa ${empresa.id}:`, upsertError);
      } else {
        resultados.push(`${empresa.nombre}: ${entregados}/${total} entregas (${tasaExito}%)`);
      }
    }

    console.info(`[CRON daily-report] ${fechaReporte} — ${resultados.length} empresas procesadas`);

    return new Response(
      JSON.stringify({
        success:    true,
        fecha:      fechaReporte,
        empresas:   resultados.length,
        resultados,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[CRON daily-report] Error fatal:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
