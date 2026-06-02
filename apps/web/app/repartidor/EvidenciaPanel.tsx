"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, PenLine, CheckCircle, Loader2, AlertCircle } from "lucide-react";

type TipoEvidencia = "foto" | "firma";
type Estado = "idle" | "uploading" | "success" | "error";

interface Props {
  pedidoId: string;
}

export function EvidenciaPanel({ pedidoId }: Props) {
  const router = useRouter();
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const firmaInputRef = useRef<HTMLInputElement>(null);
  const [fotoEstado, setFotoEstado]   = useState<Estado>("idle");
  const [firmaEstado, setFirmaEstado] = useState<Estado>("idle");

  async function subirEvidencia(file: File, tipo: TipoEvidencia) {
    const setEstado = tipo === "foto" ? setFotoEstado : setFirmaEstado;
    setEstado("uploading");

    try {
      // 1. Pedir signed URL al BFF
      const signedRes = await fetch("/api/evidencia", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ pedidoId, tipo }),
      });
      const signedJson = await signedRes.json() as {
        success: boolean;
        error?: string;
        data?: { signedUrl: string; publicUrl: string };
      };
      if (!signedJson.success || !signedJson.data) {
        throw new Error(signedJson.error ?? "Error al obtener URL de carga");
      }

      const { signedUrl, publicUrl } = signedJson.data;

      // 2. Subir el archivo directamente a Supabase Storage
      const uploadRes = await fetch(signedUrl, {
        method:  "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body:    file,
      });
      if (!uploadRes.ok) throw new Error(`Upload falló con status ${uploadRes.status}`);

      // 3. Confirmar la URL en el pedido (si es foto, también marca como entregado)
      const patchRes = await fetch("/api/evidencia", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ pedidoId, tipo, publicUrl }),
      });
      const patchJson = await patchRes.json() as { success: boolean; error?: string };
      if (!patchJson.success) throw new Error(patchJson.error ?? "Error al guardar evidencia");

      setEstado("success");
      // La foto marca el pedido como entregado → refrescar para avanzar al siguiente
      router.refresh();
    } catch (err) {
      console.error("[EvidenciaPanel]", err);
      setEstado("error");
      setTimeout(() => setEstado("idle"), 3000);
    }
  }

  function onFileSelected(tipo: TipoEvidencia) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      void subirEvidencia(file, tipo);
      e.target.value = ""; // Permite volver a seleccionar el mismo archivo
    };
  }

  return (
    <div className="mt-4 space-y-2">
      <p className="text-center text-xs text-zinc-500">Evidencia de entrega</p>

      <div className="grid grid-cols-2 gap-2">
        {/* Foto de entrega */}
        <button
          onClick={() => fotoInputRef.current?.click()}
          disabled={fotoEstado === "uploading" || fotoEstado === "success"}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-white/5 py-2.5 text-sm text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon estado={fotoEstado} icono={<Camera className="h-4 w-4" />} />
          <span>
            {fotoEstado === "success" ? "Foto guardada" :
             fotoEstado === "error"   ? "Reintentar"   : "Foto de entrega"}
          </span>
        </button>
        <input
          ref={fotoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFileSelected("foto")}
        />

        {/* Firma del receptor */}
        <button
          onClick={() => firmaInputRef.current?.click()}
          disabled={firmaEstado === "uploading" || firmaEstado === "success"}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-white/5 py-2.5 text-sm text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon estado={firmaEstado} icono={<PenLine className="h-4 w-4" />} />
          <span>
            {firmaEstado === "success" ? "Firma guardada" :
             firmaEstado === "error"   ? "Reintentar"    : "Capturar firma"}
          </span>
        </button>
        <input
          ref={firmaInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFileSelected("firma")}
        />
      </div>

      {(fotoEstado === "error" || firmaEstado === "error") && (
        <p className="text-center text-xs text-red-400">
          Error al subir. Verifica tu conexión e intenta de nuevo.
        </p>
      )}
    </div>
  );
}

function Icon({ estado, icono }: { estado: Estado; icono: React.ReactNode }) {
  if (estado === "uploading") return <Loader2 className="h-4 w-4 animate-spin" />;
  if (estado === "success")   return <CheckCircle className="h-4 w-4 text-emerald-400" />;
  if (estado === "error")     return <AlertCircle className="h-4 w-4 text-red-400" />;
  return <>{icono}</>;
}
