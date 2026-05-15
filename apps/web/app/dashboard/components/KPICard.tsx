import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  hint?: string;
  hintTone?: "success" | "warning" | "error" | "muted" | "primary";
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  progress?: number; // 0–100 para mostrar barra de progreso
  accentColor?: "amber" | "emerald" | "red" | "purple" | "blue";
}

const TONE = {
  success: "text-emerald-400",
  warning: "text-amber-400",
  error: "text-red-400",
  muted: "text-zinc-500",
  primary: "text-amber-400",
} as const;

const ACCENT = {
  amber: { icon: "text-amber-400", bar: "bg-amber-500", glow: "hover:border-amber-500/30" },
  emerald: { icon: "text-emerald-400", bar: "bg-emerald-500", glow: "hover:border-emerald-500/30" },
  red: { icon: "text-red-400", bar: "bg-red-500", glow: "hover:border-red-500/30" },
  purple: { icon: "text-purple-400", bar: "bg-purple-500", glow: "hover:border-purple-500/30" },
  blue: { icon: "text-blue-400", bar: "bg-blue-500", glow: "hover:border-blue-500/30" },
} as const;

const TREND_ICON = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
} as const;

const TREND_COLOR = {
  up: "text-emerald-400",
  down: "text-red-400",
  neutral: "text-zinc-500",
} as const;

export function KPICard({
  label,
  value,
  hint,
  hintTone = "muted",
  icon: Icon,
  trend,
  trendValue,
  progress,
  accentColor = "amber",
}: KPICardProps) {
  const accent = ACCENT[accentColor];
  const TrendIcon = trend ? TREND_ICON[trend] : null;

  return (
    <div
      className={`group rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md p-5 transition-all duration-200 hover:bg-zinc-900/60 ${accent.glow}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/60">
            <Icon className={`h-4 w-4 ${accent.icon}`} />
          </div>
        )}
      </div>

      <div className="mb-1 flex items-baseline gap-2">
        <span className="font-mono text-3xl font-extrabold text-white">{value}</span>
        {hint && (
          <span className={`text-xs font-semibold ${TONE[hintTone]}`}>{hint}</span>
        )}
      </div>

      {trend && trendValue && TrendIcon && (
        <div className={`flex items-center gap-1 text-[11px] font-medium ${TREND_COLOR[trend]}`}>
          <TrendIcon className="h-3 w-3" />
          {trendValue}
        </div>
      )}

      {typeof progress === "number" && (
        <div className="mt-3">
          <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${accent.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
