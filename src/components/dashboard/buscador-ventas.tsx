"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { formatCOP, formatDate } from "@/lib/utils";
import type { Sale } from "@/lib/types";

type SaleRow = {
  id: string;
  business_id: string;
  receipt_number: string;
  customer_id?: string | null;
  total_amount?: number | string | null;
  created_at?: string | null;
  created_offline?: boolean | null;
};

function mapSale(row: SaleRow): Sale {
  return {
    id: row.id,
    businessId: row.business_id,
    receiptNumber: row.receipt_number,
    customerId: row.customer_id ?? undefined,
    customer: undefined,
    items: [],
    discountType: "none",
    discountValue: 0,
    subtotal: Number(row.total_amount ?? 0),
    totalAmount: Number(row.total_amount ?? 0),
    createdAt: row.created_at ?? new Date().toISOString(),
    createdOffline: Boolean(row.created_offline),
  };
}

function exportSalesToCsv(sales: Sale[]) {
  const header = "Recibo,Cliente,Cedula,Total,Fecha\n";
  const rows = sales
    .map((s) => [s.receiptNumber, s.customer?.name ?? "Consumidor final", s.customer?.cedulaNit ?? "", s.totalAmount, formatDate(s.createdAt)].join(","))
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ventas-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function BuscadorVentas() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSales() {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (isMounted) setSales([]);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("business_id")
          .eq("id", user.id)
          .single();

        if (profileError || !profile?.business_id) {
          if (isMounted) setSales([]);
          return;
        }

        const { data: rows, error: salesError } = await supabase
          .from("sales")
          .select("*")
          .eq("business_id", profile.business_id)
          .order("created_at", { ascending: false });

        if (salesError) {
          console.error("Error cargando ventas:", salesError);
          if (isMounted) setSales([]);
          return;
        }

        if (isMounted) setSales((rows ?? []).map(mapSale));
      } catch (error) {
        console.error("Error al cargar ventas:", error);
        if (isMounted) setSales([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadSales();

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return sales;
    const q = query.trim().toLowerCase();
    return sales.filter(
      (s) => s.receiptNumber.toLowerCase().includes(q) || formatDate(s.createdAt).toLowerCase().includes(q)
    );
  }, [sales, query]);

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Últimas Ventas</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <Input
              className="h-9 pl-8 text-sm"
              placeholder="Buscar recibo o fecha…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => exportSalesToCsv(filtered)}
            disabled={filtered.length === 0}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-success-500 px-3 text-xs font-semibold text-white hover:bg-success-600 disabled:cursor-not-allowed disabled:bg-ink-200"
          >
            <Download className="h-3.5 w-3.5" />
            Últimos 30 d/Excel
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-8 text-center text-sm text-ink-400">Cargando ventas…</p>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-ink-200 bg-ink-50 px-4 text-center text-sm text-ink-400">
            Aún no has registrado ninguna venta.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead># Recibo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 12).map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium text-ink-800">{sale.receiptNumber}</TableCell>
                  <TableCell>{sale.customer?.name ?? "Consumidor final"}</TableCell>
                  <TableCell className="font-semibold">{formatCOP(sale.totalAmount)}</TableCell>
                  <TableCell>{formatDate(sale.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={sale.createdOffline ? "warning" : "success"}>
                      {sale.createdOffline ? "Sincronizada" : "Completada"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
