"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";

interface ImportExcelDialogProps {
  businessId: string;
  onProductsImported: () => void;
}

type CsvProductRow = {
  nombre?: string;
  name?: string;
  descripcion?: string;
  description?: string;
  categoria?: string;
  category?: string;
  precio?: string | number;
  price?: string | number;
  costo?: string | number;
  cost?: string | number;
  stock?: string | number;
};

const normalizeKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const parseNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[$.\s]/g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export function ImportExcelDialog({ businessId, onProductsImported }: ImportExcelDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setStatus("idle");
    setMessage("");

    try {
      const parsed = await new Promise<Papa.ParseResult<Record<string, string>>>( (resolve, reject) => {
        Papa.parse<Record<string, string>>(file, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => normalizeKey(header),
          complete: (results) => resolve(results),
          error: (error) => reject(error),
        });
      });

      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        throw new Error("El archivo CSV no tiene filas válidas para importar.");
      }

      const normalizedProducts = parsed.data
        .map((row) => {
          const normalizedRow = Object.entries(row).reduce<Record<string, unknown>>((acc, [key, value]) => {
            acc[normalizeKey(key)] = value;
            return acc;
          }, {});

          const name = String(normalizedRow.nombre ?? normalizedRow.name ?? "").trim();
          const description = String(normalizedRow.descripcion ?? normalizedRow.description ?? "").trim();
          const category = String(normalizedRow.categoria ?? normalizedRow.category ?? "Sin categoría").trim() || "Sin categoría";
          const price = parseNumber(normalizedRow.precio ?? normalizedRow.price ?? 0);
          const cost = parseNumber(normalizedRow.costo ?? normalizedRow.cost ?? 0);
          const stock = parseNumber(normalizedRow.stock ?? 0);

          if (!name) return null;

          return {
            business_id: businessId,
            name,
            description: description || null,
            category,
            price,
            cost,
            stock: Math.max(0, Number(stock) || 0),
            sale_price: price,
            cost_price: cost,
            stock_quantity: Math.max(0, Number(stock) || 0),
            min_stock: 5,
            barcode: null,
            image_url: null,
            expiration_date: null,
            safety_flags: [],
          };
        })
        .filter(Boolean) as Array<Record<string, unknown>>;

      if (normalizedProducts.length === 0) {
        throw new Error("No se encontraron filas válidas en el CSV. Revisa las columnas: Nombre, Descripción, Categoría, Precio, Costo y Stock.");
      }

      const supabase = createClient();
      const { error } = await supabase.from("products").insert(normalizedProducts);
      if (error) throw error;

      setStatus("success");
      setMessage(`Se importaron ${normalizedProducts.length} productos correctamente.`);
      setOpen(true);
      onProductsImported();
    } catch (error: unknown) {
      console.error("Error importando CSV:", error);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No se pudo importar el archivo.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogTitle>Importación masiva de inventario</DialogTitle>
        <DialogDescription>
          Sube un archivo CSV con las columnas Nombre, Descripción, Categoría, Precio, Costo y Stock.
        </DialogDescription>

        <div className="mt-5 space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-ink-50 px-4 py-8 text-center transition-colors hover:border-brand-300 hover:bg-brand-50">
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-800">Selecciona un archivo CSV</p>
              <p className="mt-1 text-xs text-ink-500">El archivo se valida y se inserta en lote en Supabase.</p>
            </div>
            <Button type="button" variant="secondary" className="pointer-events-none gap-2" disabled={isImporting}>
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isImporting ? "Importando…" : "Elegir archivo"}
            </Button>
          </label>

          {status !== "idle" && (
            <div
              className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
                status === "success"
                  ? "border-success-200 bg-success-50 text-success-700"
                  : "border-danger-200 bg-danger-50 text-danger-700"
              }`}
            >
              {status === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertCircle className="mt-0.5 h-4 w-4" />}
              <span>{message}</span>
            </div>
          )}

          <div className="rounded-xl border border-ink-100 bg-white p-3 text-xs text-ink-500">
            <p className="font-semibold text-ink-700">Formato recomendado</p>
            <p className="mt-1">Nombre, Descripción, Categoría, Precio, Costo, Stock</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
