"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  CloudSun,
  HandCoins,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  MousePointerClick,
  Package,
  Receipt,
  ScanLine,
  Settings,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { getSector, TRIAL_DAYS } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useDataStore } from "@/store/useDataStore";
import { getStockAlerts } from "@/lib/alerts";
import { createClient } from "@/utils/supabase/client";
import type { SectorKey } from "@/lib/types";
import type { AppIdentity } from "@/app/app/layout";

const NAV_ITEMS: { href: string; label: string; icon: typeof LayoutDashboard; minRole: "owner" | "admin" | "cashier" }[] = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, minRole: "owner" },
  { href: "/app/pos", label: "Modo Mostrador", icon: MousePointerClick, minRole: "cashier" },
  { href: "/app/ventas", label: "Ventas", icon: Receipt, minRole: "cashier" },
  { href: "/app/escanear-factura", label: "Compras", icon: ScanLine, minRole: "admin" },
  { href: "/app/stock", label: "Inventario", icon: Package, minRole: "cashier" },
  { href: "/app/clientes", label: "Clientes", icon: Users, minRole: "admin" },
  { href: "/app/fiados", label: "Fiados", icon: HandCoins, minRole: "admin" },
  { href: "/app/configuracion", label: "Configuración", icon: Settings, minRole: "owner" },
];

const BOTTOM_NAV = [
  { href: "/app/pos", label: "Inicio", icon: MousePointerClick },
  { href: "/app/venta-rapida", label: "Ventas", icon: Receipt },
  { href: "/app/stock", label: "Inventario", icon: Package },
];

function daysRemaining(trialStartDate: string): number {
  const started = new Date(trialStartDate);
  const diffDays = Math.floor((Date.now() - started.getTime()) / 86_400_000);
  return Math.max(TRIAL_DAYS - diffDays, 0);
}

