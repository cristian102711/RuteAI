// app/dashboard/alertas/page.tsx
import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { AlertTriangle, Clock, MapPin, TrendingUp } from "lucide-react";
import { AlertasLista } from "./AlertasLista";
import type { Alerta } from "@ruteai/database";
import { PageWrapper, AnimatedHeader, AnimatedGrid, AnimatedCard, AnimatedSection } from "@/components/motion/PageWrapper";

type AlertaConRepartidor = Alerta & {
  repartidor: { id: string; nombre: string } | null;
};

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icono: typeof AlertTriangle }> = {
  desvio: {
    label: "Desvío de Ruta",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icono: MapPin,
  },
  retraso: {
    label: "Retraso",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icono: Clock,
  },
  riesgo_alto: {
    label: "Riesgo Alto (IA)",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    icono: TrendingUp,
  },
};

export default async function AlertasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true },
  });

  if (!usuarioDB || !usuarioDB.empresa) redirect("/dashboard");

  const alertas = await prisma.alerta.findMany({
    where: { empresaId: usuarioDB.empresa.id },
    include: { repartidor: { select: { id: true, nombre: true } } },
    orderBy: [{ leida: "asc" }, { createdAt: "desc" }],
    take: 100,
  }) as AlertaConRepartidor[];

  const noLeidas = alertas.filter((a) => !a.leida).length;
  const porTipo = {
    desvio: alertas.filter((a) => a.tipo === "desvio").length,
    retraso: alertas.filter((a) => a.tipo === "retraso").length,
    riesgo_alto: alertas.filter((a) => a.tipo === "riesgo_alto").length,
  };

  return (
    <PageWrapper className="px-2 pb-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <AnimatedHeader className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800 pb-8 pt-2">
          <div>
            <span className="text-amber-500 text-xs font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Sistema de Monitoreo
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              Centro de <span className="text-amber-500">Alertas</span>
            </h1>
            <p className="text-zinc-400 text-sm font-medium">
              {noLeidas > 0
                ? `${noLeidas} alerta${noLeidas > 1 ? "s" : ""} sin leer`
                : "Todas las alertas están al día"}
            </p>
          </div>

          {noLeidas > 0 && (
            <div className="mt-4 md:mt-0 flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold px-4 py-2.5 rounded-2xl animate-pulse shadow-sm">
              <span className="w-2 h-2 bg-rose-500 rounded-full" />
              {noLeidas} sin leer
            </div>
          )}
        </AnimatedHeader>

        {/* Tarjetas resumen — con hover lift */}
        <AnimatedGrid className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["desvio", "retraso", "riesgo_alto"] as const).map((tipo) => {
            const cfg = TIPO_CONFIG[tipo];
            const Icono = cfg.icono;
            const colorMap: Record<string, string> = {
              "text-amber-400": "text-amber-500",
              "text-blue-400": "text-blue-500",
              "text-rose-400": "text-rose-500",
            };
            const semanticColor = colorMap[cfg.color] || cfg.color;
            const semanticBg = semanticColor.replace("text-", "bg-") + "/10";
            const semanticBorder = semanticColor.replace("text-", "border-") + "/20";

            return (
              <AnimatedCard
                key={tipo}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex items-center gap-4 shadow-sm cursor-default"
              >
                <div className={`w-12 h-12 rounded-2xl ${semanticBg} border ${semanticBorder} flex items-center justify-center shrink-0`}>
                  <Icono className={`w-6 h-6 ${semanticColor}`} />
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-0.5">{cfg.label}</p>
                  <p className={`text-2xl font-black ${semanticColor}`}>{porTipo[tipo]}</p>
                </div>
              </AnimatedCard>
            );
          })}
        </AnimatedGrid>

        {/* Lista de alertas con Realtime */}
        <AnimatedSection delay={0.15}>
          <AlertasLista
            alertasIniciales={alertas}
            empresaId={usuarioDB.empresa.id}
            tipoConfig={TIPO_CONFIG}
          />
        </AnimatedSection>

      </div>
    </PageWrapper>
  );
}
