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
  backgroundColor: "var(--card)",
  border: "1px solid var(--border-ui)",
  borderRadius: "12px",
  color: "var(--foreground)",
  fontSize: "12px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
};

export function GraficosReportes({
  datosPorDia,
  datosPorRepartidor,
  distribucionEstados,
}: GraficosReportesProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Gráfico 1: Pedidos por día */}
      <div className="lg:col-span-2 bg-card border border-border-ui rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-8 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60"></span>
          Despachos últimos 7 días
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={datosPorDia} barGap={6}>
            <XAxis
              dataKey="dia"
              stroke="var(--muted-foreground)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ fontWeight: "bold", fontSize: "11px" }}
              cursor={{ fill: "var(--secondary)", opacity: 0.4 }}
            />
            <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
            <Bar dataKey="entregados" name="Entregados" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
            <Bar dataKey="fallidos" name="Fallidos" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico 2: Distribución por estado */}
      <div className="bg-card border border-border-ui rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60"></span>
          Distribución de estados
        </h3>
        {distribucionEstados.every((d) => d.value === 0) ? (
          <div className="flex items-center justify-center h-[220px] text-muted-foreground text-xs font-medium">
            Sin datos suficientes
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={distribucionEstados}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                stroke="var(--card)"
                strokeWidth={2}
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
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-muted-foreground text-[11px] font-bold uppercase tracking-tight">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Gráfico 3: Eficiencia por repartidor */}
      <div className="bg-card border border-border-ui rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500/60"></span>
          Eficiencia por repartidor
        </h3>
        {datosPorRepartidor.length === 0 ? (
          <div className="flex items-center justify-center h-[220px] text-muted-foreground text-xs font-medium">
            Sin repartidores asignados
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={datosPorRepartidor} layout="vertical" barGap={4}>
              <XAxis
                type="number"
                domain={[0, 100]}
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="nombre"
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--foreground)", fontSize: 10, fontWeight: "bold" }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value) => [`${value ?? 0}%`, "Eficiencia"]}
                cursor={{ fill: "var(--secondary)", opacity: 0.4 }}
              />
              <Bar
                dataKey="eficiencia"
                name="Eficiencia"
                fill="#8b5cf6"
                radius={[0, 4, 4, 0]}
                barSize={16}
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
    <div className="bg-card border border-border-ui rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-8 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60"></span>
        Tasa de fallo diaria (%)
      </h3>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={datos}>
          <XAxis
            dataKey="dia"
            stroke="var(--muted-foreground)"
            tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            width={35}
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
            strokeWidth={3}
            dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "var(--card)" }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