export function AppShell({ children, initialIdentity }: { children: React.ReactNode; initialIdentity: AppIdentity }) {
  const pathname = usePathname();
  const { role } = useAuthStore();
  const [identity, setIdentity] = useState<AppIdentity | null>(null);
  const products = useDataStore((s) => s.products);
  const isOnline = useDataStore((s) => s.isOnline);
  const pendingSyncIds = useDataStore((s) => s.pendingSyncIds);
  const setOnline = useDataStore((s) => s.setOnline);
  const [moreOpen, setMoreOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.clear();
        window.sessionStorage.clear();

        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
          const [name] = cookie.split("=");
          if (!name) continue;
          document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
        }
      }

      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (error) {
        console.warn("No se pudo cerrar sesión de Supabase:", error);
      }
    } finally {
      if (typeof window !== "undefined") {
        window.location.href = "/registro";
      }
    }
  };

  useEffect(() => {
    setIdentity(initialIdentity);
  }, [initialIdentity]);

  useEffect(() => {
    const updateClock = () => setCurrentDate(new Date());
    updateClock();
    const interval = window.setInterval(updateClock, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const alerts = useMemo(() => getStockAlerts(products), [products]);
  const sector = getSector((identity?.sector || "otro") as SectorKey);
  const displayName = identity?.userName || "";
  const displayBusinessName = identity?.businessName || "";
  const displayCity = identity?.city || "";
  const effectiveRole = identity?.role ?? role ?? "owner";
  const visibleNav = NAV_ITEMS.filter((item) => {
    const roleOrder = { owner: 3, admin: 2, cashier: 1 } as const;
    return roleOrder[effectiveRole] >= roleOrder[item.minRole];
  });
  const moreNav = NAV_ITEMS.filter((item) => !BOTTOM_NAV.some((b) => b.href === item.href));

  return (
    <div className="flex min-h-dvh bg-ink-50">
      {/* Sidebar de escritorio */}
      <aside className="hidden w-64 shrink-0 flex-col bg-ink-950 text-white md:flex">
        <div className="flex h-16 items-center px-5">
          <Logo dark />
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {visibleNav.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase text-white/30">Acceso</p>
          <div className="flex items-center justify-between rounded-lg bg-white/5 px-2.5 py-2">
            <span className="text-[11px] text-white/70">Rol</span>
            <Badge
              variant={effectiveRole === "owner" ? "brand" : effectiveRole === "admin" ? "violet" : "warning"}
              className="inline-flex"
            >
              {effectiveRole === "owner" ? "Dueño" : effectiveRole === "admin" ? "Administrador" : "Cajero"}
            </Badge>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-ink-100 bg-white/90 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-2.5 md:hidden">
            <LogoMark className="h-7 w-7" />
            {identity ? <span className="text-sm font-bold text-ink-900">{displayBusinessName}</span> : <span className="h-4 w-28 animate-pulse rounded bg-ink-100" aria-label="Cargando negocio" />}
          </div>
          <div className="hidden min-w-0 flex-col md:flex">
            {identity ? <><span className="truncate text-sm font-semibold text-ink-900">{displayBusinessName}</span><span className="text-xs text-ink-400">{sector.label} · {displayCity}</span></> : <><span className="h-4 w-32 animate-pulse rounded bg-ink-100" /><span className="mt-1 h-3 w-24 animate-pulse rounded bg-ink-100" /></>}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-2.5 py-1.5 text-amber-950 lg:flex">
              <CloudSun className="h-5 w-5 text-amber-500" />
              <div className="leading-tight">
                <p className="text-[10px] font-semibold text-amber-900">Barranquilla, CO · 28°C</p>
                <p className="flex items-center gap-1 text-[10px] text-amber-700">
                  <CalendarDays className="h-3 w-3" />
                  {currentDate
                    ? new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" }).format(currentDate)
                    : "Cargando fecha"}
                  {currentDate ? ` · ${new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit" }).format(currentDate)}` : ""}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOnline(!isOnline)}
              title="Toca para simular pérdida de conexión (modo demo)"
              className="hidden items-center gap-1.5 sm:flex"
            >
              <Badge variant={isOnline ? "success" : "warning"}>
                {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isOnline ? "En línea" : `Sin conexión${pendingSyncIds.length ? ` · ${pendingSyncIds.length} por sincronizar` : ""}`}
              </Badge>
            </button>

            <Badge variant="brand" className="hidden sm:inline-flex">
              Prueba gratis · {identity ? daysRemaining(identity.trialStartDate) : "..."} días restantes
            </Badge>

            <Link
              href="/app/stock"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100"
              title="Alertas de inventario"
            >
              <Bell className="h-[18px] w-[18px]" />
              {alerts.length > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
                  {alerts.length}
                </span>
              )}
            </Link>

            <div className="hidden items-center gap-2 border-l border-ink-100 pl-3 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                {identity ? displayName.charAt(0).toUpperCase() : <span className="h-3 w-3 animate-pulse rounded-full bg-brand-200" />}
              </div>
              <div className="leading-tight">
                {identity ? <p className="text-xs font-semibold text-ink-800">{displayName}</p> : <span className="block h-3 w-24 animate-pulse rounded bg-ink-100" />}
                <Badge
                  variant={effectiveRole === "owner" ? "brand" : effectiveRole === "admin" ? "violet" : "warning"}
                  className="mt-1 px-1.5 py-0.5 text-[10px]"
                >
                  {effectiveRole === "owner" ? "Dueño" : effectiveRole === "admin" ? "Administrador" : "Cajero"}
                </Badge>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="ml-1 text-ink-400 hover:text-ink-700"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-0">{children}</main>

        {/* Navegación inferior (móvil) */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t border-ink-100 bg-white md:hidden">
          {BOTTOM_NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-brand-600" : "text-ink-400"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-ink-400"
          >
            <MoreHorizontal className="h-5 w-5" />
            Más
          </button>
        </nav>

        {moreOpen && (
          <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal>
            <div className="absolute inset-0 bg-ink-900/40" onClick={() => setMoreOpen(false)} />
            <div className="absolute bottom-0 inset-x-0 rounded-t-2xl bg-white p-4 pb-8 shadow-pop animate-fade-in">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink-900">Más opciones</span>
                <button onClick={() => setMoreOpen(false)} aria-label="Cerrar">
                  <X className="h-5 w-5 text-ink-400" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {moreNav
                  .filter((item) => {
                    const roleOrder = { owner: 3, admin: 2, cashier: 1 } as const;
                    return roleOrder[effectiveRole] >= roleOrder[item.minRole];
                  })
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className="flex flex-col items-center gap-2 rounded-xl border border-ink-100 py-4 text-center text-xs font-medium text-ink-600"
                      >
                        <Icon className="h-5 w-5 text-ink-500" />
                        {item.label}
                      </Link>
                    );
                  })}
              </div>
              <div className="mt-4 border-t border-ink-100 pt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase text-ink-400">Rol actual</p>
                <div className="flex items-center justify-between rounded-lg bg-ink-50 px-2.5 py-2 text-sm">
                  <span className="text-ink-600">
                    {effectiveRole === "owner" ? "Dueño" : effectiveRole === "admin" ? "Administrador" : "Cajero"}
                  </span>
                  <Badge
                    variant={effectiveRole === "owner" ? "brand" : effectiveRole === "admin" ? "violet" : "warning"}
                    className="inline-flex"
                  >
                    {effectiveRole === "owner" ? "Dueño" : effectiveRole === "admin" ? "Administrador" : "Cajero"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
