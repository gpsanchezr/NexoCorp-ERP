"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, RefreshCcw, UploadCloud } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";

type SheetStatus = "pending" | "processing" | "success" | "error";
type ParsedWorkbook = Record<string, unknown[]>;

type SheetImportTarget = {
  table: string;
  mapper: (rows: unknown[], businessId: string, sheetName?: string) => Array<Record<string, unknown>>;
};

const DEFAULT_SHEET_ORDER = ["Inventario", "Clientes", "Proveedores", "Distribuidores", "Fiados_Creditos", "Gastos_Costos", "Ventas", "Detalle_Ventas"] as const;

const normalizeText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const toIsoDateTime = (value: unknown): string | undefined => {
  const numericValue = typeof value === "number" ? value : Number(normalizeText(value));
  if (Number.isFinite(numericValue) && numericValue >= 1 && numericValue <= 2958465) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    const date = new Date(excelEpoch + Math.floor(numericValue * 86_400_000));
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  const text = normalizeText(value);
  if (!text) return undefined;

  const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const date = new Date(Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])));
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  const latinMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (latinMatch) {
    const date = new Date(Date.UTC(Number(latinMatch[3]), Number(latinMatch[2]) - 1, Number(latinMatch[1])));
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const toIsoDate = (value: unknown): string | null => toIsoDateTime(value)?.slice(0, 10) ?? null;

const normalizeKey = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[$.\s]/g, "").replace(",", ".");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toSafeNumber = (value: unknown, fallback = 0): number => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const normalizeUuid = (value: unknown): string | null => {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  return uuidPattern.test(trimmed) ? trimmed : null;
};

