"use client";

import { useState } from "react";
import { toast } from "sonner";
import { agregarPedidoNuevo } from "../actions";
import { Zap } from "lucide-react";
import { MapPickerInput } from "./MapPickerInput";

const INPUT_CLASS =
  "w-full bg-secondary border border-border-ui text-foreground placeholder-muted-foreground/60 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-sm transition-all text-sm disabled:opacity-50";

export interface RepartidorOption {
  id: string;
  nombre: string;
}

export function FormCrearPedido({
  empresaId,
  repartidores = [],
  onCreated,
}: {
  empresaId: string;
  repartidores?: RepartidorOption[];
  onCreated?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direccion, setDireccion] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [pickerKey, setPickerKey] = useState(0);

  async function handleAction(formData: FormData) {
    setIsSubmitting(true);
    toast.loading("Procesando con RouteAI...", { id: "crear-pedido" });

    try {
      const res = await agregarPedidoNuevo(formData);
      if (res?.error) {
        toast.error(res.error, { id: "crear-pedido" });
        return;
      }
      toast.success("Pedido despachado exitosamente", { id: "crear-pedido" });
      setDireccion("");
      setLat("");
      setLng("");
      setPickerKey((k) => k + 1);
      onCreated?.();
    } catch {
      toast.error("Hubo un fallo general en la red", { id: "crear-pedido" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form action={handleAction} className="flex flex-col gap-5">
      <input type="hidden" name="empresaId" value={empresaId} />

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase ml-1">Destinatario</label>
        <input name="cliente" placeholder="Ej: Juan Pérez" required className={INPUT_CLASS} disabled={isSubmitting} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase ml-1">Teléfono Destinatario (SMS/WhatsApp)</label>
        <input name="clienteTelefono" type="tel" placeholder="Ej: +56912345678" className={INPUT_CLASS} disabled={isSubmitting} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase ml-1">Dirección de Entrega</label>
        {/* Hidden inputs that carry the controlled values to FormData */}
        <input type="hidden" name="direccion" value={direccion} />
        <input type="hidden" name="lat" value={lat} />
        <input type="hidden" name="lng" value={lng} />
        <MapPickerInput
          key={pickerKey}
          value={direccion}
          onChange={setDireccion}
          onCoordsChange={(la, ln) => {
            setLat(la.toString());
            setLng(ln.toString());
          }}
          inputClassName={INPUT_CLASS}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase ml-1">Despacho / SKU</label>
        <input name="producto" placeholder="Identificador del equipo" required className={`${INPUT_CLASS} font-bold uppercase tracking-wider`} disabled={isSubmitting} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase ml-1">Repartidor (opcional)</label>
        <select name="repartidorId" defaultValue="" className={`${INPUT_CLASS} [color-scheme:dark]`} disabled={isSubmitting}>
          <option value="">Sin asignar</option>
          {repartidores.map((r) => (
            <option key={r.id} value={r.id}>{r.nombre}</option>
          ))}
        </select>
        {repartidores.length === 0 && (
          <span className="text-[10px] text-muted-foreground/70 ml-1">No hay repartidores aún. Invítalos desde Equipo.</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase ml-1">⏱ Hora límite de entrega (SLA)</label>
        <input
          name="fechaEntregaLimite"
          type="datetime-local"
          min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
          className={`${INPUT_CLASS} [color-scheme:dark]`}
          disabled={isSubmitting}
        />
        <span className="text-[10px] text-muted-foreground/70 ml-1">Si no se entrega antes de esta hora, el pedido se marca como atrasado.</span>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 flex justify-center items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm px-4 py-3.5 rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group w-full tracking-wide shadow-md hover:shadow-primary/20"
      >
        {isSubmitting ? (
          <span className="w-5 h-5 rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground animate-spin" />
        ) : (
          <><Zap strokeWidth={2.5} className="w-4 h-4 group-hover:scale-110 transition-transform" /> Iniciar Tracking e IA</>
        )}
      </button>
    </form>
  );
}
