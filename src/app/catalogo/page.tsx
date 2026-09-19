"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ImageIcon, Search, ShoppingBag } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { Product } from "@/lib/types";

const fallbackProducts: Product[] = [
  {
    id: "demo-1",
    businessId: "demo-business",
    name: "Shampoo Anticaída",
    category: "Cuidado personal",
    costPrice: 18000,
    salePrice: 26000,
    stockQuantity: 12,
    minStock: 5,
    image_url: null,
    safetyFlags: [],
  },
  {
    id: "demo-2",
    businessId: "demo-business",
    name: "Paracetamol 500mg",
    category: "Medicamentos",
    costPrice: 2200,
    salePrice: 4200,
    stockQuantity: 30,
    minStock: 10,
    image_url: null,
    safetyFlags: ["medicamento"],
  },
  {
    id: "demo-3",
    businessId: "demo-business",
    name: "Caja de guantes",
    category: "Protección",
    costPrice: 9000,
    salePrice: 15000,
    stockQuantity: 8,
    minStock: 4,
    image_url: null,
    safetyFlags: [],
  },
];

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          if (isMounted) {
            setProducts(fallbackProducts);
          }
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("business_id")
          .eq("id", user.id)
          .single();

        if (!profile?.business_id) {
          if (isMounted) setProducts(fallbackProducts);
          return;
        }

        const { data: rows, error } = await supabase
          .from("products")
          .select("*")
          .eq("business_id", profile.business_id)
          .order("created_at", { ascending: false })
          .limit(24);

        if (error) throw error;

        const mapped = (rows ?? []).map((row) => ({
          id: row.id,
          businessId: row.business_id,
          barcode: row.barcode ?? undefined,
          name: row.name,
          category: row.category,
          costPrice: Number(row.cost ?? row.cost_price ?? 0),
          salePrice: Number(row.price ?? row.sale_price ?? 0),
          stockQuantity: Number(row.stock ?? row.stock_quantity ?? 0),
          minStock: Number(row.min_stock ?? 0),
          expirationDate: row.expiration_date ?? undefined,
          image_url: row.image_url ?? null,
          safetyFlags: Array.isArray(row.safety_flags) ? row.safety_flags : [],
        })) as Product[];

        if (isMounted) setProducts(mapped.length ? mapped : fallbackProducts);
      } catch (error) {
        console.error("Error cargando catálogo público:", error);
        if (isMounted) setProducts(fallbackProducts);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = products.filter((product) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return true;
    return (
      product.name.toLowerCase().includes(normalized) ||
      product.category.toLowerCase().includes(normalized)
    );
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
          <Link href="/" className="text-xl font-bold text-slate-900">NexoCorp</Link>
          <Link href="/login" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Iniciar sesión
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Catálogo</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Productos del negocio</h1>
          </div>

          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar productos..."
              className="h-11 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none ring-0 transition focus:border-blue-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="relative h-52 bg-slate-100">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      {product.category}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                        product.stockQuantity > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.stockQuantity > 0 ? `${product.stockQuantity} en stock` : "Sin stock"}
                    </span>
                  </div>

                  <div>
                    <h2 className="line-clamp-2 text-lg font-bold text-slate-900">{product.name}</h2>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Precio</p>
                      <p className="text-xl font-bold text-slate-900">
                        {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(product.salePrice)}
                      </p>
                    </div>

                    <button className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                      <ShoppingBag className="h-4 w-4" />
                      Ver
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">
            No se encontraron productos para tu búsqueda.
          </div>
        )}
      </section>
    </main>
  );
}
