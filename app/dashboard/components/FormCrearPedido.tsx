"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { agregarPedidoNuevo } from "../actions";
import { Zap, MapPin } from "lucide-react";

export function FormCrearPedido({ empresaId }: { empresaId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [direccion, setDireccion] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  async function handleAction(formData: FormData) {
    setIsSubmitting(true);
    toast.loading("Procesando con RouteAI...", { id: "crear-pedido" });
    
    try {
      const res = await agregarPedidoNuevo(formData, empresaId);
      if (res?.error) {
         toast.error(res.error, { id: "crear-pedido" });
         return;
      }
      toast.success("Pedido despachado exitosamente", { id: "crear-pedido" });
      setDireccion(""); // limpiar form
      setLat("");
      setLng("");
    } catch {
      toast.error("Hubo un fallo general en la red", { id: "crear-pedido" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDireccionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDireccion(val);
    setLat("");
    setLng("");
    
    if (val.length < 3) {
      setSuggestions([]);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=cl&q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Error geocoding", error);
      } finally {
        setIsSearching(false);
      }
    }, 600); // 600ms debounce
  };

  const selectSuggestion = (s: any) => {
    setDireccion(s.display_name);
    setLat(s.lat);
    setLng(s.lon);
    setSuggestions([]);
  };

  return (
    <form action={handleAction} className="flex flex-col gap-5">
      <input type="hidden" name="lat" value={lat} />
      <input type="hidden" name="lng" value={lng} />

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase ml-1">Destinatario</label>
        <input name="cliente" placeholder="Ej: Juan Pérez" required className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-100 placeholder-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 shadow-inner transition-all text-sm disabled:opacity-50" disabled={isSubmitting} />
      </div>
      
      <div className="flex flex-col gap-1.5 relative">
        <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase ml-1">Dirección de Entrega</label>
        <input 
          name="direccion" 
          placeholder="Ej: plaza renca" 
          value={direccion}
          onChange={handleDireccionChange}
          required 
          className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-100 placeholder-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 shadow-inner transition-all text-sm disabled:opacity-50" 
          disabled={isSubmitting} 
          autoComplete="off"
        />
        
        {/* Dropdown de Autocompletado */}
        {isSearching && (
          <div className="absolute top-16 left-0 w-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 p-3 flex justify-center items-center">
            <span className="w-4 h-4 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <span className="text-xs text-zinc-400 ml-2 font-medium">Buscando ubicaciones...</span>
          </div>
        )}

        {suggestions.length > 0 && !isSearching && (
          <ul className="absolute top-16 left-0 w-full bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
            {suggestions.map((s, idx) => (
              <li 
                key={idx} 
                onClick={() => selectSuggestion(s)}
                className="px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800 cursor-pointer flex items-start gap-3 transition-colors group"
              >
                <MapPin className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-zinc-300 group-hover:text-zinc-100 line-clamp-2 leading-relaxed">
                  {s.display_name}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase ml-1">Despacho / SKU</label>
        <input name="producto" placeholder="Identificador del equipo" required className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-100 placeholder-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 shadow-inner transition-all text-sm font-bold uppercase tracking-wider disabled:opacity-50" disabled={isSubmitting} />
      </div>
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="mt-4 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(52,211,153,0.4)] text-zinc-950 font-extrabold text-sm px-4 py-3.5 rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group w-full tracking-wide"
      >
        {isSubmitting ? <span className="w-5 h-5 rounded-full border-2 border-zinc-900/20 border-t-zinc-950 animate-spin" /> : <><Zap strokeWidth={2.5} className="w-4 h-4 text-zinc-950 group-hover:scale-110 transition-transform" /> Iniciar Tracking e IA</>}
      </button>
    </form>
  );
}
