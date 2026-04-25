"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface DatosDia {
  dia: string;
  total: number;
  entregados: number;
  fallidos: number;
}

interface DatosRepartidor {
  nombre: string;
  total: number;
  entregados: number;
  eficiencia: number;
}

interface GraficosReportesProps {
  datosPorDia: DatosDia[];
  datosPorRepartidor: DatosRepartidor[];
  distribucionEstados: { name: string; value: number; color: string }[];
}

const TOOLTIP_STYLE = {
  backgroundColor: "#18181b",
  border: "1px solid rgba(63,63,70,0.6)",
  borderRadius: "12px",
  color: "#e4e4e7",
  fontSize: "12px",
};

export function GraficosReportes({
  datosPorDia,
  datosPorRepartidor,
  distribucionEstados,
}: GraficosReportesProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Gráfico 1: Pedidos por día */}
      <div className="lg:col-span-2 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 shadow-xl">
        <h3 className="text-sm font-bold tracking-widest uppercase text-zinc-400 mb-6">
          📦 Despachos últimos 7 días
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={datosPorDia} barGap={4}>
            <XAxis
              dataKey="dia"
              stroke="#52525b"
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="#52525b"
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="entregados" name="Entregados" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="fallidos" name="Fallidos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico 2: Distribución por estado */}
      <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 shadow-xl">
        <h3 className="text-sm font-bold tracking-widest uppercase text-zinc-400 mb-6">
          🎯 Distribución de estados
        </h3>
        {distribucionEstados.every((d) => d.value === 0) ? (
          <div className="flex items-center justify-center h-[200px] text-zinc-600 text-sm">
            Sin datos suficientes
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={distribucionEstados}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {distribucionEstados.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value) => [`${value ?? 0} pedidos`, ""]}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ color: "#a1a1aa", fontSize: "12px" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Gráfico 3: Eficiencia por repartidor */}
      <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 shadow-xl">
        <h3 className="text-sm font-bold tracking-widest uppercase text-zinc-400 mb-6">
          🚚 Eficiencia por repartidor
        </h3>
        {datosPorRepartidor.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-zinc-600 text-sm">
            Sin repartidores asignados
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={datosPorRepartidor} layout="vertical" barGap={4}>
              <XAxis
                type="number"
                domain={[0, 100]}
                stroke="#52525b"
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="nombre"
                stroke="#52525b"
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value) => [`${value ?? 0}%`, "Eficiencia"]}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar
                dataKey="eficiencia"
                name="Eficiencia"
                fill="#a78bfa"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* Línea de tendencia del score IA — ocupa ancho completo */
export function GraficoTendenciaRiesgo({ datosPorDia }: { datosPorDia: DatosDia[] }) {
  // Simular tendencia de riesgo como promedio del día (no tenemos dato real por día, lo aproximamos)
  const datos = datosPorDia.map((d) => ({
    dia: d.dia,
    riesgo: d.total > 0 ? Math.round((d.fallidos / d.total) * 100) : 0,
  }));

  return (
    <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 shadow-xl">
      <h3 className="text-sm font-bold tracking-widest uppercase text-zinc-400 mb-6">
        🧠 Tasa de fallo diaria (%)
      </h3>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={datos}>
          <XAxis
            dataKey="dia"
            stroke="#52525b"
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="#52525b"
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={32}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value) => [`${value ?? 0}%`, "Tasa de fallo"]}
          />
          <Line
            type="monotone"
            dataKey="riesgo"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 4, fill: "#f59e0b" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
