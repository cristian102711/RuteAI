import { Settings, Shield, User, BellRing } from "lucide-react";

export default function ConfiguracionPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Cabecera */}
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-emerald-500" />
          Configuración
        </h1>
        <p className="text-zinc-400 mt-2">
          Gestiona las preferencias de tu cuenta, seguridad y ajustes generales del sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Panel Cuenta */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Perfil de Empresa</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nombre de la Empresa</label>
              <input 
                type="text" 
                defaultValue="Mi Empresa Logística"
                className="w-full mt-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Correo de Contacto</label>
              <input 
                type="email" 
                defaultValue="contacto@empresa.com"
                className="w-full mt-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition" 
              />
            </div>
          </div>
        </div>

        {/* Panel Preferencias */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Preferencias del Sistema</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2"><BellRing className="w-4 h-4 text-zinc-400"/> Alertas por Correo</p>
                <p className="text-xs text-zinc-500 mt-0.5">Recibir notificaciones de retrasos.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Rutas Inteligentes IA</p>
                <p className="text-xs text-zinc-500 mt-0.5">La IA sugiere despachos automáticamente.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>

      </div>

      <div className="flex justify-end pt-4">
        <button className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-8 rounded-xl transition shadow-[0_0_20px_rgba(52,211,153,0.25)] hover:-translate-y-0.5">
          Guardar Cambios
        </button>
      </div>

    </div>
  );
}
