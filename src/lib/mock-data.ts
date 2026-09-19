import { addDays, format, subDays, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import type {
  Business,
  Customer,
  FiadoRecord,
  OperatingExpense,
  Product,
  Purchase,
  Sale,
} from "./types";
import { calcSaleTotals, uid } from "./utils";

const iso = (d: Date) => d.toISOString();
const today = () => new Date();

// ---------------------------------------------------------------------------
// Negocio demo
// ---------------------------------------------------------------------------

export const MOCK_BUSINESS: Business = {
  id: "biz_saludvida",
  name: "Farmacia SaludVida",
  slug: "farmacia-saludvida",
  sector: "farmacia",
  city: "Barranquilla, CO",
  whatsappNumber: "573001234567",
  trialStartDate: iso(today()),
  currentUvtTotal: 29_340_000,
};

export const MOCK_OWNER = { name: "María González", role: "owner" as const };
export const MOCK_ADMIN = { name: "Laura Ortiz", role: "admin" as const };
export const MOCK_CASHIER = { name: "Kevin Ruiz", role: "cashier" as const };

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

export const MOCK_CUSTOMERS: Customer[] = [
  { id: "cus_1", businessId: MOCK_BUSINESS.id, name: "Ana Torres", cedulaNit: "1.045.678.901", phone: "573001234567", email: "ana@email.com" },
  { id: "cus_2", businessId: MOCK_BUSINESS.id, name: "Carlos Pérez", cedulaNit: "72.345.678", phone: "573012345678", email: "carlos.perez@email.com" },
  { id: "cus_3", businessId: MOCK_BUSINESS.id, name: "Laura Martínez", cedulaNit: "1.098.765.432", phone: "573023456789", email: "laura.martinez@email.com" },
  { id: "cus_4", businessId: MOCK_BUSINESS.id, name: "José Ramírez", cedulaNit: "8.765.432", phone: "573034567890", email: "jose.ramirez@email.com" },
  { id: "cus_5", businessId: MOCK_BUSINESS.id, name: "Diana López", cedulaNit: "1.102.334.556", phone: "573045678901", email: "diana.lopez@email.com" },
  { id: "cus_6", businessId: MOCK_BUSINESS.id, name: "Jorge Salcedo", cedulaNit: "9.876.543", phone: "573056789012", email: "jorge.salcedo@email.com" },
];

// ---------------------------------------------------------------------------
// Productos — incluye el par Cloro (químico) / Alimentos que dispara el
// Guardián de Incompatibilidades, y varios productos en bajo stock para las
// Alertas de Desabastecimiento.
// ---------------------------------------------------------------------------

export const MOCK_PRODUCTS: Product[] = [
  { id: "prod_1", businessId: MOCK_BUSINESS.id, barcode: "7701234560019", name: "Paracetamol 500mg", category: "Medicamentos", costPrice: 1200, salePrice: 2500, stockQuantity: 48, minStock: 15, expirationDate: iso(addDays(today(), 210)), safetyFlags: ["medicamento"] },
  { id: "prod_2", businessId: MOCK_BUSINESS.id, barcode: "7701234560026", name: "Aspirina 100 (20 unidades)", category: "Medicamentos", costPrice: 950, salePrice: 1900, stockQuantity: 20, minStock: 25, expirationDate: iso(addDays(today(), 15)), safetyFlags: ["medicamento"] },
  { id: "prod_3", businessId: MOCK_BUSINESS.id, barcode: "7701234560033", name: "Ibuprofeno 400mg", category: "Medicamentos", costPrice: 1500, salePrice: 3200, stockQuantity: 30, minStock: 15, expirationDate: iso(addDays(today(), 300)), safetyFlags: ["medicamento"] },
  { id: "prod_4", businessId: MOCK_BUSINESS.id, barcode: "7701234560040", name: "Suero Oral", category: "Medicamentos", costPrice: 1800, salePrice: 3500, stockQuantity: 22, minStock: 10, expirationDate: iso(addDays(today(), 120)), safetyFlags: ["medicamento"] },
  { id: "prod_5", businessId: MOCK_BUSINESS.id, barcode: "7701234560057", name: "Leche Entera 1L", category: "Alimentos", costPrice: 2800, salePrice: 4200, stockQuantity: 4, minStock: 15, expirationDate: iso(addDays(today(), 6)), safetyFlags: ["alimento"] },
  { id: "prod_6", businessId: MOCK_BUSINESS.id, barcode: "7701234560064", name: "Pan Integral", category: "Alimentos", costPrice: 2600, salePrice: 3800, stockQuantity: 25, minStock: 10, expirationDate: iso(addDays(today(), 4)), safetyFlags: ["alimento"] },
  { id: "prod_7", businessId: MOCK_BUSINESS.id, barcode: "7701234560071", name: "Harina de Trigo", category: "Alimentos", costPrice: 2100, salePrice: 3200, stockQuantity: 2, minStock: 13, expirationDate: iso(addDays(today(), 45)), safetyFlags: ["alimento"] },
  { id: "prod_8", businessId: MOCK_BUSINESS.id, barcode: "7701234560088", name: "Crema Dental", category: "Cuidado personal", costPrice: 3400, salePrice: 6900, stockQuantity: 40, minStock: 12, expirationDate: iso(addDays(today(), 500)), safetyFlags: [] },
  { id: "prod_9", businessId: MOCK_BUSINESS.id, barcode: "7701234560095", name: "Shampoo Anticaspa", category: "Cuidado personal", costPrice: 4200, salePrice: 8500, stockQuantity: 18, minStock: 8, expirationDate: iso(addDays(today(), 420)), safetyFlags: [] },
  { id: "prod_10", businessId: MOCK_BUSINESS.id, barcode: "7701234560101", name: "Papel Higiénico x4", category: "Aseo", costPrice: 1800, salePrice: 2500, stockQuantity: 5, minStock: 25, expirationDate: undefined, safetyFlags: [] },
  { id: "prod_11", businessId: MOCK_BUSINESS.id, barcode: "7701234560118", name: "Cloro 1L", category: "Aseo / Químicos", costPrice: 2600, salePrice: 4800, stockQuantity: 1, minStock: 10, expirationDate: undefined, safetyFlags: ["toxico", "quimico"] },
  { id: "prod_12", businessId: MOCK_BUSINESS.id, barcode: "7701234560125", name: "Guantes de Nitrilo (caja x50)", category: "Dispositivos médicos", costPrice: 12000, salePrice: 21000, stockQuantity: 14, minStock: 5, expirationDate: iso(addDays(today(), 600)), safetyFlags: [] },
];

// ---------------------------------------------------------------------------
// Ventas recientes (para el buscador de facturas y el detalle de recibo)
// ---------------------------------------------------------------------------

function buildSale(
  seq: number,
  daysAgo: number,
  customer: Customer | undefined,
  lines: { product: Product; quantity: number }[],
  discountType: Sale["discountType"] = "none",
  discountValue = 0
): Sale {
  const items = lines.map((l) => ({
    id: uid("item"),
    saleId: `sale_${seq}`,
    productId: l.product.id,
    productName: l.product.name,
    quantity: l.quantity,
    unitPrice: l.product.salePrice,
    subtotal: l.quantity * l.product.salePrice,
  }));
  const { subtotal, total } = calcSaleTotals(items, discountType, discountValue);
  const createdAt = subDays(today(), daysAgo);
  createdAt.setHours(9 + (seq % 8), (seq * 7) % 60, 0, 0);
  return {
    id: `sale_${seq}`,
    businessId: MOCK_BUSINESS.id,
    receiptNumber: String(453 + seq).padStart(6, "0"),
    customerId: customer?.id,
    customer: customer
      ? { name: customer.name, cedulaNit: customer.cedulaNit, phone: customer.phone, email: customer.email }
      : undefined,
    items,
    discountType,
    discountValue,
    subtotal,
    totalAmount: total,
    createdAt: iso(createdAt),
  };
}

const [c1, c2, c3, c4, c5, c6] = MOCK_CUSTOMERS;
const byId = (id: string) => MOCK_PRODUCTS.find((p) => p.id === id)!;
const p1 = byId("prod_1");
const p2 = byId("prod_2");
const p3 = byId("prod_3");
const p4 = byId("prod_4");
const p5 = byId("prod_5");
const p6 = byId("prod_6");
const p7 = byId("prod_7");
const p8 = byId("prod_8");
const p9 = byId("prod_9");
const p10 = byId("prod_10");
const p12 = byId("prod_12");

export const MOCK_SALES: Sale[] = [
  buildSale(5, 0, c1, [{ product: p1, quantity: 2 }, { product: p5, quantity: 1 }, { product: p8, quantity: 1 }, { product: p3, quantity: 15 }]),
  buildSale(4, 0, c2, [{ product: p9, quantity: 2 }, { product: p4, quantity: 4 }, { product: p12, quantity: 3 }], "percent", 10),
  buildSale(3, 1, c3, [{ product: p6, quantity: 3 }, { product: p1, quantity: 4 }, { product: p7, quantity: 2 }]),
  buildSale(2, 1, c4, [{ product: p2, quantity: 10 }, { product: p3, quantity: 8 }, { product: p8, quantity: 4 }, { product: p9, quantity: 4 }], "fixed", 5000),
  buildSale(1, 2, c5, [{ product: p1, quantity: 6 }, { product: p6, quantity: 2 }, { product: p10, quantity: 3 }]),
  buildSale(0, 3, c6, [{ product: p4, quantity: 2 }, { product: p8, quantity: 1 }]),
];

export const nextReceiptSequence = MOCK_SALES.length + 1;

// ---------------------------------------------------------------------------
// Compras a proveedores
// ---------------------------------------------------------------------------

export const MOCK_PURCHASES: Purchase[] = [
  {
    id: "purch_1",
    businessId: MOCK_BUSINESS.id,
    supplierName: "Distribuidora El Proveedor S.A.",
    totalAmount: 1_450_000,
    createdAt: iso(subDays(today(), 6)),
    items: [
      { productName: "Paracetamol 500mg", quantity: 200, unitCost: 1200 },
      { productName: "Ibuprofeno 400mg", quantity: 120, unitCost: 1500 },
    ],
  },
  {
    id: "purch_2",
    businessId: MOCK_BUSINESS.id,
    supplierName: "Distrimedicos del Caribe",
    totalAmount: 980_000,
    createdAt: iso(subDays(today(), 13)),
    items: [
      { productName: "Suero Oral", quantity: 60, unitCost: 1800 },
      { productName: "Guantes de Nitrilo (caja x50)", quantity: 15, unitCost: 12000 },
    ],
  },
];

/** Factura "pendiente" que se usa en la simulación del Escáner de Compras con IA. */
export const MOCK_INCOMING_INVOICE = {
  supplierName: "Distribuidora El Proveedor S.A.",
  imageLabel: "factura_proveedor_0148.jpg",
  detectedItems: [
    { productId: p10.id, productName: "Papel Higiénico x4", quantity: 10, unitCost: 1800, expirationDate: undefined as string | undefined },
    { productId: p5.id, productName: "Leche Entera 1L", quantity: 5, unitCost: 2800, expirationDate: iso(addDays(today(), 12)) },
    { productId: p6.id, productName: "Pan Integral", quantity: 8, unitCost: 2600, expirationDate: iso(addDays(today(), 5)) },
  ],
  get totalAmount() {
    return this.detectedItems.reduce((acc, it) => acc + it.quantity * it.unitCost, 0);
  },
};

// ---------------------------------------------------------------------------
// Fiados (cuaderno digital)
// ---------------------------------------------------------------------------

export const MOCK_FIADOS: FiadoRecord[] = [
  { id: "fiado_1", businessId: MOCK_BUSINESS.id, customerId: c2.id, customerName: c2.name, customerPhone: c2.phone, totalDebt: 45_000, dueDate: iso(addDays(today(), 5)), status: "pendiente" },
  { id: "fiado_2", businessId: MOCK_BUSINESS.id, customerId: c3.id, customerName: c3.name, customerPhone: c3.phone, totalDebt: 28_000, dueDate: iso(subDays(today(), 3)), status: "vencido" },
  { id: "fiado_3", businessId: MOCK_BUSINESS.id, customerId: c6.id, customerName: c6.name, customerPhone: c6.phone, totalDebt: 60_000, dueDate: iso(addDays(today(), 12)), status: "pendiente" },
];

// ---------------------------------------------------------------------------
// Gastos operativos fijos + resumen mensual (KPIs del dashboard)
// ---------------------------------------------------------------------------

export const MOCK_OPERATING_EXPENSES: OperatingExpense[] = [
  { id: "exp_1", businessId: MOCK_BUSINESS.id, type: "Arriendo", description: "Arriendo local, mes en curso", amount: 1_200_000, createdAt: iso(subDays(today(), 10)) },
  { id: "exp_2", businessId: MOCK_BUSINESS.id, type: "Servicios", description: "Energía y acueducto", amount: 350_000, createdAt: iso(subDays(today(), 9)) },
  { id: "exp_3", businessId: MOCK_BUSINESS.id, type: "Nómina", description: "Nómina auxiliar de mostrador", amount: 1_800_000, createdAt: iso(subDays(today(), 5)) },
  { id: "exp_4", businessId: MOCK_BUSINESS.id, type: "Otros", description: "Insumos de aseo del local", amount: 250_000, createdAt: iso(subDays(today(), 2)) },
];

export const MOCK_MONTHLY_SUMMARY = {
  ventasDelMes: 12_458_000,
  ventasDelMesVariacion: 0.12,
  comprasDelMes: 5_230_000,
  comprasDelMesVariacion: 0.08,
  get utilidadBruta() {
    return this.ventasDelMes - this.comprasDelMes;
  },
  get gastosFijos() {
    return MOCK_OPERATING_EXPENSES.reduce((acc, e) => acc + e.amount, 0);
  },
  get utilidadNeta() {
    return this.utilidadBruta - this.gastosFijos;
  },
  utilidadVariacion: 0.18,
};

/** Serie de los últimos `months` meses (incluye el actual), para el gráfico Ingresos vs Gastos. */
export function generateMonthlySeries(months = 9) {
  const series: { mes: string; ingresos: number; gastos: number }[] = [];
  // Curva ascendente con algo de variación, terminando en las cifras del mes actual.
  const seedIngresos = [0.58, 0.63, 0.6, 0.68, 0.74, 0.7, 0.8, 0.9, 1];
  const seedGastos = [0.62, 0.6, 0.66, 0.64, 0.7, 0.75, 0.78, 0.85, 1];
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(today(), i);
    const idx = seedIngresos.length - 1 - i < 0 ? 0 : seedIngresos.length - 1 - i;
    series.push({
      mes: format(d, "MMM", { locale: es }).replace(".", ""),
      ingresos: Math.round((MOCK_MONTHLY_SUMMARY.ventasDelMes * (seedIngresos[idx] ?? 1)) / 1000) * 1000,
      gastos: Math.round((MOCK_MONTHLY_SUMMARY.comprasDelMes * (seedGastos[idx] ?? 1)) / 1000) * 1000,
    });
  }
  return series;
}

export const MOCK_EXPENSE_BREAKDOWN = MOCK_OPERATING_EXPENSES.map((e) => ({
  name: e.type,
  value: e.amount,
}));