const pickField = (record: Record<string, unknown>, aliases: string[]): unknown => {
  const normalizedAliases = aliases.map((alias) => normalizeKey(alias));

  for (const [key, value] of Object.entries(record)) {
    const normalizedKey = normalizeKey(key);
    const isMatch = normalizedAliases.some(
      (alias) => normalizedKey === alias || normalizedKey.includes(alias) || alias.includes(normalizedKey)
    );

    if (isMatch && value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }

  return undefined;
};

const toOptionalString = (record: Record<string, unknown>, aliases: string[]): string | null => {
  const found = pickField(record, aliases);
  return found === undefined ? null : normalizeText(found) || null;
};

const toOptionalNumber = (record: Record<string, unknown>, aliases: string[], fallback = 0): number => {
  const found = pickField(record, aliases);
  return found === undefined ? fallback : toNumber(found);
};

const sanitizeGenericRows = (rows: unknown[], businessId: string, sheetName = "Sin nombre"): Array<Record<string, unknown>> =>
  rows.map((row, rowIndex) => ({
    business_id: businessId,
    sheet_name: normalizeText(sheetName) || "Sin nombre",
    row_number: rowIndex + 2,
    row_data: row && typeof row === "object" ? row : { value: normalizeText(row) },
  }));

const sanitizeInventoryRows = (rows: unknown[], businessId: string): Array<Record<string, unknown>> =>
  rows
    .map((row) => {
      const record = row as Record<string, unknown>;
      const name = normalizeText(
        pickField(record, ["nombre_producto", "nombre", "producto", "name", "producto_nombre", "descripcion_corta"]) ?? ""
      );
      if (!name) return null;

      const sku = pickField(record, ["sku", "codigo", "codigo_producto", "barcode", "codigo_barras"]);
      const category = pickField(record, ["categoria", "category", "departamento", "linea", "tipo"]);
      const description = pickField(record, ["descripcion", "description", "detalle", "descripcion_producto"]);
      const price = pickField(record, ["precio_venta", "precio", "venta", "sale_price", "unit_price", "precio_unitario"]);
      const cost = pickField(record, ["costo_unitario", "costo", "cost", "precio_compra", "compra"]);
      const stock = pickField(record, ["stock_actual", "stock", "cantidad", "inventario", "disponible"]);
      const minStock = pickField(record, ["min_stock", "stock_minimo", "minimo_stock", "inventario_minimo"]);

      const normalizedRecord: Record<string, unknown> = {
        business_id: businessId,
        name: name || "Producto sin nombre",
        sku: sku !== undefined && sku !== null && String(sku).trim() !== "" ? String(sku).trim() : null,
        category: category !== undefined && category !== null && String(category).trim() !== "" ? String(category).trim() : null,
        description: description !== undefined && description !== null && String(description).trim() !== "" ? String(description).trim() : null,
        price: toNumber(price) || 0,
        cost: toNumber(cost) || 0,
        stock: toNumber(stock) || 0,
        min_stock: toNumber(minStock) || 0,
      };

      Object.entries(normalizedRecord).forEach(([keyName, value]) => {
        if (keyName.endsWith("_id") && (value === "" || value === undefined)) {
          normalizedRecord[keyName] = null;
        }
      });

      return normalizedRecord;
    })
    .filter(Boolean) as Array<Record<string, unknown>>;

const resolveTarget = (sheetName: string): SheetImportTarget => {
  const key = normalizeKey(sheetName);

  if (["movimientos_inventario", "detalle_compras", "devoluciones", "returns"].includes(key)) {
    return {
      table: "excel_import_rows",
      mapper: (rows, businessId, currentSheetName) => sanitizeGenericRows(rows, businessId, currentSheetName),
    };
  }

  if (key === "inventario") {
    return {
      table: "products",
      mapper: (rows, businessId) => sanitizeInventoryRows(rows, businessId),
    };
  }

  if (key === "clientes") {
    return {
      table: "customers",
      mapper: (rows, businessId) =>
        rows
          .map((row) => {
            const record = row as Record<string, unknown>;
            const fullName = normalizeText(
              pickField(record, ["nombre_completo", "nombre", "full_name", "name", "cliente", "nombre_cliente", "persona"]) ?? ""
            );
            if (!fullName) return null;

            return {
              business_id: businessId,
              full_name: fullName,
              phone: toOptionalString(record, ["telefono", "phone", "telefono_1", "celular", "movil", "whatsapp"]) || null,
              email: toOptionalString(record, ["email", "correo", "correo_electronico", "mail"]) || null,
              city: toOptionalString(record, ["ciudad", "city", "localidad", "municipio"]) || null,
              category: toOptionalString(record, ["categoria_cliente", "categoria", "category", "segmento", "tipo_cliente"]) || null,
            };
          })
          .filter(Boolean) as Array<Record<string, unknown>>,
    };
  }

  if (key === "proveedores" || key === "distribuidores") {
    return {
      table: "suppliers",
      mapper: (rows, businessId) =>
        rows
          .map((row) => {
            const record = row as Record<string, unknown>;
            const companyName = normalizeText(
              pickField(record, ["nombre_empresa", "empresa", "razon_social", "proveedor", "distribuidor", "company_name", "name"]) ?? ""
            );
            if (!companyName) return null;

            return {
              business_id: businessId,
              company_name: companyName,
              contact_name: toOptionalString(record, ["contacto", "nombre_contacto", "responsable", "persona_contacto", "contact_name"]) || null,
              phone: toOptionalString(record, ["telefono", "phone", "celular", "movil", "whatsapp"]) || null,
              conditions: toOptionalString(record, ["condiciones", "terminos", "conditions", "forma_pago"]) || null,
            };
          })
          .filter(Boolean) as Array<Record<string, unknown>>,
    };
  }

  if (key === "fiados_creditos") {
    return {
      table: "fiados_cuaderno",
      mapper: (rows, businessId) =>
        rows
          .map((row) => {
            const record = row as Record<string, unknown>;
            const clientName = normalizeText(
              pickField(record, ["nombre_cliente", "cliente", "nombre_completo", "client_name", "persona", "deudor"]) ?? ""
            );
            if (!clientName) return null;

            return {
              business_id: businessId,
              client_name: clientName,
              concept: toOptionalString(record, ["concepto", "concept", "descripcion", "detalle", "motivo"]) || null,
              total_amount: toOptionalNumber(record, ["total_amount", "total", "monto_total", "monto", "amount", "valor_total"], 0),
              balance_due: toOptionalNumber(record, ["balance_due", "saldo", "saldo_pendiente", "pendiente", "monto_pendiente"], 0),
              due_date: toOptionalString(record, ["date", "fecha_vencimiento", "vencimiento", "fecha_limite", "due_date"]) || null,
            };
          })
          .filter(Boolean) as Array<Record<string, unknown>>,
    };
  }

  if (key === "gastos_costos") {
    return {
      table: "operating_expenses",
      mapper: (rows, businessId) =>
        rows
          .map((row) => {
            const record = row as Record<string, unknown>;
            const expenseType = toOptionalString(record, ["tipo_gasto", "gasto", "tipo", "expense_type", "category", "categoria"]) || "General";
            const description = toOptionalString(record, ["descripcion", "description", "detalle", "concepto"]) || null;
            if (!expenseType && !description) return null;

            return {
              business_id: businessId,
              expense_type: expenseType,
              description,
              amount: toOptionalNumber(record, ["amount", "monto", "valor", "total", "costo", "gasto_total"], 0),
              expense_date: toIsoDate(pickField(record, ["expense_date", "fecha", "fecha_gasto", "fecha_registro"])),
            };
          })
          .filter(Boolean) as Array<Record<string, unknown>>,
    };
  }

  if (key === "ventas") {
    return {
      table: "sales",
      mapper: (rows, businessId) =>
        rows
          .map((row) => {
            const record = row as Record<string, unknown>;
            const receiptNumber = normalizeText(
              pickField(record, ["id_factura", "numero_factura", "factura", "receipt_number", "invoice_id", "factura_numero", "nro_factura"]) ?? ""
            );
            if (!receiptNumber) return null;

            const customerId = normalizeUuid(pickField(record, ["customer_id", "cliente_id", "id_cliente", "customer"])) ?? null;
            const subtotal = toSafeNumber(toOptionalNumber(record, ["subtotal", "base", "total_sin_iva", "valor_base", "monto_base"], 0), 0);
            const totalAmount = toSafeNumber(toOptionalNumber(record, ["total_amount", "total", "total_venta", "grand_total", "monto_total"], 0), 0);
            const discountValue = toSafeNumber(toOptionalNumber(record, ["discount_value", "descuento", "valor_descuento", "valor_descuento_total"], 0), 0);

            return {
              business_id: businessId,
              receipt_number: receiptNumber,
              customer_id: customerId,
              subtotal,
              total_amount: totalAmount,
              discount_type: toOptionalString(record, ["tipo_descuento", "discount_type", "descuento_tipo"]) || "none",
              discount_value: discountValue,
              created_offline: false,
              created_at: toIsoDateTime(pickField(record, ["fecha", "date", "fecha_venta", "sale_date", "created_at"])) ?? undefined,
            };
          })
          .filter(Boolean) as Array<Record<string, unknown>>,
    };
  }

  if (key === "detalle_ventas") {
    return {
      table: "sales_details",
      mapper: (rows, businessId) =>
        rows
          .map((row) => {
            const record = row as Record<string, unknown>;
            const productName = normalizeText(
              pickField(record, ["nombre_producto", "producto", "name", "product_name", "sku", "codigo_producto"]) ?? ""
            );
            const quantity = Math.max(0, Math.round(toOptionalNumber(record, ["cantidad", "qty", "quantity", "unidades"], 0)));
            if (!productName || quantity === 0) return null;

            const saleId = normalizeUuid(pickField(record, ["sale_id", "venta_id", "id_venta"])) ?? null;
            const unitPrice = toSafeNumber(toOptionalNumber(record, ["precio_unitario", "unit_price", "precio", "price"], 0), 0);
            const subtotal = toSafeNumber(toOptionalNumber(record, ["subtotal", "total", "monto", "importe"], 0), 0);

            return {
              business_id: businessId,
              sale_id: saleId,
              product_name: productName,
              quantity,
              unit_price: unitPrice,
              subtotal,
            };
          })
          .filter(Boolean) as Array<Record<string, unknown>>,
    };
  }

  if (key === "compras") {
    return {
      table: "purchases",
      mapper: (rows, businessId) =>
        rows
          .map((row) => {
            const record = row as Record<string, unknown>;
            const supplierName = normalizeText(
              pickField(record, ["proveedor", "supplier", "nombre_proveedor", "empresa", "company_name", "supplier_name"]) ?? ""
            );
            if (!supplierName) return null;

            return {
              business_id: businessId,
              supplier_name: supplierName,
              invoice_number: toOptionalString(record, ["numero_factura", "invoice_number", "factura", "nro_factura"]) || null,
              total_amount: toSafeNumber(toOptionalNumber(record, ["total", "total_amount", "monto_total", "amount", "valor_total"], 0), 0),
              date: toIsoDate(pickField(record, ["fecha", "date", "fecha_compra", "purchase_date"])),
              status: toOptionalString(record, ["estado", "status", "estado_compra"]) || "completed",
            };
          })
          .filter(Boolean) as Array<Record<string, unknown>>,
    };
  }

  if (key === "detalle_compras") {
    return {
      table: "purchase_details",
      mapper: (rows, businessId) =>
        rows
          .map((row) => {
            const record = row as Record<string, unknown>;
            const productName = normalizeText(
              pickField(record, [
                "producto",
                "product",
                "product_name",
                "nombre_producto",
                "nombre del producto",
                "item",
                "articulo",
                "artículo",
                "name",
              ]) ?? ""
            );
            const quantity = Math.max(
              0,
              Math.round(toOptionalNumber(record, ["cantidad", "quantity", "qty", "unidades", "cantidad comprada", "units"], 0))
            );
            if (!productName || quantity === 0) return null;

            return {
              business_id: businessId,
              product_name: productName,
              quantity,
              unit_cost: toSafeNumber(
                toOptionalNumber(record, ["costo", "cost", "costo_unitario", "unit_cost", "precio_unitario", "precio compra", "price"], 0),
                0
              ),
              subtotal: toSafeNumber(
                toOptionalNumber(record, ["subtotal", "total", "monto", "importe", "total linea", "total línea", "line_total"], 0),
                0
              ),
              purchase_id: toOptionalString(record, ["purchase_id", "compra_id", "id_compra", "purchase", "numero_compra", "compra"]) || null,
            };
          })
          .filter(Boolean) as Array<Record<string, unknown>>,
    };
  }

  if (key === "movimientos_inventario") {
    return {
      table: "inventory_movements",
      mapper: (rows, businessId) =>
        rows
          .map((row) => {
            const record = row as Record<string, unknown>;
            const productName = normalizeText(
              pickField(record, [
                "producto",
                "product",
                "product_name",
                "nombre_producto",
                "nombre del producto",
                "articulo",
                "artículo",
                "item",
                "name",
              ]) ?? ""
            );
            if (!productName) return null;

            return {
              business_id: businessId,
              product_name: productName,
              type: toOptionalString(record, ["tipo", "type", "movimiento", "movement_type"]) || "ajuste",
              quantity: toSafeNumber(toOptionalNumber(record, ["cantidad", "quantity", "qty", "unidades", "cantidad movimiento", "units"], 0), 0),
              unit_cost: toSafeNumber(toOptionalNumber(record, ["costo", "cost", "costo_unitario", "unit_cost", "precio_unitario", "price"], 0), 0),
              total_amount: toSafeNumber(
                toOptionalNumber(record, ["total", "total_amount", "monto_total", "amount", "valor_total", "valor", "importe"], 0),
                0
              ),
              date: toOptionalString(record, ["fecha", "date", "fecha_movimiento", "movement_date", "fecha movimiento"]) || null,
              notes: toOptionalString(record, ["observacion", "observation", "notas", "notes", "detalle"]) || null,
            };
          })
          .filter(Boolean) as Array<Record<string, unknown>>,
    };
  }

  if (key === "movimientos_caja") {
    return {
      table: "cash_movements",
      mapper: (rows, businessId) =>
        rows
          .map((row) => {
            const record = row as Record<string, unknown>;
            const concept = normalizeText(
              pickField(record, ["concepto", "concept", "descripcion", "description", "detalle"]) ?? ""
            );
            if (!concept) return null;

            return {
              business_id: businessId,
              type: toOptionalString(record, ["tipo", "type", "movimiento", "movement_type"]) || "ingreso",
              concept,
              amount: toSafeNumber(toOptionalNumber(record, ["monto", "amount", "valor", "total", "importe"], 0), 0),
              date: toOptionalString(record, ["fecha", "date", "fecha_movimiento", "movement_date"]) || new Date().toISOString().slice(0, 10),
              reference: toOptionalString(record, ["referencia", "reference", "numero", "documento"]) || null,
            };
          })
          .filter(Boolean) as Array<Record<string, unknown>>,
    };
  }

  if (key === "presupuesto" || key === "budgets" || key === "budget") {
    return {
      table: "budgets",
      mapper: (rows, businessId) =>
        rows
          .map((row) => {
            const record = row as Record<string, unknown>;
            const category = normalizeText(
              pickField(record, ["categoria", "category", "concepto", "concept", "nombre"]) ?? ""
            );
            if (!category) return null;

            return {
              business_id: businessId,
              category,
              month: toOptionalString(record, ["mes", "month", "periodo", "period"]) || new Date().toISOString().slice(0, 7),
              planned_amount: toSafeNumber(toOptionalNumber(record, ["presupuesto", "planned_amount", "monto_planeado", "amount", "valor"], 0), 0),
              actual_amount: toSafeNumber(toOptionalNumber(record, ["real", "actual_amount", "monto_real", "actual"], 0), 0),
              notes: toOptionalString(record, ["observacion", "observation", "notas", "notes"]) || null,
            };
          })
          .filter(Boolean) as Array<Record<string, unknown>>,
    };
  }

  if (key === "devoluciones" || key === "returns") {
    return {
      table: "returns",
      mapper: (rows, businessId) =>
        rows
          .map((row) => {
            const record = row as Record<string, unknown>;
            const productName = normalizeText(
              pickField(record, [
                "producto",
                "product",
                "product_name",
                "nombre_producto",
                "nombre del producto",
                "articulo",
                "artículo",
                "item",
                "name",
              ]) ?? ""
            );
            if (!productName) return null;

            return {
              business_id: businessId,
              product_name: productName,
              return_code: toOptionalString(record, ["codigo", "code", "numero", "return_code", "devolucion", "id_devolucion", "return_id"]) || null,
              quantity: toSafeNumber(toOptionalNumber(record, ["cantidad", "quantity", "qty", "unidades", "cantidad devuelta", "units"], 0), 0),
              amount: toSafeNumber(toOptionalNumber(record, ["monto", "amount", "valor", "total", "importe", "valor devolución", "refund_amount"], 0), 0),
              reason: toOptionalString(record, ["motivo", "reason", "causa", "descripcion", "description", "detalle", "observacion", "observation"]) || null,
              date: toOptionalString(record, ["fecha", "date", "fecha_devolucion", "return_date"]) || null,
            };
          })
          .filter(Boolean) as Array<Record<string, unknown>>,
    };
  }

  if (key === "cuentas_por_pagar" || key === "accounts_payable") {
    return {
      table: "accounts_payable",
      mapper: (rows, businessId) =>
        rows
          .map((row) => {
            const record = row as Record<string, unknown>;
            const provider = normalizeText(
              pickField(record, ["proveedor", "provider", "nombre_proveedor", "empresa", "supplier_name"]) ?? ""
            );
            if (!provider) return null;

            return {
              business_id: businessId,
              provider_name: provider,
              invoice_number: toOptionalString(record, ["numero_factura", "invoice_number", "factura", "nro_factura"]) || null,
              due_date: toOptionalString(record, ["fecha_vencimiento", "due_date", "vencimiento", "fecha_limite"]) || null,
              amount: toSafeNumber(toOptionalNumber(record, ["monto", "amount", "valor", "total", "importe"], 0), 0),
              status: toOptionalString(record, ["estado", "status"]) || "pendiente",
            };
          })
          .filter(Boolean) as Array<Record<string, unknown>>,
    };
  }

  if (key === "empleados" || key === "employees") {
    return {
      table: "employees",
      mapper: (rows, businessId) =>
        rows
          .map((row) => {
            const record = row as Record<string, unknown>;
            const fullName = normalizeText(
              pickField(record, ["nombre", "full_name", "nombre_completo", "empleado", "name"]) ?? ""
            );
            if (!fullName) return null;

            return {
              business_id: businessId,
              full_name: fullName,
              document: toOptionalString(record, ["documento", "document", "cedula", "identificacion"]) || null,
              role: toOptionalString(record, ["cargo", "role", "rol", "puesto"]) || null,
              salary: toSafeNumber(toOptionalNumber(record, ["salario", "salary", "sueldo", "remuneracion"], 0), 0),
              phone: toOptionalString(record, ["telefono", "phone", "celular"]) || null,
              status: toOptionalString(record, ["estado", "status"]) || "activo",
            };
          })
          .filter(Boolean) as Array<Record<string, unknown>>,
    };
  }

  if (key === "kpis" || key === "kpi") {
    return {
      table: "kpis",
      mapper: (rows, businessId) =>
        rows
          .map((row) => {
            const record = row as Record<string, unknown>;
            const metricName = normalizeText(
              pickField(record, ["metrica", "metric", "nombre", "kpi", "indicador"]) ?? ""
            );
            if (!metricName) return null;

            return {
              business_id: businessId,
              metric_name: metricName,
              value: toSafeNumber(toOptionalNumber(record, ["valor", "value", "cantidad", "total"], 0), 0),
              unit: toOptionalString(record, ["unidad", "unit", "medida"]) || null,
              period: toOptionalString(record, ["periodo", "period", "mes", "date"]) || new Date().toISOString().slice(0, 7),
              notes: toOptionalString(record, ["observacion", "notes", "detalle", "descripcion"]) || null,
            };
          })
          .filter(Boolean) as Array<Record<string, unknown>>,
    };
  }

  return {
    table: "excel_import_rows",
    mapper: (rows, businessId, sheetName) => sanitizeGenericRows(rows, businessId, sheetName),
  };
};

export function ImportMasterDialog() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [parsedData, setParsedData] = useState<ParsedWorkbook>({});
  const [sheetStates, setSheetStates] = useState<Record<string, SheetStatus>>({});
  const [status, setStatus] = useState<"idle" | "reading" | "importing" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const detectedSheets = useMemo(
    () =>
      Object.keys(parsedData).map((sheetName) => ({
        name: sheetName,
        rows: parsedData[sheetName]?.length ?? 0,
        state: sheetStates[sheetName] ?? "pending",
      })),
    [parsedData, sheetStates]
  );

  const totalRows = useMemo(() => Object.values(parsedData).reduce((sum, rows) => sum + rows.length, 0), [parsedData]);

  const setSheetStatus = (sheetName: string, nextStatus: SheetStatus) => {
    setSheetStates((current) => ({ ...current, [sheetName]: nextStatus }));
  };

  async function getBusinessId(): Promise<string> {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Debes iniciar sesión para importar datos.");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("business_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile?.business_id) {
      throw new Error("No se encontró el negocio asociado a este usuario.");
    }

    return profile.business_id as string;
  }

  async function handleParsedWorkbook(fileName: string, workbook: XLSX.WorkBook) {
    const nextParsedData: ParsedWorkbook = {};
    const nextSheetStates: Record<string, SheetStatus> = {};

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      nextParsedData[sheetName] = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        raw: false,
      });
      nextSheetStates[sheetName] = "pending";
    });

    setSelectedFileName(fileName);
    setParsedData(nextParsedData);
    setSheetStates(nextSheetStates);
    setStatus("idle");
    setError(null);
    setProgress(0);
  }

  async function processFile(file: File) {
    setStatus("reading");
    setError(null);
    setProgress(10);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      await handleParsedWorkbook(file.name, workbook);
      setProgress(25);
    } catch (parseError) {
      console.error("Error leyendo el Excel:", parseError);
      setStatus("error");
      setError("No se pudo leer el archivo. Verifica que sea un archivo .xlsx válido.");
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    await processFile(file);
    event.target.value = "";
  }

  async function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    await processFile(file);
  }

  async function handleImportAll() {
    if (Object.keys(parsedData).length === 0) {
      setStatus("error");
      setError("Primero carga un archivo Excel válido para importar.");
      return;
    }

    try {
      setStatus("importing");
      setError(null);
      setProgress(10);

      const businessId = await getBusinessId();
      const supabase = createClient();
      const sheetNames = Object.keys(parsedData);
      let allSucceeded = true;

      for (let index = 0; index < sheetNames.length; index += 1) {
        const sheetName = sheetNames[index];
        const rows = parsedData[sheetName] ?? [];
        const target = resolveTarget(sheetName);

        if (rows.length === 0) {
          setSheetStatus(sheetName, "success");
          continue;
        }

        setSheetStatus(sheetName, "processing");
        const normalizedRows = target.mapper(rows, businessId, sheetName);

        if (normalizedRows.length === 0) {
          setSheetStatus(sheetName, "error");
          allSucceeded = false;
          continue;
        }

        try {
          const { error } = await supabase.from(target.table).insert(normalizedRows);
          if (error) {
            throw error;
          }
          setSheetStatus(sheetName, "success");
        } catch (sheetError) {
          const normalizedSheetName = normalizeKey(sheetName);
          if (["detalle_compras", "movimientos_inventario", "devoluciones", "returns"].includes(normalizedSheetName)) {
            console.error(`[Importación ${sheetName}] Error exacto de Supabase:`, sheetError);
          } else {
            console.error("Error en " + sheetName, sheetError);
          }
          setSheetStatus(sheetName, "error");
          allSucceeded = false;
        }

        const nextProgress = Math.min(90, 10 + Math.round(((index + 1) / Math.max(sheetNames.length, 1)) * 80));
        setProgress(nextProgress);
      }

      setProgress(100);

      if (allSucceeded) {
        setStatus("success");
        setError(null);
        router.refresh();
      } else {
        setStatus("error");
        setError("La importación terminó con errores en algunas hojas. Revisa el estado de cada una y corrige los datos antes de volver a intentar.");
      }
    } catch (importError) {
      console.error("Error general importando Excel maestro:", importError);
      setStatus("error");
      setError(importError instanceof Error ? importError.message : "No se pudo completar la importación.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Importar Excel Maestro</Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col overflow-hidden p-0">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-6 pb-0 pt-6">
            <DialogTitle>Importador dinámico de ecosistema</DialogTitle>
            <DialogDescription className="mt-1">
              Arrastra y suelta un archivo .xlsx o selecciónalo desde tu equipo. El sistema detecta todas las hojas del
              workbook, las mapea a Supabase y aplica aislamiento por negocio.
            </DialogDescription>
          </div>

          <div className="mt-5 flex-1 overflow-y-auto px-6 pr-4">
            <div className="space-y-5 pb-4">
              <label
                className={`group block cursor-pointer rounded-2xl border border-dashed p-5 transition-all ${
                  isDragActive
                    ? "border-brand-400 bg-brand-50 shadow-sm"
                    : "border-ink-200 bg-ink-50 hover:border-brand-300 hover:bg-brand-50/40"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragActive(true);
                }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink-800">Arrastra el Excel aquí o haz clic</p>
                      <p className="text-xs text-ink-500">Formato soportado: .xlsx</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Elegir archivo
                  </Button>
                </div>
              </label>

              {selectedFileName && (
                <div className="rounded-xl border border-ink-100 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">Archivo cargado</p>
                  <p className="mt-1 text-sm font-medium text-ink-700">{selectedFileName}</p>
                </div>
              )}

              {detectedSheets.length > 0 && (
                <div className="rounded-2xl bg-ink-50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">Hojas detectadas</p>
                  <div className="space-y-2">
                    {detectedSheets.map((sheet) => (
                      <div key={sheet.name} className="flex items-center justify-between rounded-xl border border-ink-100 bg-white px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-ink-700">{sheet.name}</p>
                          <p className="text-xs text-ink-500">{sheet.rows} filas</p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                            sheet.state === "success"
                              ? "bg-success-50 text-success-700"
                              : sheet.state === "processing"
                                ? "bg-brand-50 text-brand-700"
                                : sheet.state === "error"
                                  ? "bg-danger-50 text-danger-700"
                                  : "bg-ink-100 text-ink-600"
                          }`}
                        >
                          {sheet.state === "success"
                            ? "Importado"
                            : sheet.state === "processing"
                              ? "Procesando"
                              : sheet.state === "error"
                                ? "Error"
                                : "Pendiente"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</div>
              )}

              {(status === "reading" || status === "importing") && (
                <div className="space-y-2 rounded-xl border border-brand-100 bg-brand-50 p-3">
                  <div className="flex items-center justify-between text-xs font-medium text-brand-700">
                    <span>{status === "reading" ? "Leyendo workbook..." : "Importando hojas..."}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-brand-100">
                    <div className="h-full rounded-full bg-brand-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {status === "success" && (
                <div className="rounded-2xl border border-success-200 bg-success-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-success-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-sm font-semibold">Importación completada con éxito</p>
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className="flex items-start gap-2 rounded-xl border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {Object.keys(parsedData).length > 0 && totalRows === 0 && (
                <div className="rounded-xl border border-warning-200 bg-warning-50 px-3 py-2 text-sm text-warning-700">
                  El archivo se leyó, pero no contiene filas válidas para importar.
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-ink-100 bg-white px-6 py-4">
            {Object.keys(parsedData).length > 0 && status !== "success" && (
              <div className="flex justify-end">
                <Button type="button" onClick={handleImportAll} disabled={status === "reading" || status === "importing"}>
                  {status === "importing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                  Importar todas las hojas
                </Button>
              </div>
            )}

            {status === "success" && (
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => window.location.reload()}>
                  <RefreshCcw className="h-4 w-4" />
                  Refrescar aplicación
                </Button>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cerrar
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
