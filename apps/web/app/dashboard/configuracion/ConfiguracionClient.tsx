"use client";

import { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import {
  Building2, User, BellRing, Sparkles, ChevronRight, Send, Upload, Loader2,
  CreditCard, CheckCircle2, Clock, AlertTriangle, ExternalLink, Zap
} from "lucide-react";
import { toast } from "sonner";
import {
  actualizarConfiguracionEmpresa,
  actualizarPerfil,
  actualizarConfiguracionNotificaciones,
  actualizarConfiguracionIA,
} from "../actions";

type TabId = "empresa" | "perfil" | "notificaciones" | "ia" | "facturacion";

interface ConfiguracionClientProps {
  initialEmpresa: {
    id: string;
    nombre: string;
    email: string;
    plan: string;
    rut: string;
    pais: string;
    zonaHoraria: string;
    direccion: string;
    logoUrl?: string;
  };
  initialUsuario: {
    id: string;
    nombre: string;
    email: string;
    telefono: string | null;
  };
  initialNotificaciones: {
    notifFallo: boolean;
    notifRiesgo: boolean;
    notifDesconexion: boolean;
    notifDiario: boolean;
    notifSemanal: boolean;
  };
  initialIA: {
    agresividad: number;
    modeloActivo: string;
    recalcularTiempo: string;
    prediccionFallo: boolean;
    reasignacionAuto: boolean;
    validacionDireccion: boolean;
  };
  initialBilling: {
    planEstado: string;
    planFechaInicio: string | null;
    planFechaVencimiento: string | null;
    pagos: Array<{
      id: string;
      commerceOrder: string;
      planId: string;
      monto: number;
      estado: string;
      pagadoEn: string | null;
      createdAt: string;
    }>;
  };
}

export default function ConfiguracionClient({
  initialEmpresa,
  initialUsuario,
  initialNotificaciones,
  initialIA,
  initialBilling,
}: ConfiguracionClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("empresa");
  const [saving, setSaving] = useState(false);

  // ── EMPRESA ──────────────────────────────────────────────────
  const [nombreEmpresa, setNombreEmpresa] = useState(initialEmpresa.nombre);
  const [emailSoporte, setEmailSoporte] = useState(initialEmpresa.email);
  const [rutEmpresa, setRutEmpresa] = useState(initialEmpresa.rut);
  const [pais, setPais] = useState(initialEmpresa.pais);
  const [zonaHoraria, setZonaHoraria] = useState(initialEmpresa.zonaHoraria);
  const [direccion, setDireccion] = useState(initialEmpresa.direccion);
  const [logoUrl, setLogoUrl] = useState(initialEmpresa.logoUrl || "");

  // ── CROPPER ───────────────────────────────────────────────────
  const [isCropping, setIsCropping] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || "");
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setSaving(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedBlob) throw new Error("Error recortando imagen");
      
      // 1. Obtener la Signed URL
      const resPost = await fetch("/api/empresa/logo", { method: "POST" });
      const dataPost = await resPost.json();
      if (!dataPost.success) throw new Error(dataPost.error || "Error al obtener URL de subida");
      
      const { signedUrl, publicUrl } = dataPost.data;

      // 2. Subir el archivo a Supabase usando la Signed URL
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": croppedBlob.type || "image/png" },
        body: croppedBlob,
      });

      if (!uploadRes.ok) throw new Error("Error al subir archivo a Supabase");

      // 3. Confirmar la subida y guardar en DB
      const resPatch = await fetch("/api/empresa/logo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicUrl }),
      });

      const dataPatch = await resPatch.json();
      if (dataPatch.success) {
        setLogoUrl(dataPatch.logoUrl);
        toast.success("Logo actualizado correctamente");
      } else {
        toast.error("Error: " + dataPatch.error);
      }
    } catch (e: any) {
      toast.error(e.message || "Error al subir el logo");
    } finally {
      setIsCropping(false);
      setImageSrc(null);
      setSaving(false);
    }
  };

  // ── PERFIL ────────────────────────────────────────────────────
  const [nombre, setNombre] = useState(initialUsuario.nombre.split(" ")[0] || "");
  const [apellido, setApellido] = useState(initialUsuario.nombre.split(" ").slice(1).join(" ") || "");
  const [email] = useState(initialUsuario.email);
  const [telefono, setTelefono] = useState(initialUsuario.telefono || "");

  // ── NOTIFICACIONES ────────────────────────────────────────────
  const [notifFallo, setNotifFallo] = useState(initialNotificaciones.notifFallo);
  const [notifRiesgo, setNotifRiesgo] = useState(initialNotificaciones.notifRiesgo);
  const [notifDesconexion, setNotifDesconexion] = useState(initialNotificaciones.notifDesconexion);
  const [notifDiario, setNotifDiario] = useState(initialNotificaciones.notifDiario);
  const [notifSemanal, setNotifSemanal] = useState(initialNotificaciones.notifSemanal);

  // Twilio Simulador (UI only)
  const [canal, setCanal] = useState<"whatsapp" | "sms">("whatsapp");
  const [plantilla, setPlantilla] = useState<"standard" | "premium" | "urgente">("premium");
  const [eta, setEta] = useState("25");

  // ── IA & OPTIMIZACIÓN ─────────────────────────────────────────
  const [agresividad, setAgresividad] = useState(initialIA.agresividad);
  const [modeloActivo, setModeloActivo] = useState(initialIA.modeloActivo);
  const [recalcularTiempo, setRecalcularTiempo] = useState(initialIA.recalcularTiempo);
  const [prediccionFallo, setPrediccionFallo] = useState(initialIA.prediccionFallo);
  const [reasignacionAuto, setReasignacionAuto] = useState(initialIA.reasignacionAuto);
  const [validacionDireccion, setValidacionDireccion] = useState(initialIA.validacionDireccion);

  // ── HANDLERS ──────────────────────────────────────────────────
  const handleGuardarEmpresa = async () => {
    setSaving(true);
    try {
      const res = await actualizarConfiguracionEmpresa({
        nombre: nombreEmpresa,
        email: emailSoporte,
        rut: rutEmpresa,
        pais,
        zonaHoraria,
        direccion,
      });
      if (res.success) {
        toast.success("Empresa actualizada", {
          description: "Los datos de la empresa han sido guardados en la base de datos.",
        });
      } else {
        toast.error("Error: " + res.error);
      }
    } catch {
      toast.error("Error de conexión al servidor");
    } finally {
      setSaving(false);
    }
  };

  const handleGuardarPerfil = async () => {
    setSaving(true);
    try {
      const nombreCompleto = `${nombre} ${apellido}`.trim();
      const res = await actualizarPerfil(nombreCompleto, telefono);
      if (res.success) {
        toast.success("Perfil actualizado", {
          description: "Tu información personal se ha guardado correctamente.",
        });
      } else {
        toast.error("Error: " + res.error);
      }
    } catch {
      toast.error("Error de conexión al servidor");
    } finally {
      setSaving(false);
    }
  };

  const handleGuardarNotificaciones = async () => {
    setSaving(true);
    try {
      const res = await actualizarConfiguracionNotificaciones({
        notifFallo,
        notifRiesgo,
        notifDesconexion,
        notifDiario,
        notifSemanal,
      });
      if (res.success) {
        toast.success("Notificaciones guardadas", {
          description: "Tus preferencias de alertas han sido actualizadas.",
        });
      } else {
        toast.error("Error: " + res.error);
      }
    } catch {
      toast.error("Error de conexión al servidor");
    } finally {
      setSaving(false);
    }
  };

  const handleGuardarIA = async () => {
    setSaving(true);
    try {
      const res = await actualizarConfiguracionIA({
        agresividad,
        modeloActivo,
        recalcularTiempo,
        prediccionFallo,
        reasignacionAuto,
        validacionDireccion,
      });
      if (res.success) {
        toast.success("Ajustes de IA guardados", {
          description: "La configuración del motor de optimización ha sido actualizada.",
        });
      } else {
        toast.error("Error: " + res.error);
      }
    } catch {
      toast.error("Error de conexión al servidor");
    } finally {
      setSaving(false);
    }
  };

  const simularNotificacion = () => {
    toast.success(`Notificación de prueba enviada vía ${canal.toUpperCase()}`, {
      description: `Enviada con éxito a ${telefono || email}`,
      duration: 4000,
    });
  };

  const obtenerMensajeSimulado = () => {
    const trackingUrl = "https://ruteai.vercel.app/tracking/demo-123";
    const dest = direccion || "tu dirección";
    if (plantilla === "standard") {
      return `¡Hola ${nombre || "Cliente"}! 🚚\nTu pedido está en camino a ${dest}.\nSigue tu entrega en tiempo real aquí:\n${trackingUrl}`;
    }
    if (plantilla === "premium") {
      return `¡Buenas noticias, ${nombre || "Cliente"}! 🎉\nTu repartidor va en camino. Estimamos la llegada en aproximadamente ${eta} minutos a ${dest}.\nMonitorea la ruta en vivo aquí:\n${trackingUrl}`;
    }
    return `⚠️ ¡Prioritario! Hola ${nombre || "Cliente"}, tu pedido ya está en ruta express hacia ${dest}.\nAsegúrate de estar disponible para recibirlo. Sigue el mapa en vivo:\n${trackingUrl}`;
  };

  // ── MENÚ LATERAL ──────────────────────────────────────────────
  const menuItems = [
    { id: "empresa",       label: "Empresa",         icon: Building2  },
    { id: "perfil",        label: "Perfil",           icon: User       },
    { id: "notificaciones",label: "Notificaciones",   icon: BellRing   },
    { id: "ia",            label: "IA & Optimización",icon: Sparkles   },
    { id: "facturacion",   label: "Facturación",      icon: CreditCard },
  ];

  // ── BOTÓN GUARDAR REUTILIZABLE ────────────────────────────────
  const SaveButton = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      disabled={saving}
      className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 font-black text-xs px-6 py-2.5 rounded-xl transition shadow-lg shadow-amber-500/10 active:scale-95 flex items-center gap-2"
    >
      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      Guardar cambios
    </button>
  );

  // ── TOGGLE REUTILIZABLE ───────────────────────────────────────
  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-11 h-6 bg-zinc-800 border border-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
    </label>
  );

  // ── INPUT REUTILIZABLE ────────────────────────────────────────
  const Field = ({
    label, value, onChange, type = "text", disabled = false
  }: {
    label: string; value: string; onChange?: (v: string) => void; type?: string; disabled?: boolean;
  }) => (
    <div>
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={`w-full mt-2 bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">

      {/* HEADER */}
      <div>
        <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">Configuración</p>
        <h1 className="text-3xl font-black text-white mt-1 tracking-tight">Ajustes del workspace</h1>
        <p className="text-zinc-400 text-xs mt-1 font-medium">
          {nombreEmpresa} · Plan {initialEmpresa.plan.charAt(0).toUpperCase() + initialEmpresa.plan.slice(1)}
        </p>
      </div>

      {/* LAYOUT DOS COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* MENÚ LATERAL */}
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
                    ? "bg-zinc-850 text-amber-500 shadow-md border border-zinc-700/50"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
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

        {/* CONTENIDO */}
        <main className="lg:col-span-9 space-y-6">

          {/* ── VISTA: EMPRESA ── */}
          {activeTab === "empresa" && (
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-lg font-extrabold text-white">Información de la empresa</h2>
                <p className="text-xs text-zinc-500 mt-1 font-medium">Datos visibles para tus clientes y reportes. Se guardan en la base de datos.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Nombre Comercial" value={nombreEmpresa} onChange={setNombreEmpresa} />
                <Field label="NIT / RUT" value={rutEmpresa} onChange={setRutEmpresa} />
                <Field label="País" value={pais} onChange={setPais} />
                <Field label="Zona Horaria" value={zonaHoraria} onChange={setZonaHoraria} />
                <Field label="Dirección Operativa" value={direccion} onChange={setDireccion} />
                <Field label="Email de Soporte" value={emailSoporte} onChange={setEmailSoporte} type="email" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/60">
                <button className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition">Cancelar</button>
                <SaveButton onClick={handleGuardarEmpresa} />
              </div>

              {/* Logo y Branding */}
              <div className="pt-6 border-t border-zinc-800/60">
                <h3 className="text-sm font-extrabold text-white">Logo y branding</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Aparece en el PWA del repartidor y en los reportes PDF.</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 flex items-center justify-center border border-zinc-700/50 text-xl font-bold text-white shadow-inner overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo Empresa" className="w-full h-full object-cover" />
                    ) : (
                      nombreEmpresa.charAt(0).toUpperCase()
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 border border-zinc-800 hover:bg-zinc-800/50 text-zinc-300 font-bold text-xs px-4 py-2.5 rounded-xl transition">
                    <Upload className="w-3.5 h-3.5" />
                    Subir nuevo logo
                  </button>
                  <p className="text-[10px] text-zinc-600 font-medium">PNG o SVG · máximo 1 MB · fondo transparente.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── VISTA: PERFIL ── */}
          {activeTab === "perfil" && (
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-lg font-extrabold text-white">Tu perfil</h2>
                <p className="text-xs text-zinc-500 mt-1 font-medium">Información personal del administrador de la cuenta.</p>
              </div>

              {/* Avatar */}
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
                <Field label="Nombre" value={nombre} onChange={setNombre} />
                <Field label="Apellido" value={apellido} onChange={setApellido} />
                <Field label="Email" value={email} disabled />
                <Field label="Teléfono" value={telefono} onChange={setTelefono} />
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
                <SaveButton onClick={handleGuardarPerfil} />
              </div>
            </div>
          )}

          {/* ── VISTA: NOTIFICACIONES ── */}
          {activeTab === "notificaciones" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">

              <div className="xl:col-span-7 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold text-white">Notificaciones</h2>
                  <p className="text-xs text-zinc-500 mt-1 font-medium">Decide qué eventos quieres recibir. Se persisten en base de datos.</p>
                </div>

                {/* Operación diaria */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block ml-1">Operación Diaria</h3>

                  {[
                    { label: "Pedido fallido", desc: "Recibe alerta cuando un repartidor reporta fallo.", val: notifFallo, fn: () => setNotifFallo(!notifFallo) },
                    { label: "Pedido con riesgo IA alto", desc: "Aviso cuando el score supera 70%.", val: notifRiesgo, fn: () => setNotifRiesgo(!notifRiesgo) },
                    { label: "Repartidor sin conexión > 15 min", desc: "Detección automática de pérdida de señal.", val: notifDesconexion, fn: () => setNotifDesconexion(!notifDesconexion) },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between bg-zinc-950/30 border border-zinc-800 p-4 rounded-2xl">
                      <div>
                        <p className="text-xs font-bold text-white">{item.label}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{item.desc}</p>
                      </div>
                      <Toggle checked={item.val} onChange={item.fn} />
                    </div>
                  ))}
                </div>

                {/* Reportes */}
                <div className="space-y-4 pt-4 border-t border-zinc-800/60">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block ml-1">Reportes</h3>

                  {[
                    { label: "Resumen diario por email", desc: "Cada día a las 8:00 PM.", val: notifDiario, fn: () => setNotifDiario(!notifDiario) },
                    { label: "Reporte semanal", desc: "Lunes a las 9:00 AM.", val: notifSemanal, fn: () => setNotifSemanal(!notifSemanal) },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between bg-zinc-950/30 border border-zinc-800 p-4 rounded-2xl">
                      <div>
                        <p className="text-xs font-bold text-white">{item.label}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{item.desc}</p>
                      </div>
                      <Toggle checked={item.val} onChange={item.fn} />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <SaveButton onClick={handleGuardarNotificaciones} />
                </div>

                {/* TWILIO DESIGNER */}
                <div className="pt-6 border-t border-zinc-800/60 space-y-4">
                  <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
                    <span>📳</span> Diseñador de SMS/WhatsApp (Twilio Sandbox)
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    {(["whatsapp", "sms"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCanal(c)}
                        className={`py-2 px-3 rounded-xl font-bold text-[10px] border transition-all ${
                          canal === c
                            ? c === "whatsapp"
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                              : "bg-blue-500/10 border-blue-500/40 text-blue-400"
                            : "bg-zinc-950 border-zinc-800 text-zinc-500"
                        }`}
                      >
                        {c === "whatsapp" ? "WhatsApp" : "SMS (Mensaje)"}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Plantilla de Notificación</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["standard", "premium", "urgente"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPlantilla(p)}
                          className={`py-2 rounded-lg font-bold text-[10px] border transition-all ${
                            plantilla === p ? "bg-amber-500 text-zinc-950 border-amber-400" : "bg-zinc-950 border-zinc-800 text-zinc-500"
                          }`}
                        >
                          {p === "standard" ? "Estándar" : p === "premium" ? "Premium" : "Prioritaria"}
                        </button>
                      ))}
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

              {/* Mockup Celular */}
              <div className="xl:col-span-5 flex justify-center">
                <div className="w-[280px] aspect-[9/18] bg-zinc-900 border-[6px] border-zinc-800 rounded-[2.5rem] relative flex flex-col overflow-hidden shadow-2xl">
                  <div className="absolute top-0 inset-x-0 h-5 bg-zinc-800 flex items-center justify-center z-30">
                    <div className="w-12 h-2.5 bg-zinc-950 rounded-full" />
                  </div>
                  <div className="flex-1 flex flex-col pt-5 bg-zinc-950">
                    <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-2 text-[10px] font-bold text-zinc-300 text-center">
                      {canal === "whatsapp" ? "💬 RuteAI Logística" : `📱 ${telefono || email}`}
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

          {/* ── VISTA: IA & OPTIMIZACIÓN ── */}
          {activeTab === "ia" && (
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-lg font-extrabold text-white">Optimización IA</h2>
                <p className="text-xs text-zinc-500 mt-1 font-medium">Define cómo debe comportarse el motor de optimización. Se persiste en base de datos.</p>
              </div>

              {/* Slider Agresividad */}
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

              {/* Modelos */}
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

              {/* Toggles IA */}
              <div className="space-y-4 pt-6 border-t border-zinc-800/60">
                {[
                  { label: "Predicción de riesgo de fallo", desc: "Usa historial del cliente y meteorología.", val: prediccionFallo, fn: () => setPrediccionFallo(!prediccionFallo) },
                  { label: "Reasignación automática", desc: "Permite mover paradas entre repartidores sin confirmar.", val: reasignacionAuto, fn: () => setReasignacionAuto(!reasignacionAuto) },
                  { label: "Validación de dirección con IA", desc: "Detecta direcciones malformadas antes de asignar.", val: validacionDireccion, fn: () => setValidacionDireccion(!validacionDireccion) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between bg-zinc-950/30 border border-zinc-800 p-4 rounded-2xl">
                    <div>
                      <p className="text-xs font-bold text-white">{item.label}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{item.desc}</p>
                    </div>
                    <Toggle checked={item.val} onChange={item.fn} />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/60">
                <button className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition">Cancelar</button>
                <SaveButton onClick={handleGuardarIA} />
              </div>
            </div>
          )}

        </main>
      </div>

      {/* CROP MODAL */}
      {isCropping && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 space-y-6">
            <h3 className="text-lg font-bold text-white">Recortar Logo</h3>
            <div className="relative w-full h-64 bg-black rounded-2xl overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Zoom</label>
              <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-amber-500" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/60">
              <button onClick={() => { setIsCropping(false); setImageSrc(null); }} className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition">Cancelar</button>
              <button onClick={handleCropSave} disabled={saving} className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 font-black text-xs px-6 py-2.5 rounded-xl transition flex items-center gap-2">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Guardar logo
              </button>
            </div>
          </div>
        </div>
      )}

          {/* ── VISTA: FACTURACIÓN ── */}
          {activeTab === "facturacion" && (() => {
            const PLAN_LABELS: Record<string, string> = {
              starter: "Starter — Gratis",
              pro:     "Pro — $99.000 CLP/mes",
              business:"Business — $199.000 CLP/mes",
            };
            const PLAN_COLOR: Record<string, string> = {
              starter: "text-zinc-300",
              pro:     "text-amber-400",
              business:"text-purple-400",
            };
            const estadoColor: Record<string, string> = {
              activo:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
              inactivo: "bg-zinc-800 text-zinc-400 border-zinc-700",
              vencido:  "bg-rose-500/10 text-rose-400 border-rose-500/20",
            };
            const planActual = initialEmpresa.plan;
            const esPlanPago = planActual === "pro" || planActual === "business";

            return (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                {/* Estado del plan */}
                <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 sm:p-8">
                  <h2 className="text-lg font-extrabold text-white">Plan activo</h2>
                  <p className="text-xs text-zinc-500 mt-1">Estado de tu suscripción con RouteAI.</p>

                  <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-zinc-800 rounded-2xl p-5 bg-zinc-950/30">
                    <div className="flex items-center gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-white/5">
                        <Zap className="h-6 w-6 text-amber-400" />
                      </div>
                      <div>
                        <p className={`text-base font-black ${PLAN_COLOR[planActual] ?? "text-white"}`}>
                          {PLAN_LABELS[planActual] ?? planActual}
                        </p>
                        <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${estadoColor[initialBilling.planEstado] ?? estadoColor.inactivo}`}>
                          {initialBilling.planEstado === "activo"
                            ? <><CheckCircle2 className="h-3 w-3" /> Activo</>
                            : initialBilling.planEstado === "vencido"
                            ? <><AlertTriangle className="h-3 w-3" /> Vencido</>
                            : <><Clock className="h-3 w-3" /> {planActual === "starter" ? "Plan gratuito" : "Sin pago activo"}</>}
                        </span>
                      </div>
                    </div>

                    {esPlanPago && initialBilling.planFechaVencimiento && (
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Vence el</p>
                        <p className="text-sm font-bold text-white">
                          {new Date(initialBilling.planFechaVencimiento).toLocaleDateString("es-CL", {
                            day: "numeric", month: "long", year: "numeric"
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CTA upgrade para starter */}
                  {planActual === "starter" && (
                    <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                      <p className="text-sm font-bold text-white mb-1">¿Listo para escalar?</p>
                      <p className="text-xs text-zinc-400 mb-4">Pasa a Pro y desbloquea Score IA, webhooks y 50 repartidores.</p>
                      <a
                        href="/#pricing"
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 py-2.5 text-xs font-black text-black hover:opacity-95 transition shadow-lg shadow-amber-500/10"
                      >
                        <Zap className="h-3.5 w-3.5" /> Ver planes disponibles
                      </a>
                    </div>
                  )}
                </div>

                {/* Historial de pagos */}
                <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 sm:p-8">
                  <h2 className="text-lg font-extrabold text-white">Historial de pagos</h2>
                  <p className="text-xs text-zinc-500 mt-1">Transacciones procesadas via Flow.cl.</p>

                  {initialBilling.pagos.length === 0 ? (
                    <div className="mt-8 flex flex-col items-center justify-center gap-3 py-10 text-center">
                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-zinc-800/60">
                        <CreditCard className="h-7 w-7 text-zinc-600" />
                      </div>
                      <p className="text-sm font-bold text-zinc-400">Sin transacciones aún</p>
                      <p className="text-xs text-zinc-600">Aquí aparecerán tus pagos una vez que contrates un plan.</p>
                    </div>
                  ) : (
                    <div className="mt-5 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-zinc-800 text-left">
                            <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Orden</th>
                            <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Plan</th>
                            <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Monto</th>
                            <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Estado</th>
                            <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Fecha</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                          {initialBilling.pagos.map((pago) => (
                            <tr key={pago.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 font-mono text-zinc-400 pr-4">
                                {pago.commerceOrder.slice(-12)}
                              </td>
                              <td className="py-3 font-semibold text-white capitalize">{pago.planId}</td>
                              <td className="py-3 font-mono text-white">
                                ${pago.monto.toLocaleString("es-CL")} CLP
                              </td>
                              <td className="py-3">
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                  pago.estado === "pagado"   ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                  pago.estado === "pendiente"? "bg-amber-500/10   text-amber-400   border-amber-500/20"   :
                                  pago.estado === "rechazado"? "bg-rose-500/10    text-rose-400    border-rose-500/20"    :
                                  "bg-zinc-800 text-zinc-400 border-zinc-700"
                                }`}>
                                  {pago.estado.charAt(0).toUpperCase() + pago.estado.slice(1)}
                                </span>
                              </td>
                              <td className="py-3 text-zinc-400">
                                {pago.pagadoEn
                                  ? new Date(pago.pagadoEn).toLocaleDateString("es-CL")
                                  : new Date(pago.createdAt).toLocaleDateString("es-CL")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            );
          })()}

        </main>
      </div>
    </div>
  );
}
