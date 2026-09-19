"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReceiptView } from "@/components/shared/receipt-view";
import { calcSaleTotals, formatCOP } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useDataStore } from "@/store/useDataStore";
import type { DiscountType, Product, Sale } from "@/lib/types";

type CartLine = { product: Product; quantity: number };
type Step = "carrito" | "cliente" | "recibo";

export default function VentaRapidaPage() {
  const business = useAuthStore((s) => s.business);
  const products = useDataStore((s) => s.products);
  const registerSale = useDataStore((s) => s.registerSale);

  const [step, setStep] = useState<Step>("carrito");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountType, setDiscountType] = useState<DiscountType>("none");
  const [discountValue, setDiscountValue] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerCedula, setCustomerCedula] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const results = useMemo(() => {
    if (!query.trim()) return products.slice(0, 8);
    const q = query.trim().toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 8);
  }, [products, query]);

  const totals = useMemo(
    () => calcSaleTotals(cart.map((l) => ({ quantity: l.quantity, unitPrice: l.product.salePrice })), discountType, Number(discountValue) || 0),
    [cart, discountType, discountValue]
  );

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev;
        return prev.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      if (product.stockQuantity <= 0) return prev;
      return [...prev, { product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.product.id === productId
            ? { ...l, quantity: Math.max(0, Math.min(l.quantity + delta, l.product.stockQuantity)) }
            : l
        )
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  }

  function handleFinalize() {
    const sale = registerSale({
      items: cart.map((l) => ({ product: l.product, quantity: l.quantity })),
      discountType,
      discountValue: Number(discountValue) || 0,
      customer: customerName.trim()
        ? { name: customerName.trim(), cedulaNit: customerCedula, phone: customerPhone, email: customerEmail }
        : undefined,
    });
    setCompletedSale(sale);
    setStep("recibo");
  }

  function resetFlow() {
    setCart([]);
    setDiscountType("none");
    setDiscountValue("");
    setCustomerName("");
    setCustomerCedula("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCompletedSale(null);
    setQuery("");
    setStep("carrito");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center gap-2">
        <Link
          href="/app/mobile"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-ink-900">Venta Rápida</h1>
          <p className="text-xs text-ink-400">
            {step === "carrito" && "Paso 1 de 3 · Agrega productos"}
            {step === "cliente" && "Paso 2 de 3 · Datos del cliente"}
            {step === "recibo" && "Paso 3 de 3 · Recibo"}
          </p>
        </div>
      </div>

      {step === "carrito" && (
        <div className="space-y-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              className="pl-10"
              placeholder="Buscar producto por nombre o categoría…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            {results.map((product) => {
              const inCart = cart.find((l) => l.product.id === product.id);
              const soldOut = product.stockQuantity <= 0;
              return (
                <Card key={product.id} className="flex items-center justify-between p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">{product.name}</p>
                    <p className="text-xs text-ink-400">
                      {formatCOP(product.salePrice)} · {soldOut ? "Agotado" : `${product.stockQuantity} disp.`}
                    </p>
                  </div>
                  <Button size="sm" variant={inCart ? "secondary" : "default"} disabled={soldOut} onClick={() => addToCart(product)}>
                    {inCart ? `+ (${inCart.quantity})` : "Agregar"}
                  </Button>
                </Card>
              );
            })}
            {results.length === 0 && <p className="py-6 text-center text-sm text-ink-400">Sin resultados para &ldquo;{query}&rdquo;</p>}
          </div>

          {cart.length > 0 && (
            <Card className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-800">
                <ShoppingCart className="h-4 w-4" />
                Carrito ({cart.length})
              </div>
              <div className="space-y-3">
                {cart.map((line) => (
                  <div key={line.product.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-800">{line.product.name}</p>
                      <p className="text-xs text-ink-400">{formatCOP(line.product.salePrice)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => changeQuantity(line.product.id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-100 text-ink-600"
                        aria-label="Restar"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{line.quantity}</span>
                      <button
                        onClick={() => changeQuantity(line.product.id, 1)}
                        disabled={line.quantity >= line.product.stockQuantity}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-100 text-ink-600 disabled:opacity-40"
                        aria-label="Sumar"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="w-20 shrink-0 text-right text-sm font-semibold text-ink-800">
                      {formatCOP(line.product.salePrice * line.quantity)}
                    </p>
                    <button onClick={() => removeLine(line.product.id)} className="text-ink-300 hover:text-danger-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-ink-100 pt-4">
                <Select value={discountType} onValueChange={(v) => setDiscountType(v as DiscountType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Descuento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin descuento</SelectItem>
                    <SelectItem value="percent">Descuento %</SelectItem>
                    <SelectItem value="fixed">Descuento $</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  inputMode="numeric"
                  placeholder={discountType === "percent" ? "10" : "5000"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  disabled={discountType === "none"}
                />
              </div>

              <div className="mt-4 space-y-1 border-t border-ink-100 pt-3 text-sm">
                <div className="flex justify-between text-ink-500">
                  <span>Subtotal</span>
                  <span>{formatCOP(totals.subtotal)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-ink-500">
                    <span>Descuento</span>
                    <span>-{formatCOP(totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-ink-900">
                  <span>Total</span>
                  <span>{formatCOP(totals.total)}</span>
                </div>
              </div>
            </Card>
          )}

          <Button size="xl" className="w-full" disabled={cart.length === 0} onClick={() => setStep("cliente")}>
            Continuar {cart.length > 0 && `· ${formatCOP(totals.total)}`}
          </Button>
        </div>
      )}

      {step === "cliente" && (
        <div className="space-y-5">
          <Card className="space-y-4 p-5">
            <p className="text-sm text-ink-500">
              Opcional — solo si el cliente quiere su recibo por WhatsApp o correo, o si es una venta fiada.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Nombre</Label>
              <Input id="c-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nombre del cliente" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-cedula">Cédula</Label>
                <Input id="c-cedula" value={customerCedula} onChange={(e) => setCustomerCedula(e.target.value)} placeholder="1.045.678.901" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-phone">Teléfono</Label>
                <Input id="c-phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="573001234567" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-email">Correo</Label>
              <Input id="c-email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="cliente@correo.com" />
            </div>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep("carrito")}>
              Atrás
            </Button>
            <Button className="flex-1" size="lg" onClick={handleFinalize}>
              Finalizar Venta
            </Button>
          </div>
        </div>
      )}

      {step === "recibo" && completedSale && (
        <ReceiptView sale={completedSale} business={business} onNewSale={resetFlow} />
      )}
    </div>
  );
}
