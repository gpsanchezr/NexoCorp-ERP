"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SanitaryBanner } from "@/components/shared/sanitary-banner";
import { QUICK_ACTIONS } from "@/lib/config";
import { getSanitaryConflicts, getStockAlerts } from "@/lib/alerts";
import { formatCOP } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useDataStore } from "@/store/useDataStore";

export default function MobileHomePage() {
  const { userName, role, business } = useAuthStore();
  const products = useDataStore((s) => s.products);
  const sales = useDataStore((s) => s.sales);
  const liveSalesTotal = useDataStore((s) => s.liveSalesTotal);
  const livePurchasesTotal = useDataStore((s) => s.livePurchasesTotal);
  const isOnline = useDataStore((s) => s.isOnline);

  const alerts = getStockAlerts(products);
  const conflicts = getSanitaryConflicts(products);
  const visibleActions = QUICK_ACTIONS.filter((a) => !a.ownerOnly || role === "owner");

  const todaySales = sales.filter((s) => new Date(s.createdAt).toDateString() === new Date().toDateString());
  const todayTotal = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);

  return (
    <div className="mx-auto max-w-md px-4 py-6 sm:px-6">
      <div className="mb-6">
        <p className="text-sm text-ink-500">¡Hola, {userName.split(" ")[0]}!</p>
        <h1 className="text-2xl font-bold text-ink-900">¿Qué deseas hacer hoy?</h1>
      </div>

      {alerts.length > 0 && (
        <div className="mb-4">
          <Badge variant="danger">{alerts.length} alertas de inventario</Badge>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3.5">
        {visibleActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`flex aspect-square flex-col items-center justify-center gap-2.5 rounded-2xl text-white shadow-pop transition-transform active:scale-[0.97] ${action.className}`}
            >
              <Icon className="h-9 w-9" strokeWidth={2.25} />
              <span className="px-2 text-center text-base font-bold leading-tight">{action.label}</span>
            </Link>
          );
        })}
      </div>

      <Card className="mb-4 p-4">
        <p className="text-sm font-semibold text-ink-700">Resumen del día</p>
        <div className="mt-2.5 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-ink-400">Ventas</p>
            <p className="text-lg font-bold text-ink-900">{formatCOP(todayTotal)}</p>
          </div>
          <div>
            <p className="text-ink-400">Transacciones</p>
            <p className="text-lg font-bold text-ink-900">{todaySales.length}</p>
          </div>
        </div>
        {!isOnline && (
          <p className="mt-3 rounded-lg bg-warning-50 px-2.5 py-1.5 text-xs font-medium text-warning-600">
            Sin conexión — tus ventas se guardan localmente y se sincronizan al volver la señal.
          </p>
        )}
      </Card>

      <SanitaryBanner conflicts={conflicts} />

      <p className="mt-6 text-center text-xs text-ink-300">{business.name} · Modo Cajero / Móvil</p>
      {(liveSalesTotal > 0 || livePurchasesTotal > 0) && (
        <p className="text-center text-[11px] text-ink-300">
          Esta sesión ya sumó {formatCOP(liveSalesTotal)} en ventas nuevas al Dashboard.
        </p>
      )}
    </div>
  );
}
