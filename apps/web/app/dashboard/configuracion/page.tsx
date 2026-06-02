"use client";

import { useState } from "react";
import { 
  Building2, User, BellRing, Sparkles, CreditCard, Code, Shield, 
  Settings, ChevronRight, Check, Send, Upload, Trash2, Globe, Sliders
} from "lucide-react";
import { toast } from "sonner";

type TabId = "empresa" | "perfil" | "notificaciones" | "ia" | "facturacion" | "api" | "seguridad";

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<TabId>("empresa");

  // --- ESTADOS DE CONFIGURACIÓN ---
  // Empresa
  const [nombreEmpresa, setNombreEmpresa] = useState("Mercado Andino");
  const [rutEmpresa, setRutEmpresa] = useState("900.482.193-4");
  const [pais, setPais] = useState("Colombia");
  const [zonaHoraria, setZonaHoraria] = useState("America/Bogota (GMT-5)");
  const [direccion, setDireccion] = useState("Cra. 11 #93-46, Bogotá D.C.");
  const [emailSoporte, setEmailSoporte] = useState("ops@mercadoandino.co");

  // Perfil
  const [nombre, setNombre] = useState("Julián");
  const [apellido, setApellido] = useState("Rivera");
  const [email, setEmail] = useState("julian@mercadoandino.co");
  const [telefono, setTelefono] = useState("+57 311 482 9920");

  // Notificaciones & Twilio
  const [notifFallo, setNotifFallo] = useState(true);
  const [notifRiesgo, setNotifRiesgo] = useState(true);
  const [notifDesconexion, setNotifDesconexion] = useState(false);
  const [notifDiario, setNotifDiario] = useState(true);
  const [notifSemanal, setNotifSemanal] = useState(true);
  
  // Twilio Simulador
  const [canal, setCanal] = useState<"whatsapp" | "sms">("whatsapp");
  const [plantilla, setPlantilla] = useState<"standard" | "premium" | "urgente">("premium");
  const [eta, setEta] = useState("25");

  // IA & Optimización
  const [agresividad, setAgresividad] = useState(70);
  const [modeloActivo, setModeloActivo] = useState("gpt-logistics-v2.1");
  const [recalcularTiempo, setRecalcularTiempo] = useState("5 minutos");
  const [prediccionFallo, setPrediccionFallo] = useState(true);
  const [reasignacionAuto, setReasignacionAuto] = useState(false);
  const [validacionDireccion, setValidacionDireccion] = useState(true);

  // API & Webhooks
  const [apiKey, setApiKey] = useState("sk_live_ruteai_5a9b8c7d6e5f4g3h2i1j0");
  const [showApiKey, setShowApiKey] = useState(false);

  // --- MANEJADORES ---
  const handleGuardarCambios = (seccion: string) => {
    toast.success(`Cambios en "${seccion}" guardados con éxito`, {
      description: "La configuración se ha sincronizado correctamente en el servidor.",
    });
  };

  const simularNotificacion = () => {
    toast.success(`Notificación de prueba enviada vía ${canal.toUpperCase()}`, {
      description: `Enviada con éxito a ${telefono}`,
      duration: 4000,
    });
  };

  // Texto simulador dinámico
  const obtenerMensajeSimulado = () => {
    const trackingUrl = "https://ruteai.vercel.app/tracking/demo-123";
    if (plantilla === "standard") {
      return `¡Hola ${nombre}! 🚚\nTu pedido de (Notebook Gamer Pro) está en camino a ${direccion}.\nSigue tu entrega en tiempo real aquí:\n${trackingUrl}`;
    }
    if (plantilla === "premium") {
      return `¡Buenas noticias, ${nombre}! 🎉\nTu repartidor va en camino. Estimamos la llegada en aproximadamente ${eta} minutos a tu dirección en ${direccion}.\nMonitorea la ruta en vivo aquí:\n${trackingUrl}`;
    }
    return `⚠️ ¡Prioritario! Hola ${nombre}, tu pedido ya está en ruta express hacia ${direccion}.\nAsegúrate de estar disponible para recibirlo. Sigue el mapa en vivo:\n${trackingUrl}`;
  };

  // --- MENÚ LATERAL CONFIGURACIÓN ---
  const menuItems = [
    { id: "empresa", label: "Empresa", icon: Building2 },
    { id: "perfil", label: "Perfil", icon: User },
    { id: "notificaciones", label: "Notificaciones", icon: BellRing },
    { id: "ia", label: "IA & Optimización", icon: Sparkles },
    { id: "facturacion", label: "Facturación", icon: CreditCard },
    { id: "api", label: "API & Webhooks", icon: Code },
    { id: "seguridad", label: "Seguridad", icon: Shield },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER AJUSTES DEL WORKSPACE */}
      <div>
        <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">Configuración</p>
        <h1 className="text-3xl font-black text-white mt-1 tracking-tight">Ajustes del workspace</h1>
        <p className="text-zinc-400 text-xs mt-1 font-medium">
          {nombreEmpresa} · Plan Business
        </p>
      </div>

      {/* DISEÑO EN DOS COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: MENÚ DE CONFIGURACIÓN */}
        <aside className="lg:col-span-3 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabId)}
                className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold rounded-2xl transition-all ${
                  isSelected
                    ? "bg-zinc-800 text-amber-500 shadow-md border border-zinc-700/50"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isSelected ? "text-amber-500" : "text-zinc-400"}`} />
                  {item.label}
                </div>
                {isSelected && <ChevronRight className="w-3.5 h-3.5 text-amber-500" />}
              </button>
            );
          })}
        </aside>

        {/* COLUMNA DERECHA: CONTENIDOS DE LAS VISTAS */}
        <main className="lg:col-span-9 space-y-6">

          {/* VISTA 1: EMPRESA */}
          {activeTab === "empresa" && (
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-lg font-extrabold text-white">Información de la empresa</h2>
                <p className="text-xs text-zinc-500 mt-1 font-medium">Datos visibles para tus clientes y reportes.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Nombre Comercial</label>
                  <input
                    type="text"
                    value={nombreEmpresa}
                    onChange={(e) => setNombreEmpresa(e.target.value)}
                    className="w-full mt-2 bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">NIT / RUT</label>
                  <input
                    type="text"
                    value={rutEmpresa}
                    onChange={(e) => setRutEmpresa(e.target.value)}
                    className="w-full mt-2 bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">País</label>
                  <input
                    type="text"
                    value={pais}
                    onChange={(e) => setPais(e.target.value)}
                    className="w-full mt-2 bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Zona Horaria</label>
                  <input
                    type="text"
                    value={zonaHoraria}
                    onChange={(e) => setZonaHoraria(e.target.value)}
                    className="w-full mt-2 bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Dirección Operativa</label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full mt-2 bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email de Soporte</label>
                  <input
                    type="email"
                    value={emailSoporte}
                    onChange={(e) => setEmailSoporte(e.target.value)}
                    className="w-full mt-2 bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/60">
                <button className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition">Cancelar</button>
                <button
                  onClick={() => handleGuardarCambios("Empresa")}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs px-6 py-2.5 rounded-xl transition shadow-lg shadow-amber-500/10 active:scale-95"
                >
                  Guardar cambios
                </button>
              </div>

              {/* Logo y Branding */}
              <div className="pt-6 border-t border-zinc-800/60">
                <h3 className="text-sm font-extrabold text-white">Logo y branding</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Aparece en el PWA del repartidor y en los reportes PDF.</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 flex items-center justify-center border border-zinc-700/50 text-xl font-bold text-white shadow-inner">
                    {nombreEmpresa.charAt(0)}
                  </div>
                  <button className="flex items-center gap-2 border border-zinc-800 hover:bg-zinc-800/50 text-zinc-300 font-bold text-xs px-4 py-2.5 rounded-xl transition">
                    <Upload className="w-3.5 h-3.5" />
                    Subir nuevo logo
                  </button>
                  <p className="text-[10px] text-zinc-600 font-medium">PNG o SVG · máximo 1 MB · fondo transparente.</p>
                </div>
              </div>
            </div>
          )}

          {/* VISTA 2: PERFIL */}
          {activeTab === "perfil" && (
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-lg font-extrabold text-white">Tu perfil</h2>
                <p className="text-xs text-zinc-500 mt-1 font-medium">Información personal y preferencias.</p>
              </div>

              {/* Avatar e info básica */}
              <div className="flex items-center gap-4 border-b border-zinc-800/60 pb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-purple-600 flex items-center justify-center text-lg font-black text-white shadow-lg">
                  {nombre.charAt(0)}{apellido.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{nombre} {apellido}</h3>
                  <p className="text-xs text-zinc-500 font-medium">Administrador · {email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Nombre</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full mt-2 bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Apellido</label>
                  <input
                    type="text"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="w-full mt-2 bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-2 bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Teléfono</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full mt-2 bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block ml-1 mb-2">Idioma</label>
                  <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all">
                    <option>Español (LATAM)</option>
                    <option>English (US)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block ml-1 mb-2">Formato de Fecha</label>
                  <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all">
                    <option>DD / MM / AAAA</option>
                    <option>MM / DD / AAAA</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/60">
                <button className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition">Cancelar</button>
                <button
                  onClick={() => handleGuardarCambios("Perfil")}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs px-6 py-2.5 rounded-xl transition shadow-lg shadow-amber-500/10 active:scale-95"
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          )}

          {/* VISTA 3: NOTIFICACIONES (Con simulador Twilio integrado!) */}
          {activeTab === "notificaciones" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              <div className="xl:col-span-7 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold text-white">Notificaciones</h2>
                  <p className="text-xs text-zinc-500 mt-1 font-medium font-sans">Decide qué eventos quieres recibir y por qué canal.</p>
                </div>

                {/* OPERACIÓN DIARIA */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block ml-1">Operación Diaria</h3>
                  
                  <div className="flex items-center justify-between bg-zinc-950/30 border border-zinc-850 p-4 rounded-2xl">
                    <div>
                      <p className="text-xs font-bold text-white">Pedido fallido</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Recibe alerta cuando un repartidor reporta fallo.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={notifFallo} onChange={() => setNotifFallo(!notifFallo)} />
                      <div className="w-11 h-6 bg-zinc-800 border border-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between bg-zinc-950/30 border border-zinc-850 p-4 rounded-2xl">
                    <div>
                      <p className="text-xs font-bold text-white">Pedido con riesgo IA alto</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Aviso cuando el score supera 70%.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={notifRiesgo} onChange={() => setNotifRiesgo(!notifRiesgo)} />
                      <div className="w-11 h-6 bg-zinc-800 border border-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between bg-zinc-950/30 border border-zinc-850 p-4 rounded-2xl">
                    <div>
                      <p className="text-xs font-bold text-white">Repartidor sin conexión &gt; 15 min</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Detección automática de pérdida de señal.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={notifDesconexion} onChange={() => setNotifDesconexion(!notifDesconexion)} />
                      <div className="w-11 h-6 bg-zinc-800 border border-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>

                {/* REPORTES */}
                <div className="space-y-4 pt-4 border-t border-zinc-800/60">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block ml-1">Reportes</h3>

                  <div className="flex items-center justify-between bg-zinc-950/30 border border-zinc-850 p-4 rounded-2xl">
                    <div>
                      <p className="text-xs font-bold text-white">Resumen diario por email</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Cada día a las 8:00 PM.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={notifDiario} onChange={() => setNotifDiario(!notifDiario)} />
                      <div className="w-11 h-6 bg-zinc-800 border border-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between bg-zinc-950/30 border border-zinc-850 p-4 rounded-2xl">
                    <div>
                      <p className="text-xs font-bold text-white">Reporte semanal</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Lunes a las 9:00 AM.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={notifSemanal} onChange={() => setNotifSemanal(!notifSemanal)} />
                      <div className="w-11 h-6 bg-zinc-800 border border-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>

                {/* TWILIO DESIGNER INTEGRADO */}
                <div className="pt-6 border-t border-zinc-800/60 space-y-4">
                  <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
                    <span>📳</span> Diseñador de SMS/WhatsApp (Twilio Sandbox)
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setCanal("whatsapp")}
                      className={`py-2 px-3 rounded-xl font-bold text-[10px] border transition-all ${
                        canal === "whatsapp"
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                          : "bg-zinc-950 border-zinc-800 text-zinc-500"
                      }`}
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={() => setCanal("sms")}
                      className={`py-2 px-3 rounded-xl font-bold text-[10px] border transition-all ${
                        canal === "sms"
                          ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                          : "bg-zinc-950 border-zinc-800 text-zinc-500"
                      }`}
                    >
                      SMS (Mensaje)
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Plantilla de Notificación</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setPlantilla("standard")}
                        className={`py-2 rounded-lg font-bold text-[10px] border transition-all ${
                          plantilla === "standard" ? "bg-amber-500 text-zinc-950 border-amber-400" : "bg-zinc-950 border-zinc-805 text-zinc-500"
                        }`}
                      >
                        Estándar
                      </button>
                      <button
                        onClick={() => setPlantilla("premium")}
                        className={`py-2 rounded-lg font-bold text-[10px] border transition-all ${
                          plantilla === "premium" ? "bg-amber-500 text-zinc-950 border-amber-400" : "bg-zinc-950 border-zinc-805 text-zinc-500"
                        }`}
                      >
                        Premium
                      </button>
                      <button
                        onClick={() => setPlantilla("urgente")}
                        className={`py-2 rounded-lg font-bold text-[10px] border transition-all ${
                          plantilla === "urgente" ? "bg-amber-500 text-zinc-950 border-amber-400" : "bg-zinc-950 border-zinc-805 text-zinc-500"
                        }`}
                      >
                        Prioritaria
                      </button>
                    </div>
                  </div>

                  {plantilla === "premium" && (
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Minutos ETA estimados</label>
                      <input
                        type="number"
                        value={eta}
                        onChange={(e) => setEta(e.target.value)}
                        className="w-full mt-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                  )}

                  <div className="pt-4 flex items-center justify-between gap-4">
                    <button
                      onClick={simularNotificacion}
                      className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs py-2.5 px-5 rounded-xl transition flex items-center gap-1.5 active:scale-95 shadow"
                    >
                      <Send className="w-3.5 h-3.5" /> Probar Envío
                    </button>
                  </div>
                </div>

              </div>

              {/* Mockup Celular flotando */}
              <div className="xl:col-span-5 flex justify-center">
                <div className="w-[280px] aspect-[9/18] bg-zinc-900 border-[6px] border-zinc-800 rounded-[2.5rem] relative flex flex-col overflow-hidden shadow-2xl">
                  <div className="absolute top-0 inset-x-0 h-5 bg-zinc-800 flex items-center justify-center z-30">
                    <div className="w-12 h-2.5 bg-zinc-950 rounded-full" />
                  </div>
                  <div className="flex-1 flex flex-col pt-5 bg-zinc-950">
                    <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-2 text-[10px] font-bold text-zinc-300 text-center">
                      {canal === "whatsapp" ? "💬 RuteAI Logística" : "📱 +57 311 482 9920"}
                    </div>
                    <div className="flex-1 p-2 flex flex-col justify-end">
                      <div className="bg-zinc-900 rounded-xl p-2.5 text-[10px] text-zinc-200 leading-normal whitespace-pre-line relative">
                        {obtenerMensajeSimulado()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* VISTA 4: IA & OPTIMIZACIÓN */}
          {activeTab === "ia" && (
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-lg font-extrabold text-white">Optimización IA</h2>
                <p className="text-xs text-zinc-500 mt-1 font-medium">Define cómo debe comportarse el motor de optimización.</p>
              </div>

              {/* Slider de Agresividad */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Agresividad de la Optimización</label>
                  <span className="text-sm font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/25">{agresividad}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={agresividad}
                  onChange={(e) => setAgresividad(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer bg-zinc-800 h-1.5 rounded-lg outline-none"
                />
                <p className="text-[10px] text-zinc-500 leading-normal">Mayor agresividad ahorra más combustible pero ajusta más las ETAs prometidas al cliente.</p>
              </div>

              {/* Modelos de IA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-zinc-800/60">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block ml-1 mb-2">Modelo Activo</label>
                  <select
                    value={modeloActivo}
                    onChange={(e) => setModeloActivo(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  >
                    <option value="gpt-logistics-v2.1">gpt-logistics-v2.1 (recomendado)</option>
                    <option value="llama-route-3.0">llama-route-3.0 (baja latencia)</option>
                    <option value="gemini-flash-1.5">gemini-flash-1.5 (análisis masivo)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block ml-1 mb-2">Recalcular Automáticamente Cada</label>
                  <select
                    value={recalcularTiempo}
                    onChange={(e) => setRecalcularTiempo(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  >
                    <option value="5 minutos">5 minutos</option>
                    <option value="15 minutos">15 minutos</option>
                    <option value="30 minutos">30 minutos</option>
                    <option value="Nunca">Nunca</option>
                  </select>
                </div>
              </div>

              {/* Opciones Adicionales */}
              <div className="space-y-4 pt-6 border-t border-zinc-800/60">
                <div className="flex items-center justify-between bg-zinc-950/30 border border-zinc-850 p-4 rounded-2xl">
                  <div>
                    <p className="text-xs font-bold text-white">Predicción de riesgo de fallo</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-sans">Usa historial del cliente y meteorología.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={prediccionFallo} onChange={() => setPrediccionFallo(!prediccionFallo)} />
                    <div className="w-11 h-6 bg-zinc-800 border border-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between bg-zinc-950/30 border border-zinc-850 p-4 rounded-2xl">
                  <div>
                    <p className="text-xs font-bold text-white">Reasignación automática</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-sans">Permite mover paradas entre repartidores sin confirmar.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={reasignacionAuto} onChange={() => setReasignacionAuto(!reasignacionAuto)} />
                    <div className="w-11 h-6 bg-zinc-800 border border-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between bg-zinc-950/30 border border-zinc-850 p-4 rounded-2xl">
                  <div>
                    <p className="text-xs font-bold text-white">Validación de dirección con IA</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-sans">Detecta direcciones malformadas antes de asignar.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={validacionDireccion} onChange={() => setValidacionDireccion(!validacionDireccion)} />
                    <div className="w-11 h-6 bg-zinc-800 border border-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/60">
                <button className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition">Cancelar</button>
                <button
                  onClick={() => handleGuardarCambios("IA & Optimización")}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs px-6 py-2.5 rounded-xl transition shadow-lg shadow-amber-500/10 active:scale-95"
                >
                  Guardar cambios
                </button>
              </div>

            </div>
          )}

          {/* VISTA 5: FACTURACIÓN */}
          {activeTab === "facturacion" && (
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-lg font-extrabold text-white">Plan actual</h2>
                <p className="text-xs text-zinc-500 mt-1 font-medium">Estás en Business con renovación mensual.</p>
              </div>

              {/* Box de Plan */}
              <div className="bg-zinc-950/60 border border-zinc-850 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-white">Business</span>
                    <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">Activo</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1 font-medium">Próxima factura: 14 abril 2025</p>
                </div>
                <div className="flex items-baseline gap-1 text-right">
                  <span className="text-2xl font-black text-white">$899</span>
                  <span className="text-[10px] text-zinc-500 font-medium">/mes</span>
                </div>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Entregas / Mes</p>
                  <p className="text-base font-black text-white mt-1">18.420 / <span className="text-zinc-600 font-normal text-xs">∞</span></p>
                </div>
                <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Repartidores</p>
                  <p className="text-base font-black text-white mt-1">12 / <span className="text-zinc-600 font-normal text-xs">∞</span></p>
                </div>
                <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Llamadas API</p>
                  <p className="text-base font-black text-white mt-1">84.210 / <span className="text-zinc-500 text-xs font-semibold">500.000</span></p>
                </div>
              </div>

              {/* Método de pago */}
              <div className="pt-6 border-t border-zinc-800/60 space-y-4">
                <h3 className="text-sm font-extrabold text-white">Método de pago</h3>
                <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💳</span>
                    <div>
                      <p className="text-xs font-bold text-white">VISA •••• •••• •••• 4242</p>
                      <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Vence 12/27</p>
                    </div>
                  </div>
                  <button className="text-amber-500 hover:text-amber-400 font-bold text-xs">Actualizar</button>
                </div>
              </div>

              {/* Historial de Facturas */}
              <div className="pt-6 border-t border-zinc-800/60 space-y-4">
                <h3 className="text-sm font-extrabold text-white">Historial de facturas</h3>
                <div className="space-y-1">
                  {[
                    { fecha: "Marzo 2025", monto: "$899.00" },
                    { fecha: "Febrero 2025", monto: "$899.00" },
                    { fecha: "Enero 2025", monto: "$899.00" },
                    { fecha: "Diciembre 2024", monto: "$499.00" }
                  ].map((inv, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-zinc-800/30 text-xs">
                      <span className="font-semibold text-zinc-300">{inv.fecha}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-white">{inv.monto}</span>
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Pagada</span>
                        <button className="text-zinc-500 hover:text-white font-bold text-[10px]">Descargar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VISTA 6: API & WEBHOOKS */}
          {activeTab === "api" && (
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-lg font-extrabold text-white">Credenciales API</h2>
                <p className="text-xs text-zinc-500 mt-1 font-medium font-sans">Integra el motor de geocodificación y optimización de RouteAI con tu propia ERP o ecommerce.</p>
              </div>

              <div className="space-y-4 bg-zinc-950/60 border border-zinc-850 p-5 rounded-2xl">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block ml-1">Clave de API en Producción</label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    readOnly
                    className="flex-1 bg-zinc-900 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-zinc-300 font-mono outline-none"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="border border-zinc-800 hover:bg-zinc-800/50 text-zinc-300 font-bold text-xs px-4 py-2.5 rounded-xl transition"
                  >
                    {showApiKey ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">Nunca compartas tu clave secreta de API en canales públicos ni la dejes expuesta en el código del navegador cliente.</p>
              </div>

              <div className="pt-4 border-t border-zinc-800/60 space-y-4">
                <h3 className="text-sm font-extrabold text-white">Webhooks</h3>
                <p className="text-xs text-zinc-500 font-medium font-sans">Suscríbete a eventos para notificar de forma automática a tus sistemas cuando un pedido sea entregado o falle.</p>
                <button className="bg-zinc-950 border border-zinc-800 hover:bg-zinc-800/50 text-white font-bold text-xs py-3 px-6 rounded-xl transition">
                  Configurar Webhook
                </button>
              </div>
            </div>
          )}

          {/* VISTA 7: SEGURIDAD */}
          {activeTab === "seguridad" && (
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-lg font-extrabold text-white">Seguridad de la cuenta</h2>
                <p className="text-xs text-zinc-500 mt-1 font-medium font-sans">Administra tu contraseña y factores de autenticación.</p>
              </div>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Contraseña Actual</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    className="w-full mt-2 bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                  <input
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    className="w-full mt-2 bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    placeholder="Confirma tu contraseña"
                    className="w-full mt-2 bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800/60">
                <button className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition">Cancelar</button>
                <button
                  onClick={() => handleGuardarCambios("Seguridad")}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs px-6 py-2.5 rounded-xl transition shadow-lg shadow-amber-500/10 active:scale-95"
                >
                  Cambiar contraseña
                </button>
              </div>
            </div>
          )}

        </main>

      </div>

    </div>
  );
}
