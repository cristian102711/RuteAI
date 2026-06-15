"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  X, Camera, PenLine, CheckCircle2, Loader2,
  RefreshCcw, ChevronRight, ChevronLeft, Upload,
} from "lucide-react";

// ─── tipos ───────────────────────────────────────────────────────────────────
interface ModalEvidenciaProps {
  pedidoId:     string;
  nombreCliente: string;
  onClose:      () => void;
  /** Se llama cuando FOTO + (firma opcional) se subieron y pedido marcado entregado */
  onSuccess:    () => void;
}

type Paso = "foto" | "firma" | "subiendo";

// ─── helpers ─────────────────────────────────────────────────────────────────
async function subirArchivoASupabase(
  pedidoId: string,
  tipo: "foto" | "firma",
  blob: Blob
): Promise<string> {
  // 1. Pedir Signed URL
  const resUrl = await fetch("/api/evidencia", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ pedidoId, tipo }),
  });
  if (!resUrl.ok) throw new Error("Error generando URL de carga");
  const { data } = await resUrl.json();

  // 2. PUT directo a Supabase Storage con la signed URL
  const resUpload = await fetch(data.signedUrl, {
    method:  "PUT",
    headers: { "Content-Type": blob.type || "image/jpeg" },
    body:    blob,
  });
  if (!resUpload.ok) throw new Error("Error subiendo archivo");

  // 3. Notificar al backend que ya está subido y guardar la URL
  const resPatch = await fetch("/api/evidencia", {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ pedidoId, tipo, publicUrl: data.publicUrl }),
  });
  if (!resPatch.ok) throw new Error("Error guardando URL en el pedido");

  return data.publicUrl as string;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
  return new Blob([buffer], { type: mime });
}

