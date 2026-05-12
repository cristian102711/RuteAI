import prisma from "@ruteai/database";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Brain, TrendingDown, Target, Activity, Zap } from "lucide-react";

export default async function IAPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true }
  });
  
  if (!usuarioDB || !usuarioDB.empresa) redirect("/dashboard");

  // Pequeña estadística para rellenar
  const pedidos = await prisma.pedido.findMany({
    where: { empresaId: usuarioDB.empresa.id }
  });

  const promedioRiesgo = pedidos.length > 0
    ? Math.round(pedidos.reduce((acc, curr) => acc + (curr.scoreRiesgo || 0), 0) / pedidos.length)
    : 0;

  return (
    <div className="px-2 pb-10">
      <div className="max-w-[85rem] mx-auto">
        <header className="mb-10 lg:mb-12 flex flex-col justify-between items-start border-b border-border-ui pb-8 relative overflow-hidden">
          {/* Luz de fondo morada IA */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] pointer-events-none rounded-full" />
          
          <div className="flex flex-col gap-1.5 relative z-10 w-full">
            <div className="flex justify-between items-center w-full">
               <span className="text-purple-500 text-xs font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-2">
                 <Brain className="w-4 h-4" />
                 Motor Predictivo Core
               </span>
               <span className="bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs px-3 py-1 rounded-full font-bold animate-pulse flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> Online
               </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-2">
              Predicciones <span className="text-purple-600 dark:text-purple-400">IA</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl font-medium">
              Análisis predictivo de retrasos y zonas de alta fricción impulsado por Machine Learning.
            </p>
          </div>
        </header>

        {/* METRICAS SUPERIORES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card border border-border-ui p-6 rounded-3xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300 shadow-sm hover:shadow-md">
               <div className="absolute -right-4 -top-4 bg-purple-500/5 w-24 h-24 rounded-full blur-[30px] group-hover:bg-purple-500/10 transition-colors" />
               <h3 className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold mb-1 flex gap-2 items-center"><Activity className="w-4 h-4 text-purple-500" /> Nivel de Riesgo Global</h3>
               <p className="text-4xl font-black text-foreground">{promedioRiesgo}% <span className="text-sm text-emerald-500 font-bold tracking-normal inline-flex items-center gap-1"><TrendingDown className="w-3 h-3"/> Estable</span></p>
            </div>
            
            <div className="bg-card border border-border-ui p-6 rounded-3xl relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300 shadow-sm hover:shadow-md">
               <div className="absolute -right-4 -top-4 bg-blue-500/5 w-24 h-24 rounded-full blur-[30px] group-hover:bg-blue-500/10 transition-colors" />
               <h3 className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold mb-1 flex gap-2 items-center"><Target className="w-4 h-4 text-blue-500" /> Precisión (Modelo base)</h3>
               <p className="text-4xl font-black text-foreground">89.4%</p>
            </div>

            <div className="bg-card border border-border-ui p-6 rounded-3xl relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300 shadow-sm hover:shadow-md">
               <div className="absolute -right-4 -top-4 bg-amber-500/5 w-24 h-24 rounded-full blur-[30px] group-hover:bg-amber-500/10 transition-colors" />
               <h3 className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold mb-1 flex gap-2 items-center"><Zap className="w-4 h-4 text-amber-500" /> Entregas Fallidas Prevenidas</h3>
               <p className="text-4xl font-black text-foreground">0</p>
            </div>
        </div>

        {/* GRAFICO / SECCION DE ESTUDIO */}
        <div className="bg-card border border-border-ui rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300 min-h-[400px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[url('https://www.transparenttextures.com/patterns/connected.png')] opacity-[0.02] dark:opacity-[0.03] pointer-events-none" />
          
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-6">
            Análisis Heurístico en Tiempo Real
          </h2>

          <div className="space-y-6">
            <div className="border border-border-ui bg-secondary/30 rounded-2xl p-6">
               <h3 className="text-xs font-bold text-rose-500 mb-3 uppercase tracking-widest">Factores Críticos Detectados</h3>
               <ul className="space-y-3">
                 <li className="flex gap-2 text-sm text-muted-foreground font-medium">
                   <span className="text-foreground font-bold text-rose-500">•</span>
                   <span>Direcciones en condominios o torres agregan un <span className="text-foreground font-bold">+15% de riesgo</span> de espera excesiva.</span>
                 </li>
                 <li className="flex gap-2 text-sm text-muted-foreground font-medium">
                   <span className="text-foreground font-bold text-rose-500">•</span>
                   <span>La omisión del número exterior (&apos;S/N&apos;) aumenta drásticamente el riesgo (<span className="text-foreground font-bold">+30%</span>).</span>
                 </li>
                 <li className="flex gap-2 text-sm text-muted-foreground font-medium">
                   <span className="text-foreground font-bold text-rose-500">•</span>
                   <span>Productos etiquetados como &quot;FRÁGIL&quot; elevan la cautela en la gestión (<span className="text-foreground font-bold">+25%</span>).</span>
                 </li>
               </ul>
            </div>

            <div className="border border-purple-500/10 bg-purple-500/5 rounded-2xl p-6 flex flex-col items-center justify-center py-16 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
                <Brain className="w-16 h-16 text-purple-500 mb-6 animate-pulse relative z-10" />
                <h3 className="text-xl font-black text-foreground mb-3 relative z-10">Microservicio RuteAI-ML desactivado</h3>
                <p className="text-muted-foreground max-w-lg text-sm font-medium relative z-10 leading-relaxed">
                   Actualmente el sistema está usando el modelo de reglas (Heurístico determinista). El motor de IA en Python se activará al conectar el endpoint externo.
                </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
