import { Route } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900/50 border border-zinc-800">
          <div className="absolute inset-0 rounded-xl border border-amber-500/20 border-t-amber-500 animate-spin" />
          <Route className="h-5 w-5 text-amber-500 opacity-80" />
        </div>
      </div>
    </div>
  );
}