// ─── componente principal ────────────────────────────────────────────────────
export function ModalEvidencia({ pedidoId, nombreCliente, onClose, onSuccess }: ModalEvidenciaProps) {
  const [paso, setPaso]             = useState<Paso>("foto");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoBlob, setFotoBlob]     = useState<Blob | null>(null);
  const [firmaTouched, setFirmaTouched] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const fileRef  = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // ── Inicializar canvas con fondo blanco ──
  useEffect(() => {
    if (paso !== "firma") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Ajustar resolución al DPR
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
  }, [paso]);

  // ── Helpers dibujo ──
  function getPos(e: React.Touch | React.MouseEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const clientX = "clientX" in e ? e.clientX : (e as React.Touch).clientX;
    const clientY = "clientY" in e ? e.clientY : (e as React.Touch).clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function startDraw(pos: { x: number; y: number }) {
    isDrawing.current = true;
    lastPoint.current = pos;
  }

  function draw(pos: { x: number; y: number }) {
    if (!isDrawing.current || !lastPoint.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPoint.current = pos;
    setFirmaTouched(true);
  }

  function endDraw() { isDrawing.current = false; lastPoint.current = null; }

  function limpiarFirma() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setFirmaTouched(false);
  }

  // ── Seleccionar foto ──
  const handleFoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoBlob(file);
    const reader = new FileReader();
    reader.onload = (ev) => setFotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  // ── Subir todo y cerrar ──
  async function handleCompletar(omitirFirma = false) {
    if (!fotoBlob) { setError("Necesitas tomar una foto primero."); return; }
    setError(null);
    setPaso("subiendo");

    try {
      // Subir foto (al subir foto el backend también marca como entregado)
      await subirArchivoASupabase(pedidoId, "foto", fotoBlob);

      // Subir firma si no se omite y el canvas tiene trazos
      if (!omitirFirma && firmaTouched && canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL("image/png");
        const blob = dataUrlToBlob(dataUrl);
        await subirArchivoASupabase(pedidoId, "firma", blob);
      }

      onSuccess();
    } catch (err: any) {
      setError(err?.message ?? "Error al subir. Inténtalo de nuevo.");
      setPaso("firma");
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-sm bg-zinc-900 sm:rounded-3xl rounded-t-3xl border border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* Barra de color superior según el paso */}
        <div className={`h-1 w-full transition-all duration-500 ${
          paso === "foto"     ? "bg-gradient-to-r from-amber-500 to-amber-400" :
          paso === "firma"    ? "bg-gradient-to-r from-purple-500 to-blue-500" :
          "bg-gradient-to-r from-emerald-400 to-teal-400"
        }`} />

        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {paso === "foto" ? "Paso 1 de 2" : paso === "firma" ? "Paso 2 de 2" : "Procesando..."}
            </p>
            <h2 className="text-base font-bold text-white mt-0.5">
              {paso === "foto"    ? "📸 Foto de entrega" :
               paso === "firma"   ? "✍️ Firma del cliente" :
               "Subiendo evidencias"}
            </h2>
            <p className="text-xs text-zinc-400 truncate max-w-[200px]">{nombreCliente}</p>
          </div>
          {paso !== "subiendo" && (
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── PASO: SUBIENDO ── */}
        {paso === "subiendo" && (
          <div className="flex flex-col items-center gap-4 py-14 px-5">
            <div className="relative grid h-16 w-16 place-items-center">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white">Subiendo a Supabase Storage…</p>
              <p className="text-xs text-zinc-500 mt-1">Esto tomará solo unos segundos</p>
            </div>
          </div>
        )}

        {/* ── PASO: FOTO ── */}
        {paso === "foto" && (
          <div className="p-5 space-y-4">
            {/* Preview / zona de captura */}
            <div
              className="relative overflow-hidden rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-950/60 aspect-[4/3] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-amber-500/60 transition-colors group"
              onClick={() => fileRef.current?.click()}
            >
              {fotoPreview ? (
                <img src={fotoPreview} alt="Preview" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <>
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                    <Camera className="h-7 w-7 text-amber-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-zinc-200">Tomar foto de la entrega</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Abre la cámara o selecciona una imagen</p>
                  </div>
                </>
              )}

              {/* Input oculto */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFoto}
              />

              {/* Botón retomar foto si ya hay preview */}
              {fotoPreview && (
                <button
                  onClick={(e) => { e.stopPropagation(); setFotoPreview(null); setFotoBlob(null); fileRef.current?.click(); }}
                  className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-black/70 px-2.5 py-1.5 text-xs font-bold text-white backdrop-blur-sm hover:bg-black/90 transition-colors"
                >
                  <RefreshCcw className="h-3 w-3" /> Retomar
                </button>
              )}
            </div>

            {error && <p className="text-xs text-rose-400 text-center">{error}</p>}

            {/* Botón siguiente */}
            <button
              disabled={!fotoPreview}
              onClick={() => { setError(null); setPaso("firma"); }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-black py-3.5 text-sm transition-all active:scale-95"
            >
              Siguiente — Firma del cliente <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── PASO: FIRMA ── */}
        {paso === "firma" && (
          <div className="p-5 space-y-4">
            {/* Canvas de firma */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Firma aquí
                </p>
                <button
                  onClick={limpiarFirma}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  <RefreshCcw className="h-3 w-3" /> Limpiar
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-white touch-none select-none" style={{ height: 180 }}>
                <canvas
                  ref={canvasRef}
                  className="w-full h-full cursor-crosshair"
                  /* Touch events */
                  onTouchStart={(e) => { e.preventDefault(); const t = e.touches[0]; startDraw(getPos(t, canvasRef.current!)); }}
                  onTouchMove={(e)  => { e.preventDefault(); const t = e.touches[0]; draw(getPos(t, canvasRef.current!)); }}
                  onTouchEnd={endDraw}
                  /* Mouse events (desktop) */
                  onMouseDown={(e) => startDraw(getPos(e, canvasRef.current!))}
                  onMouseMove={(e) => draw(getPos(e, canvasRef.current!))}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                />
                {!firmaTouched && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <PenLine className="h-5 w-5" />
                      <span className="text-sm">El cliente firma aquí</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && <p className="text-xs text-rose-400 text-center">{error}</p>}

            {/* Acciones */}
            <div className="space-y-2">
              <button
                disabled={!firmaTouched}
                onClick={() => handleCompletar(false)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-black py-3.5 text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
              >
                <Upload className="h-4 w-4" /> Confirmar entrega con firma
              </button>

              <button
                onClick={() => handleCompletar(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 text-sm transition-all active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Omitir firma y confirmar
              </button>

              <button
                onClick={() => setPaso("foto")}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Volver a la foto
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
