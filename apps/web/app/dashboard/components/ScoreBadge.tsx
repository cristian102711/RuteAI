export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  const tone =
    score >= 70
      ? "bg-red-500/15 text-red-400 border-red-500/30"
      : score >= 40
        ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[11px] font-bold border tracking-wider ${tone} ${className || ""}`}
    >
      {score.toString().padStart(2, "0")}%
    </span>
  );
}
