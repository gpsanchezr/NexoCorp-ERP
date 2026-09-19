"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCOP } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import type { Product } from "@/lib/types";

type ProductRow = {
  id: string;
  business_id: string;
  name: string;
  category: string;
  price?: number | string | null;
  sale_price?: number | string | null;
  stock?: number | string | null;
  stock_quantity?: number | string | null;
  image_url?: string | null;
  safety_flags?: string | string[] | null;
};

function mapProduct(row: ProductRow): Product {
  const parsedSafetyFlags = row.safety_flags
    ? typeof row.safety_flags === "string"
      ? JSON.parse(row.safety_flags)
      : row.safety_flags
    : [];

  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    category: row.category,
    costPrice: 0,
    salePrice: Number(row.price ?? row.sale_price ?? 0),
    stockQuantity: Number(row.stock ?? row.stock_quantity ?? 0),
    minStock: 0,
    image_url: row.image_url ?? null,
    safetyFlags: Array.isArray(parsedSafetyFlags) ? parsedSafetyFlags : [],
  };
}

export function CatalogoPreview() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (isMounted) setProducts([]);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("business_id")
          .eq("id", user.id)
          .single();

        if (profileError || !profile?.business_id) {
          if (isMounted) setProducts([]);
          return;
        }

        const { data: rows, error: productsError } = await supabase
          .from("products")
          .select("*")
          .eq("business_id", profile.business_id)
          .order("created_at", { ascending: false })
          .limit(4);

        if (productsError) {
          console.error("Error cargando catálogo:", productsError);
          if (isMounted) setProducts([]);
          return;
        }

        if (isMounted) setProducts((rows ?? []).map(mapProduct));
      } catch (error) {
        console.error("Error al cargar catálogo:", error);
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const featured = products.slice(0, 4);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Catálogo Público (Vista Cliente)</CardTitle>
        {products.length > 0 && (
          <Link href="/catalogo" className="flex items-center gap-1 text-xs font-semibold text-brand-600">
            Ver catálogo completo
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {loading ? (
          <p className="col-span-full text-sm text-ink-400">Cargando catálogo…</p>
        ) : featured.length === 0 ? (
          <p className="col-span-full text-sm text-ink-400">No hay productos disponibles en este negocio.</p>
        ) : (
          featured.map((product) => (
            <div key={product.id} className="overflow-hidden rounded-xl border border-ink-100 bg-white">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-28 w-full object-cover"
                />
              ) : (
                <div className="flex h-28 w-full items-center justify-center bg-ink-50 text-ink-300">
                  <ImageIcon className="h-7 w-7" />
                </div>
              )}

              <div className="p-3">
                <p className="truncate text-xs font-semibold text-ink-800">{product.name}</p>
                <p className="text-xs text-ink-500">{formatCOP(product.salePrice)}</p>
                <p className="mt-1 text-[10px] text-ink-400">
                  {product.stockQuantity > 0 ? `Stock: ${product.stockQuantity}` : "Agotado"}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
