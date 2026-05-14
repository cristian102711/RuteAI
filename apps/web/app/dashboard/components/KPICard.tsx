import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  hint?: string;
  hintTone?: "success" | "warning" | "error" | "muted" | "primary";
  icon?: LucideIcon;
}

const TONE = {
  success: "text-emerald-400",
  warning: "text-yellow-400",
  error: "text-red-400",
  muted: "text-zinc-500",
  primary: "text-emerald-500",
} as const;

export function KPICard({ label, value, hint, hintTone = "muted", icon: Icon }: KPICardProps) {
  return (
    <div className="group rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md p-6 transition-all hover:border-emerald-500/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
        {Icon && <Icon className="h-5 w-5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />}
      </div>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-4xl font-extrabold text-white">{value}</span>
        {hint && <span className={`font-mono text-xs font-semibold ${TONE[hintTone]}`}>{hint}</span>}
      </div>
    </div>
  );
}
