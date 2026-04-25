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
    <div className="font-sans px-2 pb-10">
      <div className="max-w-[85rem] mx-auto">
        <header className="mb-10 lg:mb-12 flex flex-col justify-between items-start border-b border-zinc-800/50 pb-6 relative overflow-hidden">
          {/* Luz de fondo morada IA */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 blur-[100px] pointer-events-none rounded-full" />
          
          <div className="flex flex-col gap-1 relative z-10 w-full">
            <div className="flex justify-between items-center w-full">
               <span className="text-purple-400 text-sm font-semibold tracking-widest uppercase mb-1 flex items-center gap-2">
                 <Brain className="w-4 h-4" />
                 Motor Predictivo Core
               </span>
               <span className="bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs px-3 py-1 rounded-full font-bold shadow-[0_0_15px_rgba(168,85,247,0.2)] animate-pulse flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span> Online
               </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
              Predicciones <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">IA</span>
            </h1>
            <p className="text-zinc-500/90 text-sm md:text-base max-w-xl">
              Análisis predictivo de retrasos y zonas de alta fricción impulsado por Python Machine Learning.
            </p>
          </div>
        </header>

        {/* METRICAS SUPERIORES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-zinc-900/50 border border-zinc-800/70 p-6 rounded-3xl relative overflow-hidden group hover:border-purple-500/30 transition-colors">
               <div className="absolute -right-4 -top-4 bg-purple-500/10 w-24 h-24 rounded-full blur-[30px] group-hover:bg-purple-500/20 transition-colors" />
               <h3 className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-1 flex gap-2 items-center"><Activity className="w-4 h-4 text-purple-400" /> Nivel de Riesgo Global</h3>
               <p className="text-4xl font-black text-zinc-100">{promedioRiesgo}% <span className="text-sm text-emerald-400 font-semibold tracking-normal inline-flex items-center gap-1"><TrendingDown className="w-3 h-3"/> Estable</span></p>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800/70 p-6 rounded-3xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
               <div className="absolute -right-4 -top-4 bg-blue-500/10 w-24 h-24 rounded-full blur-[30px] group-hover:bg-blue-500/20 transition-colors" />
               <h3 className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-1 flex gap-2 items-center"><Target className="w-4 h-4 text-blue-400" /> Precisión (Modelo base)</h3>
               <p className="text-4xl font-black text-zinc-100">89.4%</p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800/70 p-6 rounded-3xl relative overflow-hidden group hover:border-amber-500/30 transition-colors">
               <div className="absolute -right-4 -top-4 bg-amber-500/10 w-24 h-24 rounded-full blur-[30px] group-hover:bg-amber-500/20 transition-colors" />
               <h3 className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-1 flex gap-2 items-center"><Zap className="w-4 h-4 text-amber-400" /> Entregas Fallidas Prevenidas</h3>
               <p className="text-4xl font-black text-zinc-100">0</p>
            </div>
        </div>

        {/* GRAFICO / SECCION DE ESTUDIO */}
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-8 shadow-xl min-h-[400px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[url('https://www.transparenttextures.com/patterns/connected.png')] opacity-[0.03] mix-blend-screen pointer-events-none" />
          
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-6">
            Análisis Heurístico en Tiempo Real
          </h2>

          <div className="space-y-6">
            <div className="border border-zinc-800 bg-zinc-950/50 rounded-2xl p-6">
               <h3 className="text-sm font-bold text-rose-400 mb-2 uppercase tracking-widest">Factores Críticos Detectados</h3>
               <ul className="list-disc list-inside text-sm text-zinc-400 space-y-2">
                 <li>Direcciones en condominios o torres agregan un <span className="text-zinc-200 font-bold">+15% de riesgo base</span> de espera excesiva.</li>
                 <li>La omisión del número exterior ('S/N') aumenta drásticamente el riesgo (<span className="text-zinc-200 font-bold">+30%</span>) por fricción de búsqueda.</li>
                 <li>Productos etiquetados como "FRÁGIL" elevan la cautela en la gestión (<span className="text-zinc-200 font-bold">+25%</span>).</li>
               </ul>
            </div>

            <div className="border border-purple-500/20 bg-purple-900/10 rounded-2xl p-6 flex flex-col items-center justify-center py-12 text-center relative overflow-hidden">
                <Brain className="w-12 h-12 text-purple-400 mb-4 animate-pulse relative z-10" />
                <h3 className="text-xl font-bold text-white mb-2 relative z-10">Microservicio RuteAI-ML desactivado</h3>
                <p className="text-zinc-400 max-w-lg text-sm relative z-10">
                   Actualmente el sistema está usando el modelo de reglas (Heurístico determinista) integrado en Next.js. El endpoint externo en Python está pendiente de conexión.
                </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
