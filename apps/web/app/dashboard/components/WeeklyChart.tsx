"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const WEEK_DATA = [
  { dia: "Vie", exitosas: 38, fallidas: 5 },
  { dia: "Sáb", exitosas: 52, fallidas: 8 },
  { dia: "Dom", exitosas: 29, fallidas: 3 },
  { dia: "Lun", exitosas: 61, fallidas: 4 },
  { dia: "Mar", exitosas: 55, fallidas: 6 },
  { dia: "Mié", exitosas: 47, fallidas: 1 },
  { dia: "Jue", exitosas: 30, fallidas: 1 },
];

interface WeeklyChartProps {
  tasaExito: number;
}

export function WeeklyChart({ tasaExito }: WeeklyChartProps) {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-300">
            Entregas exitosas vs fallidas · semana
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">Últimos 7 días</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {tasaExito}% éxito
        </span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={WEEK_DATA} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="dia"
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "12px",
              fontSize: "12px",
              color: "#e4e4e7",
            }}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey="exitosas" name="Exitosas" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          <Bar dataKey="fallidas" name="Fallidas" fill="#ef4444" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
