// Tipos centrales de NexoCorp.
// Reflejan 1:1 las tablas descritas en supabase/schema.sql — cuando el proyecto
// se conecte a Supabase real, estos son los tipos que debe devolver cada consulta.

import type { LucideIcon } from "lucide-react";

export type UserRole = "owner" | "admin" | "cashier";

export type SectorKey =
  | "farmacia"
  | "restaurante"
  | "panaderia"
  | "ferreteria"
  | "peluqueria"
  | "miscelanea"
  | "tienda_naturista"
  | "papeleria"
  | "ropa_calzado"
  | "tecnologia_celulares"
  | "licorera"
  | "heladeria"
  | "veterinaria"
  | "floristeria"
  | "joyeria"
  | "llanteria_taller"
  | "jugueteria"
  | "supermercado"
  | "cafeteria"
  | "salsamentaria"
  | "optica"
  | "lavanderia"
  | "agropecuaria"
  | "otro";

export interface SectorInfo {
  key: SectorKey;
  label: string;
  icon: LucideIcon;
  /** Sectores donde vencimiento se muestra en días (perecederos) en vez de solo fecha. */
  showsExpirationInDays: boolean;
  /** Categorías de producto sugeridas por defecto al dar de alta el sector. */
  defaultCategories: string[];
}

export type SafetyFlag = "toxico" | "quimico" | "alimento" | "medicamento";

export interface Business {
  id: string;
  name: string;
  slug: string;
  sector: SectorKey;
  city: string;
  logoUrl?: string;
  signatureUrl?: string;
  trialStartDate: string; // ISO date
  whatsappNumber: string; // solo dígitos con indicativo de país, p.ej. 573001234567
  /** Ingresos brutos acumulados del año en curso (COP) — alimenta el Radar Fiscal DIAN. */
  currentUvtTotal: number;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  cedulaNit?: string;
  phone?: string;
  email?: string;
}

export interface Product {
  id: string;
  businessId: string;
  barcode?: string;
  name: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  minStock: number;
  expirationDate?: string; // ISO date
  image_url?: string | null;
  safetyFlags: SafetyFlag[];
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type DiscountType = "none" | "fixed" | "percent";

export interface CustomerSnapshot {
  name: string;
  cedulaNit?: string;
  phone?: string;
  email?: string;
}

export interface Sale {
  id: string;
  businessId: string;
  receiptNumber: string;
  customerId?: string;
  customer?: CustomerSnapshot;
  items: SaleItem[];
  discountType: DiscountType;
  discountValue: number;
  subtotal: number;
  totalAmount: number;
  createdAt: string; // ISO datetime
  pdfUrl?: string;
  createdOffline?: boolean;
}

export interface PurchaseItem {
  productId?: string;
  productName: string;
  quantity: number;
  unitCost: number;
  expirationDate?: string;
}

export interface Purchase {
  id: string;
  businessId: string;
  supplierName: string;
  totalAmount: number;
  invoiceImageUrl?: string;
  items: PurchaseItem[];
  createdAt: string;
}

export type FiadoStatus = "pendiente" | "pagado" | "vencido";

export interface FiadoRecord {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  totalDebt: number;
  dueDate: string; // ISO date
  status: FiadoStatus;
}

export interface OperatingExpense {
  id: string;
  businessId: string;
  type: string;
  description: string;
  amount: number;
  createdAt: string;
}

export type DianStatus = "verde" | "amarillo" | "rojo";

export interface StockAlert {
  product: Product;
  kind: "bajo_stock" | "por_vencer";
  daysToExpire?: number;
}

export interface IncompatibilityCheck {
  blocked: boolean;
  reason?: string;
  conflictingProduct?: Product;
}
