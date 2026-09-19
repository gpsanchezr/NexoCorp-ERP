"use client";

import { useMemo, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { Search } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getSector } from "@/lib/config";
import { cn, formatCOP } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useDataStore } from "@/store/useDataStore";

export default function CatalogoPublicoPage() {
  const params = useParams<{ slug: string }>();
  const business = useAuthStore((s) => s.business);
  const products = useDataStore((s) => s.products);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const sector = getSector(business.sector);
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);

  const filtered = products.filter((p) => {
    const matchesQuery = !query.trim() || p.name.toLowerCase().includes(query.trim().toLowerCase());
    const matchesCategory = !category || p.category === category;
    return matchesQuery && matchesCategory;
  });

  // En esta demo solo existe un negocio simulado — si el slug no coincide,
  // mostramos igualmente el catálogo (útil para probar con cualquier URL)
  // en vez de forzar un 404 en un prototipo de un solo tenant.
  if (!params?.slug) notFound();

  return (
    <main className="min-h-dvh bg-ink-50 pb-16">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-8 text-center">
          <Logo />
          <h1 className="mt-2 text-xl font-bold text-ink-900">{business.name}</h1>
          <p className="text-sm text-ink-400">
            {sector.label} · {business.city}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input className="pl-9" placeholder="Buscar producto…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory(null)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                !category ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-500"
              )}
            >
              Todo
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold",
                  category === c ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-500"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((product) => {
            const soldOut = product.stockQuantity <= 0;
            return (
              <Card key={product.id} className={cn("overflow-hidden", soldOut && "opacity-60")}>
                <div className="flex h-24 items-center justify-center bg-ink-50 text-xs font-medium text-ink-300">
                  {product.category}
                </div>
                <div className="p-3.5">
                  <p className="line-clamp-2 text-sm font-semibold text-ink-800">{product.name}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-ink-900">{formatCOP(product.salePrice)}</p>
                    <Badge variant={soldOut ? "danger" : "success"}>{soldOut ? "Agotado" : "Disponible"}</Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && <p className="py-16 text-center text-sm text-ink-400">No encontramos productos con ese filtro.</p>}
      </div>

      <p className="mt-10 text-center text-xs text-ink-300">Catálogo generado automáticamente por NexoCorp</p>
    </main>
  );
}
