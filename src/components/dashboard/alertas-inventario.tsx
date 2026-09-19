"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { stockPercentage } from "@/lib/alerts";
import type { Product, StockAlert } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

type ProductRow = {
  id: string;
  business_id: string;
  name: string;
  category: string;
  stock: number | string | null;
  min_stock: number | string | null;
  safety_flags?: string | string[] | null;
  price?: number | string | null;
  cost?: number | string | null;
  sale_price?: number | string | null;
  cost_price?: number | string | null;
  barcode?: string | null;
  expiration_date?: string | null;
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
    costPrice: Number(row.cost ?? row.cost_price ?? 0),
    salePrice: Number(row.price ?? row.sale_price ?? 0),
    stockQuantity: Number(row.stock ?? 0),
    minStock: Number(row.min_stock ?? 0),
    barcode: row.barcode ?? undefined,
    expirationDate: row.expiration_date ?? undefined,
    safetyFlags: Array.isArray(parsedSafetyFlags) ? parsedSafetyFlags : [],
  };
}

export function AlertasInventario({ limit = 4 }: { limit?: number }) {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAlerts() {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setAlerts([]);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("business_id")
          .eq("id", user.id)
          .single();

        if (profileError || !profile?.business_id) {
          setAlerts([]);
          return;
        }

        const { data: rows, error: productsError } = await supabase
          .from("products")
          .select("*")
          .eq("business_id", profile.business_id);

        if (productsError) {
          console.error("Error cargando alertas de inventario:", productsError);
          if (isMounted) setAlerts([]);
          return;
        }

        const mapped: Product[] = (rows ?? []).map(mapProduct).filter((product: Product) => product.stockQuantity <= product.minStock);
        const nextAlerts: StockAlert[] = mapped.map((product: Product) => ({ product, kind: "bajo_stock" }));

        if (isMounted) setAlerts(nextAlerts);
      } catch (error) {
        console.error("Error al cargar alertas del inventario:", error);
        if (isMounted) setAlerts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadAlerts();

    return () => {
      isMounted = false;
    };
  }, []);

  const visible = alerts.slice(0, limit);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-warning-500" />
          Alertas de Inventario
          {alerts.length > 0 && <Badge variant="danger">{alerts.length}</Badge>}
        </CardTitle>
        <Link href="/app/stock" className="text-xs font-semibold text-brand-600">
          Ver todas
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-ink-400">Cargando alertas…</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-ink-400">Todo tu inventario está en niveles óptimos.</p>
        ) : (
          visible.map((alert) => (
            <div key={`${alert.kind}-${alert.product.id}`}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-ink-800">{alert.product.name}</span>
                <span className="text-xs text-ink-400">{alert.product.stockQuantity} unidades</span>
              </div>
              <Progress value={stockPercentage(alert.product)} className="mt-1.5 h-2" indicatorClassName="bg-danger-500" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
