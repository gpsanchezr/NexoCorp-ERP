"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCOP } from "@/lib/utils";

const COLORS = ["#2f6bfa", "#7a3ff2", "#1fa64c", "#e2960f", "#d92c2c"];
const EXPENSE_TYPES = ["Arriendo", "Servicios", "Nómina", "Otros"];

function normalizeExpenseType(value: string) {
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  if (["arriend", "alquiler", "renta", "arrendamiento"].some((term) => normalized.includes(term))) return "Arriendo";
  if (["servicio", "energia", "agua", "luz", "internet", "telefono", "publico", "publica", "gas"].some((term) => normalized.includes(term))) return "Servicios";
  if (["nomina", "salario", "sueldo", "sueldos", "remuneracion", "personal", "empleado", "honorario"].some((term) => normalized.includes(term))) return "Nómina";
  return "Otros";
}

export function GastosOperativos({ expenses }: { expenses: { type: string; amount: number }[] }) {
  const [type, setType] = useState(EXPENSE_TYPES[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryNames = ["Arriendo", "Servicios", "Nómina", "Otros"];
  const grouped = categoryNames
    .map((name) => ({ name, value: expenses.filter((expense) => normalizeExpenseType(expense.type) === name).reduce((sum, expense) => sum + expense.amount, 0) }))
    .filter((entry) => entry.value > 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount.replace(/\D/g, ""));
    if (!value) return;
    setDescription("");
    setAmount("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos Operativos Fijos</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        <div className="flex items-center gap-4">
          <div className="relative h-36 w-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={grouped} dataKey="value" nameKey="name" innerRadius={42} outerRadius={64} paddingAngle={3}>
                  {grouped.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCOP(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-medium uppercase tracking-wide text-ink-400">Total</span>
              <span className="text-sm font-bold text-ink-900">{formatCOP(total)}</span>
            </div>
          </div>
          <ul className="space-y-1.5 text-sm">
            {grouped.length === 0 ? (
              <li className="text-ink-400">Aún no hay gastos registrados.</li>
            ) : (
              grouped.map((g, i) => (
                <li key={g.name} className="flex items-center gap-2 text-ink-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {g.name}
                  <span className="ml-auto font-semibold text-ink-800">{formatCOP(g.value)}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="expense-type">Tipo de gasto</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="expense-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="expense-amount">Valor</Label>
              <Input
                id="expense-amount"
                inputMode="numeric"
                placeholder="350000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="expense-desc">Descripción</Label>
            <Input
              id="expense-desc"
              placeholder="Ej. Factura de energía"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            Guardar
          </Button>
          <p className="text-right text-xs text-ink-400">
            Total gastos fijos: <span className="font-semibold text-ink-700">{formatCOP(total)}</span>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
