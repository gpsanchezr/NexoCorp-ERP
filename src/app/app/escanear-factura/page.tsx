"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Check, ChevronLeft, ClipboardList, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_INCOMING_INVOICE } from "@/lib/mock-data";
import { formatCOP, formatDate } from "@/lib/utils";
import { useDataStore } from "@/store/useDataStore";

type ScanState = "idle" | "scanning" | "reviewing" | "done";

const SCAN_STEPS = ["Extrayendo productos…", "Detectando cantidades y precios…", "Leyendo fechas de vencimiento…", "Cruzando con tu inventario…"];

export default function EscanearFacturaPage() {
  const purchases = useDataStore((s) => s.purchases);
  const confirmScannedPurchase = useDataStore((s) => s.confirmScannedPurchase);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [supplierName, setSupplierName] = useState(MOCK_INCOMING_INVOICE.supplierName);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [lastTotal, setLastTotal] = useState(0);

  useEffect(() => {
    if (scanState !== "scanning") return;
    setVisibleSteps(0);
    const interval = setInterval(() => {
      setVisibleSteps((n) => Math.min(n + 1, SCAN_STEPS.length));
    }, 480);
    const timeout = setTimeout(() => setScanState("reviewing"), 480 * SCAN_STEPS.length + 350);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [scanState]);

  function handleConfirm() {
    const purchase = confirmScannedPurchase({
      supplierName,
      items: MOCK_INCOMING_INVOICE.detectedItems,
    });
    setLastTotal(purchase.totalAmount);
    setScanState("done");
  }

  function reset() {
    setScanState("idle");
    setSupplierName(MOCK_INCOMING_INVOICE.supplierName);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center gap-2">
        <Link href="/app/mobile" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 md:hidden">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-ink-900">Compras y Escáner de Facturas</h1>
          <p className="text-xs text-ink-400">Registra facturas de proveedores y súmalas a tu inventario</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          {scanState === "idle" && (
            <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-ink-200 px-6 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Camera className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-semibold text-ink-800">Sube la foto de la factura de tu proveedor</p>
              <p className="mt-1 max-w-sm text-xs text-ink-400">
                La IA detecta productos, cantidades, costos y fechas de vencimiento automáticamente (simulado con
                datos de ejemplo para esta demo).
              </p>
              <Button className="mt-5" size="lg" onClick={() => setScanState("scanning")}>
                <ScanLine className="h-4 w-4" />
                Analizar Factura con IA
              </Button>
            </div>
          )}

          {scanState === "scanning" && (
            <div className="flex flex-col items-center px-6 py-10">
              <div className="relative flex h-28 w-24 items-center justify-center overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
                <ClipboardList className="h-10 w-10 text-ink-300" />
                <div className="absolute inset-x-0 h-1 animate-scan-sweep bg-brand-500/70" />
              </div>
              <p className="mt-4 text-sm font-semibold text-ink-800">Analizando factura…</p>
              <ul className="mt-4 space-y-2 text-sm">
                {SCAN_STEPS.map((label, i) => (
                  <li
                    key={label}
                    className={`flex items-center gap-2 transition-opacity duration-300 ${i < visibleSteps ? "opacity-100" : "opacity-30"}`}
                  >
                    {i < visibleSteps ? (
                      <Check className="h-3.5 w-3.5 text-success-500" />
                    ) : (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-300" />
                    )}
                    <span className="text-ink-600">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {scanState === "reviewing" && (
            <div>
              <div className="mb-4 space-y-1.5">
                <Label htmlFor="supplier">Proveedor</Label>
                <Input id="supplier" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
              </div>
              <p className="mb-2 text-xs font-semibold uppercase text-ink-400">Productos detectados</p>
              <div className="space-y-2">
                {MOCK_INCOMING_INVOICE.detectedItems.map((item) => (
                  <div key={item.productName} className="flex items-center justify-between rounded-xl bg-ink-50 px-3.5 py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-ink-800">{item.productName}</p>
                      <p className="text-xs text-ink-400">
                        {item.quantity} × {formatCOP(item.unitCost)}
                        {item.expirationDate && ` · Vence ${formatDate(item.expirationDate)}`}
                      </p>
                    </div>
                    <p className="font-semibold text-ink-800">{formatCOP(item.quantity * item.unitCost)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between border-t border-ink-100 pt-3 text-base font-bold text-ink-900">
                <span>Total factura</span>
                <span>{formatCOP(MOCK_INCOMING_INVOICE.totalAmount)}</span>
              </div>
              <div className="mt-5 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={reset}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleConfirm}>
                  Confirmar y Agregar
                </Button>
              </div>
            </div>
          )}

          {scanState === "done" && (
            <div className="flex flex-col items-center px-6 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-50 text-success-600">
                <Check className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-semibold text-ink-800">Inventario actualizado</p>
              <p className="mt-1 text-sm text-ink-500">
                Se sumaron los productos al stock y se registró una compra de {formatCOP(lastTotal)}.
              </p>
              <Button className="mt-5" variant="outline" onClick={reset}>
                Escanear otra factura
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Compras</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Ítems</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-ink-400">
                    Aún no hay compras registradas.
                  </TableCell>
                </TableRow>
              )}
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium text-ink-800">{purchase.supplierName}</TableCell>
                  <TableCell>{formatDate(purchase.createdAt)}</TableCell>
                  <TableCell>{purchase.items.length}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCOP(purchase.totalAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
