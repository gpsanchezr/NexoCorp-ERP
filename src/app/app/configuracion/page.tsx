"use client";

import { useState } from "react";
import { Check, Cloud, RotateCcw, ShieldCheck, UserCog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImportMasterDialog } from "@/components/shared/import-master-dialog";
import { getSector } from "@/lib/config";
import { useAuthStore } from "@/store/useAuthStore";
import { useDataStore } from "@/store/useDataStore";

export default function ConfiguracionPage() {
  const { business, role, switchRole } = useAuthStore();
  const resetDemoData = useDataStore((s) => s.resetDemoData);
  const [resetDone, setResetDone] = useState(false);

  const sector = getSector(business.sector);

  function handleReset() {
    resetDemoData();
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2500);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Configuración</h1>
        <p className="text-sm text-ink-500">Datos del negocio, roles y utilidades de esta demo.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tu negocio</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-ink-400">Nombre</p>
            <p className="font-semibold text-ink-900">{business.name}</p>
          </div>
          <div>
            <p className="text-xs text-ink-400">Sector</p>
            <p className="font-semibold text-ink-900">{sector.label}</p>
          </div>
          <div>
            <p className="text-xs text-ink-400">Ciudad</p>
            <p className="font-semibold text-ink-900">{business.city}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <UserCog className="h-3.5 w-3.5" />
            Roles de Usuario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-ink-100 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="brand">owner</Badge>
                <span className="text-sm font-semibold text-ink-800">Propietario</span>
              </div>
              <p className="text-xs text-ink-500">
                Acceso total: Dashboard, Radar DIAN, Finanzas, Reportes y Configuración, además de todo el Modo
                Mostrador.
              </p>
            </div>
            <div className="rounded-xl border border-ink-100 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="neutral">cashier</Badge>
                <span className="text-sm font-semibold text-ink-800">Cajero</span>
              </div>
              <p className="text-xs text-ink-500">
                Solo ventas e inventario visual. Sin acceso a datos financieros ni al Dashboard — el botón &ldquo;Ver
                Caja &amp; DIAN&rdquo; queda oculto.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-ink-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase text-ink-400">Vista de demostración</p>
            <p className="mb-3 text-xs text-ink-500">
              Esta demo no incluye un backend de autenticación real — usa este interruptor para ver la app como cada
              rol. En producción, el rol vendría de tu tabla de usuarios en Supabase.
            </p>
            <div className="flex gap-2">
              <Button variant={role === "owner" ? "default" : "outline"} size="sm" onClick={() => switchRole("owner")}>
                Ver como Dueño
              </Button>
              <Button variant={role === "cashier" ? "default" : "outline"} size="sm" onClick={() => switchRole("cashier")}>
                Ver como Cajero
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Cloud className="h-3.5 w-3.5" />
            Backend y seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-ink-600">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success-500" />
            Cada negocio ve solo sus propios datos (Row Level Security por <code className="rounded bg-ink-100 px-1">business_id</code>).
          </p>
          <p className="text-xs text-ink-400">
            Ahora mismo esta demo funciona con datos simulados en el navegador. El esquema SQL con las políticas RLS
            está listo en <code className="rounded bg-ink-100 px-1">/supabase/schema.sql</code> — conéctalo siguiendo
            el manual del desarrollador cuando quieras pasar a producción.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Importación maestra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-ink-500">
            Importa un archivo Excel maestro para revisar y validar en el cliente las hojas clave del ecosistema antes
            de cualquier carga a base de datos.
          </p>
          <ImportMasterDialog />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos de ejemplo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-ink-500">
            Restablece el inventario, ventas y compras a los datos de demostración originales.
          </p>
          <Button variant="outline" onClick={handleReset}>
            {resetDone ? <Check className="h-4 w-4 text-success-500" /> : <RotateCcw className="h-4 w-4" />}
            {resetDone ? "Datos restablecidos" : "Restablecer datos de ejemplo"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
