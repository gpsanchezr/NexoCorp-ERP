"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, PackageOpen, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SanitaryBanner } from "@/components/shared/sanitary-banner";
import { AddProductDialog } from "@/components/dashboard/add-product-dialog";
import { ImportExcelDialog } from "@/components/dashboard/import-excel-dialog";
import { getSanitaryConflicts, getStockAlerts, stockPercentage } from "@/lib/alerts";
import { getSector } from "@/lib/config";
import { cn, daysUntil, formatCOP, formatDate } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import type { Product, SafetyFlag, SectorKey } from "@/lib/types";

type ProductRow = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price?: number;
  cost?: number;
  stock?: number;
  sale_price?: number;
  cost_price?: number;
  stock_quantity?: number;
  min_stock: number;
  category: string;
  barcode: string | null;
  image_url: string | null;
  expiration_date: string | null;
  safety_flags: SafetyFlag[] | null;
};

type ProfileContext = { businessId: string; businessName: string; sector: string; role: "owner" | "cashier" };

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
    stockQuantity: Number(row.stock ?? row.stock_quantity ?? 0),
    minStock: Number(row.min_stock),
    barcode: row.barcode ?? undefined,
    expirationDate: row.expiration_date ?? undefined,
    image_url: row.image_url ?? null,
    safetyFlags: Array.isArray(parsedSafetyFlags) ? parsedSafetyFlags : [],
  };
}

export default function StockPage() {
  const supabase = useMemo(() => createClient(), []);
  const [context, setContext] = useState<ProfileContext | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("business_id, role")
        .eq("id", user.id)
        .single();
      if (profileError) {
        console.error("Error de Supabase en profiles:", profileError);
        throw profileError;
      }
      if (!profile?.business_id) throw new Error("No encontramos un negocio asociado a tu usuario.");

      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", profile.business_id)
        .single();
      if (businessError) {
        console.error("Error de Supabase en businesses:", businessError);
        throw businessError;
      }

      setContext({
        businessId: profile.business_id,
        businessName: business?.business_name || business?.name || "Tu negocio",
        sector: business?.business_type || business?.sector || "otro",
        role: profile.role === "owner" ? "owner" : "cashier",
      });

      const { data: rows, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("business_id", profile.business_id)
        .order("created_at", { ascending: false });
      if (productsError) {
        console.error("Error de Supabase:", productsError);
        throw productsError;
      }

      setProducts((rows as ProductRow[]).map(mapProduct));
    } catch (error: unknown) {
      console.error("Error al cargar inventario:", error);
      setErrorMessage(error instanceof Error ? error.message : "No se pudo cargar tu inventario.");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const sector = getSector((context?.sector || "otro") as SectorKey);
  const alerts = useMemo(() => getStockAlerts(products), [products]);
  const conflicts = useMemo(() => getSanitaryConflicts(products), [products]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) => product.name.toLowerCase().includes(normalized) || product.category.toLowerCase().includes(normalized));
  }, [products, query]);

  if (isLoading) {
    return <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6"><div className="h-8 w-48 animate-pulse rounded bg-ink-100" /><div className="h-24 animate-pulse rounded-2xl bg-ink-100" /><div className="h-64 animate-pulse rounded-2xl bg-ink-100" /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/app/mobile" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 md:hidden"><ChevronLeft className="h-5 w-5" /></Link>
          <div><h1 className="text-xl font-bold text-ink-900">Inventario</h1><p className="text-xs text-ink-400">{products.length} productos en {context?.businessName || "Tu negocio"} · {sector.label}</p></div>
        </div>
        {context?.role === "owner" && context.businessId ? (
          <div className="flex items-center gap-2">
            <AddProductDialog businessId={context.businessId} sector={context.sector} onProductAdded={() => void loadInventory()} />
            <ImportExcelDialog businessId={context.businessId} onProductsImported={() => void loadInventory()} />
          </div>
        ) : null}
      </div>

      {errorMessage ? (
        <Card className="border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">{errorMessage}</Card>
      ) : products.length === 0 ? (
        <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <PackageOpen className="h-12 w-12 text-ink-300" />
          <h2 className="mt-4 text-lg font-semibold text-ink-800">Tu inventario está vacío. Agrega tu primer producto.</h2>
          <p className="mt-2 text-sm text-ink-500">Los productos que registres aparecerán aquí y estarán disponibles para vender.</p>
        </Card>
      ) : (
        <>
          <div className="mb-6 space-y-4">
            <SanitaryBanner conflicts={conflicts} />
            {alerts.length > 0 ? <Card><CardHeader><CardTitle>Alertas de Desabastecimiento y Vencimientos</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{alerts.map((alert) => <div key={`${alert.kind}-${alert.product.id}`} className="rounded-xl border border-ink-100 p-3.5"><div className="flex items-center justify-between text-sm"><span className="font-semibold text-ink-800">{alert.product.name}</span><Badge variant={alert.kind === "bajo_stock" ? "danger" : (alert.daysToExpire ?? 0) < 0 ? "danger" : "warning"}>{alert.kind === "bajo_stock" ? "Bajo stock" : (alert.daysToExpire ?? 0) < 0 ? "Vencido" : `Vence en ${alert.daysToExpire}d`}</Badge></div>{alert.kind === "bajo_stock" ? <Progress value={stockPercentage(alert.product)} className="mt-2 h-2" indicatorClassName="bg-danger-500" /> : null}</div>)}</CardContent></Card> : null}
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3"><CardTitle>Todos los productos</CardTitle><div className="relative w-48 sm:w-64"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" /><Input className="h-9 pl-8 text-sm" placeholder="Buscar…" value={query} onChange={(event) => setQuery(event.target.value)} /></div></CardHeader>
            <CardContent>
              <Table><TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>Categoría</TableHead><TableHead>Costo</TableHead><TableHead>Venta</TableHead><TableHead>Stock</TableHead>{sector.showsExpirationInDays ? <TableHead>Vencimiento</TableHead> : null}</TableRow></TableHeader><TableBody>
                {filtered.map((product) => { const days = product.expirationDate ? daysUntil(product.expirationDate) : null; return <TableRow key={product.id}><TableCell><p className="font-medium text-ink-800">{product.name}</p>{product.safetyFlags.length > 0 ? <div className="mt-1 flex gap-1">{product.safetyFlags.map((flag) => <Badge key={flag} variant={flag === "toxico" || flag === "quimico" ? "danger" : "brand"} className="px-1.5 py-0 text-[10px]">{flag}</Badge>)}</div> : null}</TableCell><TableCell className="text-ink-500">{product.category}</TableCell><TableCell className="text-ink-500">{formatCOP(product.costPrice)}</TableCell><TableCell className="font-medium">{formatCOP(product.salePrice)}</TableCell><TableCell><div className="flex items-center gap-2"><span className={cn("font-medium", product.stockQuantity <= product.minStock && "text-danger-600")}>{product.stockQuantity}</span><Progress value={stockPercentage(product)} className="h-1.5 w-14" indicatorClassName={product.stockQuantity <= product.minStock ? "bg-danger-500" : "bg-success-500"} /></div></TableCell>{sector.showsExpirationInDays ? <TableCell>{product.expirationDate ? <span className={cn(days !== null && days <= 30 && "font-medium text-warning-600", days !== null && days < 0 && "text-danger-600")}>{formatDate(product.expirationDate)}</span> : <span className="text-ink-300">—</span>}</TableCell> : null}</TableRow>; })}
              </TableBody></Table>
              {filtered.length === 0 ? <p className="py-8 text-center text-sm text-ink-400">No encontramos productos con ese filtro.</p> : null}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
