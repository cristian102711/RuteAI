import prisma from "@/lib/prisma";
import { FormCrearPedido } from "./components/FormCrearPedido";
import { FormCrearRepartidor } from "./components/FormCrearRepartidor";
import { FilaPedido } from "./components/FilaPedido";
import { MapaWrapper } from "./components/MapaWrapper";
import { KPICard } from "./components/KPICard";
import { createClient } from "@/lib/supabaseServer";
import { crearEmpresaYUsuario } from "./actions";
import { Package, CheckCircle2, Users, AlertTriangle, Zap, Users2 } from "lucide-react";

// Este es el Centro de Operaciones. Un Server Component seguro.
export default async function DashboardPage() {
  
  // 1. Obtener al usuario real que inició sesión desde Supabase Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div className="p-10 text-xl font-bold text-red-400 bg-background h-screen">🚨 Error: Sesión no válida.</div>;
  }

  // 2. Buscar en nuestra tabla 'Usuario' de Prisma usando el ID de Supabase
  const usuarioDB = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { empresa: true }
  });
  
  if (!usuarioDB || !usuarioDB.empresa) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-foreground font-sans">
        <div className="max-w-md w-full bg-card/60 backdrop-blur-xl border border-border-ui/80 rounded-3xl p-10 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-emerald-400 to-blue-500" />
          
          {/* Luz de fondo sutil (Glow) */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-[50px] group-hover:bg-primary/20 transition-all duration-700" />

          <h1 className="text-3xl font-extrabold mb-3 tracking-tight text-foreground">¡Bienvenido a <span className="text-primary drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">RouteAI</span>! 🎉</h1>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            Para comenzar a operar, necesitamos el nombre de tu empresa. Todos los datos logísticos estarán protegidos bajo este entorno seguro.
          </p>
          
          <form action={crearEmpresaYUsuario} className="flex flex-col gap-5 relative z-10">
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="userEmail" value={user.email || ""} />
            
            <div className="flex flex-col gap-2">
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Nombre de Flota empresarial
              </label>
              <input 
                name="nombreEmpresa" 
                placeholder="Ej: Awna Logistics SPA" 
                required
                className="w-full bg-background border border-border-ui text-foreground placeholder-muted-foreground rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 shadow-inner transition-all font-medium text-sm"
              />
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] text-white font-extrabold py-4 mt-2 rounded-2xl transition-all duration-300 active:scale-95 tracking-wide">
              Crear Empresa y Entrar al Panel
            </button>
          </form>
          
        </div>
      </div>
    );
  }

  // 3. Multi-Tenant Real
  const empresaActiva = usuarioDB.empresa;
  
  const pedidos = await prisma.pedido.findMany({
    where: { empresaId: empresaActiva.id },
    orderBy: { createdAt: "desc" },
    include: { repartidor: true } // Mantenemos el include del código original
  });

  const repartidores = await prisma.usuario.findMany({
    where: { empresaId: empresaActiva.id, rol: "repartidor" }
  });

  const conductoresTotales = repartidores.length;
  
  // Alertas pendientes simulado si no existe en Prisma aún (o si se agregó, usamos una cuenta dummy)
  const alertasPendientes = pedidos.filter(p => (p.scoreRiesgo ?? 0) > 70 && p.estado === "pendiente").length;
  const onTimePercentage = pedidos.length > 0 ? 94 : 100;

  return (
    <div className="font-sans px-2">
      <div className="max-w-[85rem] mx-auto">
        
        {/* Cabecera del Panel */}
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border-ui/50 pb-6">
          <div className="flex flex-col gap-1">
            <span className="text-primary/80 text-sm font-semibold tracking-widest uppercase mb-1 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
               Operativa Global
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-2">
              Panel de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-200">{empresaActiva.nombre}</span>
            </h1>
            <p className="text-muted-foreground/90 text-sm md:text-base max-w-xl">
              Gestión logística inteligente y predicción de riesgo en vivo por RouteAI.
            </p>
          </div>
        </header>

        {/* KPIs Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
          <KPICard label="Pedidos hoy" value={pedidos.length} hint="+12%" hintTone="success" icon={Package} />
          <KPICard label="A tiempo" value={`${onTimePercentage}%`} hint="ÓPTIMO" hintTone="primary" icon={CheckCircle2} />
          <KPICard label="Conductores" value={conductoresTotales} hint="EN RUTA" hintTone="muted" icon={Users} />
          <KPICard label="Riesgo IA (>70%)" value={String(alertasPendientes).padStart(2, "0")} hint={alertasPendientes > 0 ? "CRIT" : "OK"} hintTone={alertasPendientes > 0 ? "error" : "success"} icon={AlertTriangle} />
        </div>

        {/* Zona Central: Formularios, Mapa y Lista */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
          
          <div className="xl:col-span-1 flex flex-col gap-6">
            <div className="bg-card/40 backdrop-blur-md border border-border-ui/60 rounded-3xl p-7 shadow-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all duration-500 h-fit hover:border-primary/30 group block">
              <h2 className="text-sm font-bold tracking-widest uppercase mb-6 text-primary flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-70 group-hover:opacity-100 transition-opacity"></span>
                Nuevo Despacho
              </h2>
              <FormCrearPedido empresaId={empresaActiva.id} />
            </div>

            <div className="bg-card/40 backdrop-blur-md border border-border-ui/60 rounded-3xl p-7 shadow-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all duration-500 h-fit hover:border-blue-500/30 group block">
              <h2 className="text-sm font-bold tracking-widest uppercase mb-6 text-blue-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-70 group-hover:opacity-100 transition-opacity"></span>
                Equipo de Reparto
              </h2>
              <FormCrearRepartidor empresaId={empresaActiva.id} />
              
              <div className="mt-4 flex flex-col gap-2">
                {repartidores.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No hay repartidores registrados aún.</p>
                ) : (
                  repartidores.map(rep => (
                    <div key={rep.id} className="flex justify-between items-center text-sm p-2 bg-background/50 rounded-xl border border-border-ui/50">
                      <span className="text-foreground font-medium">{rep.nombre}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 flex flex-col gap-8">
            {/* MAPA DE TRACKING (Mantenemos el componente del usuario original pero estilizado) */}
            <div className="bg-card/40 backdrop-blur-md border border-border-ui/60 rounded-3xl shadow-xl w-full p-2 hover:border-primary/30 transition-all duration-500 overflow-hidden">
              <MapaWrapper pedidos={pedidos} />
            </div>

            {/* LISTA DE PEDIDOS */}
            <div className="bg-card/40 backdrop-blur-md border border-border-ui/60 rounded-3xl shadow-xl overflow-hidden flex flex-col hover:border-primary/30 transition-all duration-500">
              <div className="px-8 py-6 border-b border-border-ui/60 flex justify-between items-center bg-background/50">
                <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">
                  Despachos en Curso <span className="bg-primary/20 text-primary px-2.5 py-0.5 rounded-full ml-2 text-xs">{pedidos.length}</span>
                </h2>
              </div>
              
              <div className="overflow-y-auto max-h-[480px] p-6 lg:p-8 flex flex-col gap-4 bg-background/20">
                {pedidos.length === 0 ? (
                  <div className="text-center flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-20 h-20 mb-4 rounded-full bg-secondary/50 flex items-center justify-center border border-border-ui/50">
                       <span className="text-3xl">📦</span>
                    </div>
                    <h3 className="text-foreground font-semibold text-lg mb-1">Cero despachos activos</h3>
                    <p className="text-muted-foreground text-sm max-w-sm">Tu bandeja de despachos de hoy está vacía. Crea el primer pedido para iniciar la ruta.</p>
                  </div>
                ) : (
                  pedidos.map((pedido) => (
                     <FilaPedido key={pedido.id} pedido={pedido} repartidores={repartidores} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
