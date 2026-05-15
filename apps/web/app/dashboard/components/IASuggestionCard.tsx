import { Sparkles, ArrowRight } from "lucide-react";

interface IASuggestionCardProps {
  tipo: "rerouteo" | "alerta" | "optimizacion";
  titulo: string;
  descripcion: string;
  confianza: number;
  modelo?: string;
  onAplicar?: () => void;
}

const TIPO_STYLES = {
  rerouteo: { label: "RE-RUTEO RECOMENDADO", cls: "text-purple-300 bg-purple-500/10 border-purple-500/20" },
  alerta: { label: "ALERTA DETECTADA", cls: "text-red-300 bg-red-500/10 border-red-500/20" },
  optimizacion: { label: "OPTIMIZACIÓN IA", cls: "text-amber-300 bg-amber-500/10 border-amber-500/20" },
};

export function IASuggestionCard({
  tipo,
  titulo,
  descripcion,
  confianza,
  modelo = "gpt-logistics-v2.1",
  onAplicar,
}: IASuggestionCardProps) {
  const style = TIPO_STYLES[tipo];

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-purple-950/20 p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider ${style.cls}`}>
            {style.label}
          </span>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
          {confianza}%
        </span>
      </div>

      <p className="mb-1 text-sm font-semibold text-white">{titulo}</p>
      <p className="mb-4 text-xs leading-relaxed text-zinc-400">{descripcion}</p>

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-zinc-600">
          Modelo: <span className="text-zinc-500">{modelo}</span>
        </p>
        <button
          onClick={onAplicar}
          className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-purple-500 active:scale-95"
        >
          Aplicar
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
