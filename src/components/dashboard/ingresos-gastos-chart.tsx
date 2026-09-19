"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCOP } from "@/lib/utils";

export function IngresosGastosChart({ data }: { data: { mes: string; ingresos: number; gastos: number }[] }) {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos vs Gastos</CardTitle>
      </CardHeader>
      <CardContent className="pl-1">
        {!hasData ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-ink-200 bg-ink-50 px-4 text-center text-sm text-ink-400">
            Aún no hay datos suficientes para graficar.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barGap={4}>
                <CartesianGrid vertical={false} stroke="#eceef2" />
                <XAxis
                  dataKey="mes"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#7c8598" }}
                  tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tick={{ fontSize: 11, fill: "#7c8598" }}
                  tickFormatter={(v: number) => `$${Math.round(v / 1_000_000)}M`}
                />
                <Tooltip
                  cursor={{ fill: "#f5f6f8" }}
                  formatter={(value) => formatCOP(Number(value))}
                  labelFormatter={(label) => `${String(label).charAt(0).toUpperCase()}${String(label).slice(1)}`}
                  contentStyle={{ borderRadius: 12, borderColor: "#e9ebef", fontSize: 12 }}
                />
                <Legend
                  formatter={(value) => (value === "ingresos" ? "Ingresos (Ventas)" : "Gastos (Compras)")}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="ingresos" fill="#1fa64c" radius={[6, 6, 0, 0]} maxBarSize={22} />
                <Bar dataKey="gastos" fill="#2f6bfa" radius={[6, 6, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
