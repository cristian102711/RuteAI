"use client";

import { useState } from "react";
import { Settings, Shield, User, BellRing, MessageSquare, Smartphone, Check, Send, Sparkles } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { toast } from "sonner";

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<"general" | "twilio">("twilio");
  
  // Estado para el simulador de Twilio
  const [canal, setCanal] = useState<"whatsapp" | "sms">("whatsapp");
  const [plantilla, setPlantilla] = useState<"standard" | "premium" | "urgente">("premium");
  
  const [cliente, setCliente] = useState("Cristian");
  const [direccion, setDireccion] = useState("Av. Vitacura 1230, Santiago");
  const [producto, setProducto] = useState("Notebook Gamer Pro");
  const [eta, setEta] = useState("25");

  // Plantillas calculadas
  const obtenerMensaje = () => {
    const trackingUrl = "https://ruteai.vercel.app/tracking/demo-123";
    if (plantilla === "standard") {
      return `¡Hola ${cliente}! 🚚\nTu pedido de (${producto}) está en camino a ${direccion}.\nSigue tu entrega en tiempo real aquí:\n${trackingUrl}`;
    }
    if (plantilla === "premium") {
      return `¡Buenas noticias, ${cliente}! 🎉\nTu repartidor va en camino con tu ${producto}. Estimamos la llegada en aproximadamente ${eta} minutos a tu dirección en ${direccion}.\nMonitorea la ruta en vivo aquí:\n${trackingUrl}`;
    }
    return `⚠️ ¡Envío Prioritario! Hola ${cliente}, tu pedido de (${producto}) ya está en ruta express hacia ${direccion}.\nPor favor, asegúrate de estar disponible para recibirlo. Sigue el mapa en vivo:\n${trackingUrl}`;
  };

  const simularNotificacion = () => {
    toast.success(`Notificación simulación de ${canal.toUpperCase()} enviada a +569XXXXXX`, {
      description: "Mensaje procesado por las pasarelas simuladas de RuteAI.",
      duration: 5000,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Cabecera */}
      <div className="border-b border-zinc-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <Settings className="w-8 h-8 text-blue-500" />
            Configuración
          </h1>
          <p className="text-zinc-400 mt-1 font-medium text-sm">
            Gestiona las preferencias generales, seguridad y el simulador de comunicaciones Twilio.
          </p>
        </div>

        {/* Tabs Switcher */}
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("twilio")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "twilio"
                ? "bg-blue-500 text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Comunicaciones & Twilio
          </button>
          <button
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "general"
                ? "bg-blue-500 text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <User className="w-4 h-4" />
            Ajustes de Cuenta
          </button>
        </div>
      </div>

      {activeTab === "general" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Panel Cuenta */}
          <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <User className="w-6 h-6 text-blue-500" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Perfil de Empresa</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Nombre de la Empresa</label>
                <input 
                  type="text" 
                  defaultValue="Mi Empresa Logística"
                  className="w-full mt-2 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Correo de Contacto</label>
                <input 
                  type="email" 
                  defaultValue="contacto@empresa.com"
                  className="w-full mt-2 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
            </div>
          </div>

          {/* Panel Preferencias */}
          <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Preferencias</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-zinc-400"/> Alertas por Correo
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 font-medium">Recibir notificaciones de retrasos.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-zinc-800 border border-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Rutas Inteligentes IA</p>
                  <p className="text-xs text-zinc-500 mt-1 font-medium">Sugerencia de despachos automática.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-zinc-800 border border-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>

              <div className="pt-6 border-t border-zinc-800">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-4">Apariencia</label>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Tema Visual</p>
                    <p className="text-xs text-zinc-500 mt-1 font-medium">Cambia entre luz y oscuridad.</p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CONFIGURACIÓN TWILIO */}
          <div className="lg:col-span-7 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white">Diseñador de Plantillas</h2>
                  <p className="text-xs text-zinc-500 font-medium">Personaliza el mensaje SMS/WhatsApp saliente</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/25 animate-pulse">
                <Sparkles className="w-3 h-3" /> Twilio Activo
              </span>
            </div>

            {/* Selector de Canal */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block ml-1">Canal de Envío</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCanal("whatsapp")}
                  className={`py-3 px-4 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2 ${
                    canal === "whatsapp"
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-inner"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <span className="text-base">💬</span> WhatsApp Delivery
                </button>
                <button
                  onClick={() => setCanal("sms")}
                  className={`py-3 px-4 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2 ${
                    canal === "sms"
                      ? "bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-inner"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <span className="text-base">📱</span> Mensaje de Texto (SMS)
                </button>
              </div>
            </div>

            {/* Selector de Plantilla */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block ml-1">Estilo de Plantilla</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "standard", label: "Estándar" },
                  { key: "premium", label: "Premium (Con ETA)" },
                  { key: "urgente", label: "Prioritario" }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setPlantilla(item.key as any)}
                    className={`py-2.5 px-3 rounded-lg font-bold text-[11px] border transition-all ${
                      plantilla === item.key
                        ? "bg-blue-500 text-zinc-950 border-blue-400"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs de Prueba para Personalización */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Cliente de Prueba</label>
                <input 
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className="w-full mt-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Producto a Entregar</label>
                <input 
                  type="text"
                  value={producto}
                  onChange={(e) => setProducto(e.target.value)}
                  className="w-full mt-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Dirección de Destino</label>
                <input 
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full mt-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-all"
                />
              </div>
              {plantilla === "premium" && (
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Tiempo Estimado de Llegada (Minutos)</label>
                  <input 
                    type="number"
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    className="w-full mt-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Acción de Simular Notificación */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-4">
              <p className="text-[11px] text-zinc-500 font-medium leading-relaxed max-w-[65%]">
                Los cambios aplicados aquí afectarán directamente a los mensajes automáticos enviados vía API en el flujo de despacho.
              </p>
              <button
                onClick={simularNotificacion}
                className="bg-blue-500 hover:bg-blue-400 text-zinc-950 font-black text-xs py-3.5 px-6 rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-500/10 active:scale-95 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                Probar Plantilla
              </button>
            </div>

          </div>

          {/* SMARTPHONE INTERACTIVO EN VIVO */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-[300px] sm:w-[320px] aspect-[9/18.5] bg-zinc-900 border-[8px] border-zinc-800 rounded-[3rem] shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden ring-4 ring-zinc-900/30">
              
              {/* Celular Speaker/Camera Notch */}
              <div className="absolute top-0 inset-x-0 h-6 bg-zinc-800 flex items-center justify-center z-30">
                <div className="w-16 h-3 bg-zinc-950 rounded-full" />
              </div>

              {/* Contenido Celular */}
              <div className="flex-1 flex flex-col pt-6 bg-zinc-950">
                
                {/* Header de la Aplicación del Celular */}
                {canal === "whatsapp" ? (
                  <div className="bg-[#0b141a] border-b border-zinc-800 px-4 py-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#128c7e] text-white font-black text-[10px] flex items-center justify-center shadow">
                      RA
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-zinc-200">RuteAI Logística</p>
                      <p className="text-[8px] text-emerald-400 font-medium">en línea</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center gap-2 justify-center">
                    <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 font-bold text-[10px] flex items-center justify-center">
                      +56
                    </div>
                  </div>
                )}

                {/* Área de Mensaje */}
                <div className="flex-1 p-3 overflow-y-auto space-y-4 bg-zinc-950 relative flex flex-col justify-end">
                  <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />

                  {/* Burbuja de Mensaje Recibido */}
                  <div className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-md leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300 relative ${
                    canal === "whatsapp"
                      ? "bg-[#0b2027] text-zinc-100 border border-emerald-950 self-start rounded-tl-none"
                      : "bg-zinc-800 text-zinc-100 self-start rounded-tl-none"
                  }`}>
                    {/* Contenido del Mensaje con saltos de línea */}
                    <p className="whitespace-pre-line text-[11px]">{obtenerMensaje()}</p>
                    
                    {/* Link Interactivo Demo */}
                    <div className="mt-2.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-[9px]">
                      <span className="text-blue-400 font-bold underline cursor-pointer hover:text-blue-300">
                        ruteai.vercel.app/tracking/...
                      </span>
                      <div className="flex items-center gap-0.5 text-zinc-500 font-mono">
                        <span>22:25</span>
                        {canal === "whatsapp" && (
                          <div className="flex text-blue-400">
                            <Check className="w-2.5 h-2.5" />
                            <Check className="w-2.5 h-2.5 -ml-1.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Input de Mensaje Celular (Decorativo) */}
                <div className="bg-[#0b141a] p-2 border-t border-zinc-800/60 flex items-center gap-2">
                  <div className="flex-1 bg-zinc-900 rounded-full px-3 py-1.5 text-[9px] text-zinc-600 border border-zinc-800">
                    Escribe un mensaje...
                  </div>
                  <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-zinc-950 text-xs">
                    🎤
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      )}

      {/* FOOTER ACCIÓN GLOBAL */}
      <div className="flex justify-end pt-4">
        <button 
          onClick={() => {
            toast.success("Ajustes generales guardados correctamente.");
          }}
          className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 text-white font-extrabold py-3.5 px-8 rounded-xl transition active:scale-95 text-xs tracking-wide"
        >
          Guardar Preferencias
        </button>
      </div>

    </div>
  );
}
