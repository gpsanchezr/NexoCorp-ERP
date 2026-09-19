"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Banknote, ShoppingBag, ShieldAlert, TrendingUp, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { IngresosGastosChart } from "@/components/dashboard/ingresos-gastos-chart";
import { GastosOperativos } from "@/components/dashboard/gastos-operativos";
import { AlertasInventario } from "@/components/dashboard/alertas-inventario";
import { BuscadorVentas } from "@/components/dashboard/buscador-ventas";
import { CatalogoPreview } from "@/components/dashboard/catalogo-preview";
import { DianGauge } from "@/components/shared/dian-gauge";

type DashboardData = {
  ventasDelMes: number;
  comprasDelMes: number;
  gastosFijos: number;
  chartData: { mes: string; ingresos: number; gastos: number }[];
  expenses: { type: string; amount: number }[];
};

function getTimeGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function normalizeFirstName(name: string) {
  return name
    .toString()
    .trim()
    .split(/\s+/)
    .filter(Boolean)[0] || "Usuario";
}

export function DashboardPageContent({ firstName, isOwner, dashboardData }: { firstName: string; isOwner: boolean; dashboardData: DashboardData }) {
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState("Hola");
  const [message, setMessage] = useState("A continuación, el resumen de tu negocio.");

  useEffect(() => {
    const hour = new Date().getHours();
    const saludo = getTimeGreeting(hour);
    const safeFirstName = normalizeFirstName(firstName);
    const phrases = [
      `${saludo}, ${safeFirstName}. Cada venta cuenta y cada decisión impulsa tu negocio.`,
      `${saludo}, ${safeFirstName}. Tu fuerza de trabajo hoy puede abrir nuevas oportunidades mañana.`,
      `${saludo}, ${safeFirstName}. Sigue enfocada en lo que hace crecer tu operación y tu confianza.`,
      `${saludo}, ${safeFirstName}. Mantén el impulso y convierte cada paso en una venta más.`,
      `${saludo}, ${safeFirstName}. Tu negocio tiene mucho potencial; hoy es momento de moverlo con decisión.`,
    ];

    setGreeting(saludo);
    setMessage(phrases[Math.floor(Math.random() * phrases.length)]);
    setMounted(true);
  }, [firstName]);

  if (!isOwner) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
        <ShieldAlert className="h-10 w-10 text-ink-300" />
        <p className="mt-3 text-sm font-semibold text-ink-700">El Dashboard es solo para el propietario</p>
        <p className="mt-1 text-sm text-ink-400">Cambia a la vista de Dueño en el menú, o vuelve al Modo Mostrador.</p>
        <Button asChild className="mt-5">
          <Link href="/app/mobile">Ir al Modo Mostrador</Link>
        </Button>
      </div>
    );
  }

  const { ventasDelMes, comprasDelMes, gastosFijos, chartData, expenses } = dashboardData;
  const utilidadNeta = ventasDelMes - comprasDelMes - gastosFijos;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm text-ink-500">
          {mounted ? `${greeting}, ${normalizeFirstName(firstName)}!` : `Hola, ${normalizeFirstName(firstName)}!`}
        </p>
        <h1 className="text-2xl font-bold text-ink-900">{message}</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-3">
          <KpiCard label="Ventas del mes" value={ventasDelMes} variation={0} icon={TrendingUp} tone="success" />
          <KpiCard label="Compras del mes" value={comprasDelMes} variation={0} icon={ShoppingBag} tone="violet" />
          <KpiCard label="Utilidad Neta" value={utilidadNeta} variation={0} icon={Wallet} tone="brand" />
        </div>
        <Card className="flex flex-col items-center justify-center p-5">
          <p className="mb-2 self-start text-sm font-semibold text-ink-500">Radar DIAN</p>
          <DianGauge currentTotal={ventasDelMes} compact />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IngresosGastosChart data={chartData} />
        </div>
        <AlertasInventario />
      </div>

      <GastosOperativos expenses={expenses} />

      <BuscadorVentas />

      <CatalogoPreview />

      <div className="flex items-center gap-2 rounded-2xl border border-ink-100 bg-white p-4 text-xs text-ink-400">
        <Banknote className="h-4 w-4 text-ink-300" />
        Datos financieros sincronizados con Supabase para el negocio autenticado.
      </div>
    </div>
  );
}
