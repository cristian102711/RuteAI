import { Settings, Shield, User, BellRing } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";

export default function ConfiguracionPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Cabecera */}
      <div className="border-b border-border-ui pb-8">
        <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          Configuración
        </h1>
        <p className="text-muted-foreground mt-2 font-medium">
          Gestiona las preferencias de tu cuenta, seguridad y ajustes generales del sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Panel Cuenta */}
        <div className="bg-card border border-border-ui rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <User className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-xl font-black text-foreground tracking-tight">Perfil de Empresa</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] ml-1">Nombre de la Empresa</label>
              <input 
                type="text" 
                defaultValue="Mi Empresa Logística"
                className="w-full mt-2 bg-secondary/50 border border-border-ui rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all shadow-sm" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] ml-1">Correo de Contacto</label>
              <input 
                type="email" 
                defaultValue="contacto@empresa.com"
                className="w-full mt-2 bg-secondary/50 border border-border-ui rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all shadow-sm" 
              />
            </div>
          </div>
        </div>

        {/* Panel Preferencias */}
        <div className="bg-card border border-border-ui rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-black text-foreground tracking-tight">Preferencias</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-muted-foreground"/> Alertas por Correo
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Recibir notificaciones de retrasos.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-secondary border border-border-ui peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">Rutas Inteligentes IA</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Sugerencia de despachos automática.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-secondary border border-border-ui peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="pt-6 border-t border-border-ui">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] block mb-4">Apariencia</label>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">Tema Visual</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Cambia entre luz y oscuridad.</p>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="flex justify-end pt-8">
        <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 px-10 rounded-2xl transition shadow-lg hover:shadow-primary/20 active:scale-95 tracking-wide">
          Guardar Cambios
        </button>
      </div>

    </div>
  );
}
