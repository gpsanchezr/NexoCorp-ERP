"use client";

import { useEffect, useState } from "react";
import { Plus, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageUploader } from "@/components/shared/image-uploader";
import { getSectorMarginLabel, suggestSalePrice } from "@/lib/utils";
import type { SafetyFlag, SectorKey } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

const FLAG_OPTIONS: { value: SafetyFlag; label: string; group: "peligro" | "sensible" }[] = [
  { value: "toxico", label: "Tóxico", group: "peligro" },
  { value: "quimico", label: "Químico", group: "peligro" },
  { value: "alimento", label: "Alimento", group: "sensible" },
  { value: "medicamento", label: "Medicamento", group: "sensible" },
];

export function AddProductDialog({ businessId, sector, onProductAdded }: { businessId: string; sector: string; onProductAdded: () => void }) {
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [conflict, setConflict] = useState<{ conflictingProduct?: { name: string } } | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [salePriceTouched, setSalePriceTouched] = useState(false);
  const [stockQuantity, setStockQuantity] = useState("");
  const [minStock, setMinStock] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [flags, setFlags] = useState<SafetyFlag[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const suggested = costPrice ? suggestSalePrice(Number(costPrice), sector as SectorKey) : 0;

  useEffect(() => {
    if (!salePriceTouched && suggested) setSalePrice(String(suggested));
  }, [suggested, salePriceTouched]);

  function toggleFlag(flag: SafetyFlag) {
    setFlags((prev) => (prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]));
  }

  function resetForm() {
    setName("");
    setCategory("");
    setCostPrice("");
    setSalePrice("");
    setSalePriceTouched(false);
    setStockQuantity("");
    setMinStock("");
    setExpirationDate("");
    setImageUrl(null);
    setFlags([]);
    setErrorMessage("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setIsSaving(true);

    try {
      const { error } = await supabase.from("products").insert({
        business_id: businessId,
        name: name.trim(),
        description: null,
        price: Number(salePrice) || suggested,
        cost: Number(costPrice) || 0,
        stock: Number(stockQuantity) || 0,
        min_stock: Number(minStock) || 5,
        category: category.trim() || "Sin categoría",
        barcode: null,
        image_url: imageUrl,
        expiration_date: expirationDate || null,
        safety_flags: JSON.stringify(flags || []),
      });

      if (error) throw error;
      resetForm();
      setOpen(false);
      onProductAdded();
    } catch (error: unknown) {
      console.error("Error al guardar producto:", error);
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar el producto.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4" />
            Agregar producto
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogTitle>Nuevo producto</DialogTitle>
          <DialogDescription>Se agrega a tu inventario y queda disponible para vender de inmediato.</DialogDescription>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Nombre</Label>
              <Input id="p-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Alcohol Antiséptico" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-category">Categoría</Label>
              <Input id="p-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ej. Cuidado personal" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-cost">Precio de costo</Label>
                <Input
                  id="p-cost"
                  inputMode="numeric"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="3000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-sale">Precio de venta</Label>
                <Input
                  id="p-sale"
                  inputMode="numeric"
                  value={salePrice}
                  onChange={(e) => {
                    setSalePriceTouched(true);
                    setSalePrice(e.target.value);
                  }}
                  placeholder="6000"
                />
              </div>
            </div>

            {!!suggested && !salePriceTouched && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-brand-600">
                <Sparkles className="h-3.5 w-3.5" />
                Sugerencia para tu sector: margen del {getSectorMarginLabel(sector as SectorKey)} (editable)
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-stock">Stock inicial</Label>
                <Input id="p-stock" inputMode="numeric" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} placeholder="20" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-min">Stock mínimo</Label>
                <Input id="p-min" inputMode="numeric" value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-exp">Fecha de vencimiento (opcional)</Label>
              <Input id="p-exp" type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Imagen del producto</Label>
              <ImageUploader businessId={businessId} value={imageUrl} onChange={setImageUrl} />
              <div className="space-y-1.5">
                <Label htmlFor="p-image-url">URL de imagen (opcional)</Label>
                <Input
                  id="p-image-url"
                  type="url"
                  value={imageUrl ?? ""}
                  onChange={(event) => setImageUrl(event.target.value.trim() || null)}
                  placeholder="https://ejemplo.com/producto.jpg"
                />
                <p className="text-xs text-ink-400">Puedes pegar una URL pública o subir una foto desde tu equipo.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Etiquetas de seguridad</Label>
              <div className="flex flex-wrap gap-2">
                {FLAG_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => toggleFlag(opt.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      flags.includes(opt.value)
                        ? opt.group === "peligro"
                          ? "border-danger-500 bg-danger-50 text-danger-600"
                          : "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-ink-200 text-ink-500"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-ink-400">
                Marca &ldquo;Tóxico&rdquo; o &ldquo;Químico&rdquo; para productos de aseo/peligrosos — el sistema bloqueará mezclarlos con alimentos o medicamentos.
              </p>
            </div>

            {errorMessage ? <p className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">{errorMessage}</p> : null}

            <Button type="submit" className="w-full" size="lg" disabled={isSaving || !name.trim()}>
              {isSaving ? "Guardando..." : "Guardar producto"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!conflict} onOpenChange={(o) => !o && setConflict(null)}>
        <DialogContent hideClose>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-50 text-danger-600">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <DialogTitle className="mt-4 text-danger-700">Alerta Sanitaria</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-ink-600">
              No puedes almacenar <span className="font-semibold text-ink-900">{name || "este producto"}</span> junto
              a <span className="font-semibold text-ink-900">{conflict?.conflictingProduct?.name}</span>. Riesgo de
              contaminación cruzada entre químicos y alimentos o medicamentos.
            </DialogDescription>
            <Button className="mt-5 w-full" variant="danger" onClick={() => setConflict(null)}>
              Entiendo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
