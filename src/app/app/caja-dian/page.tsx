"use client";

import Link from "next/link";
import { ChevronLeft, LayoutDashboard, ShoppingBag, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DianGauge } from "@/components/shared/dian-gauge";
import { MOCK_MONTHLY_SUMMARY } from "@/lib/mock-data";
import { formatCOP } from "@/lib/utils";
import { useDataStore } from "@/store/useDataStore";

export default function CajaDianPage() {
  const uvtAccumulated = useDataStore((s) => s.uvtAccumulated);
  const liveSalesTotal = useDataStore((s) => s.liveSalesTotal);
  const livePurchasesTotal = useDataStore((s) => s.livePurchasesTotal);
  const operatingExpenses = useDataStore((s) => s.operatingExpenses);

  const ventas = MOCK_MONTHLY_SUMMARY.ventasDelMes + liveSalesTotal;
  const compras = MOCK_MONTHLY_SUMMARY.comprasDelMes + livePurchasesTotal;
  const gastosFijos = operatingExpenses.reduce((acc, e) => acc + e.amount, 0);
  const utilidad = ventas - compras - gastosFijos;

  return (
    <div className="mx-auto max-w-md px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center gap-2">
        <Link href="/app/mobile" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-ink-900">Caja & DIAN</h1>
      </div>

      <Card className="mb-4 p-6">
        <DianGauge currentTotal={uvtAccumulated} />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-ink-500">
            <TrendingUp className="h-3.5 w-3.5 text-success-500" />
            Ventas del mes
          </div>
          <p className="mt-1.5 text-lg font-bold text-ink-900">{formatCOP(ventas)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-ink-500">
            <TrendingDown className="h-3.5 w-3.5 text-violet-500" />
            Compras del mes
          </div>
          <p className="mt-1.5 text-lg font-bold text-ink-900">{formatCOP(compras)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-ink-500">
            <ShoppingBag className="h-3.5 w-3.5 text-warning-500" />
            Gastos fijos
          </div>
          <p className="mt-1.5 text-lg font-bold text-ink-900">{formatCOP(gastosFijos)}</p>
        </Card>
        <Card className="border-brand-100 bg-brand-50 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-brand-700">
            <Wallet className="h-3.5 w-3.5" />
            Utilidad neta
          </div>
          <p className="mt-1.5 text-lg font-bold text-brand-800">{formatCOP(utilidad)}</p>
        </Card>
      </div>

      <Button asChild variant="outline" className="mt-5 w-full">
        <Link href="/app/dashboard">
          <LayoutDashboard className="h-4 w-4" />
          Ver Dashboard completo
        </Link>
      </Button>
    </div>
  );
}
