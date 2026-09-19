import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  DIAN_RED_FROM,
  DIAN_UVT_THRESHOLD_COP,
  DIAN_YELLOW_FROM,
} from "./config";
import type { DianStatus, Product, SafetyFlag, SectorKey } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Formato de moneda y fechas (es-CO)
// ---------------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatCOP(value: number): string {
  return currencyFormatter.format(Math.round(value));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

// ---------------------------------------------------------------------------
// Radar Fiscal DIAN
// ---------------------------------------------------------------------------

export interface DianReading {
  status: DianStatus;
  ratio: number; // 0..1 (o más, si ya se superó el tope)
  percentage: number; // redondeado para mostrar
  remaining: number; // COP que faltan para llegar al tope
}

export function getDianReading(currentTotal: number): DianReading {
  const ratio = currentTotal / DIAN_UVT_THRESHOLD_COP;
  const status: DianStatus =
    ratio >= DIAN_RED_FROM ? "rojo" : ratio >= DIAN_YELLOW_FROM ? "amarillo" : "verde";
  return {
    status,
    ratio,
    percentage: Math.round(Math.min(ratio, 1.5) * 100),
    remaining: Math.max(DIAN_UVT_THRESHOLD_COP - currentTotal, 0),
  };
}

export const DIAN_STATUS_COPY: Record<DianStatus, { label: string; hint: string }> = {
  verde: {
    label: "Vas seguro",
    hint: "Tus ingresos del año están lejos del tope que exige declarar renta.",
  },
  amarillo: {
    label: "Vigila tu tope",
    hint: "Vas superando la mitad del tope anual. Empieza a organizar tus soportes.",
  },
  rojo: {
    label: "Riesgo de obligatoriedad de Declaración de Renta",
    hint: "Estás cerca o superaste el tope de 1.400 UVT. Habla pronto con tu contador.",
  },
};

// ---------------------------------------------------------------------------
// Márgenes inteligentes por sector
// ---------------------------------------------------------------------------

/** Margen de venta objetivo (sobre el precio, no sobre el costo) por sector. */
const SECTOR_TARGET_MARGIN: Record<SectorKey, number> = {
  farmacia: 0.35,
  restaurante: 0.65,
  panaderia: 0.55,
  ferreteria: 0.38,
  peluqueria: 0.45,
  miscelanea: 0.3,
  tienda_naturista: 0.5,
  papeleria: 0.4,
  ropa_calzado: 0.55,
  tecnologia_celulares: 0.25,
  licorera: 0.3,
  heladeria: 0.65,
  veterinaria: 0.4,
  floristeria: 0.6,
  joyeria: 0.5,
  llanteria_taller: 0.3,
  jugueteria: 0.45,
  supermercado: 0.25,
  cafeteria: 0.65,
  salsamentaria: 0.35,
  optica: 0.55,
  lavanderia: 0.5,
  agropecuaria: 0.3,
  otro: 0.4,
};

/**
 * Sugiere un precio de venta a partir del costo, usando el margen típico del
 * sector (no un simple x2) y redondeando a un valor "cerrado" en pesos, como
 * hace cualquier tendero al fijar precios de mostrador.
 */
export function suggestSalePrice(costPrice: number, sector: SectorKey): number {
  if (costPrice <= 0) return 0;
  const margin = SECTOR_TARGET_MARGIN[sector] ?? 0.4;
  const raw = costPrice / (1 - margin);
  const step = raw < 10_000 ? 100 : raw < 100_000 ? 500 : 1000;
  return Math.ceil(raw / step) * step;
}

export function getSectorMarginLabel(sector: SectorKey): string {
  const margin = SECTOR_TARGET_MARGIN[sector] ?? 0.4;
  return `${Math.round(margin * 100)}%`;
}

// ---------------------------------------------------------------------------
// Guardián de incompatibilidades (seguridad sanitaria de inventario)
// ---------------------------------------------------------------------------

const HAZARD_FLAGS: SafetyFlag[] = ["toxico", "quimico"];
const SENSITIVE_FLAGS: SafetyFlag[] = ["alimento", "medicamento"];

function isHazard(flags: SafetyFlag[]) {
  return flags.some((f) => HAZARD_FLAGS.includes(f));
}
function isSensitive(flags: SafetyFlag[]) {
  return flags.some((f) => SENSITIVE_FLAGS.includes(f));
}

/**
 * Bloquea el guardado de un producto si mezcla, en el mismo inventario,
 * algo tóxico/químico con algo de consumo humano (alimento/medicamento).
 * La regla es simétrica: da igual cuál de los dos se esté guardando ahora.
 */
export function checkCrossContamination(
  candidate: { name: string; safetyFlags: SafetyFlag[] },
  existingProducts: Product[]
): { blocked: boolean; conflictingProduct?: Product } {
  const candidateIsHazard = isHazard(candidate.safetyFlags);
  const candidateIsSensitive = isSensitive(candidate.safetyFlags);
  if (!candidateIsHazard && !candidateIsSensitive) return { blocked: false };

  const conflict = existingProducts.find((p) => {
    if (candidateIsHazard && isSensitive(p.safetyFlags)) return true;
    if (candidateIsSensitive && isHazard(p.safetyFlags)) return true;
    return false;
  });

  return conflict ? { blocked: true, conflictingProduct: conflict } : { blocked: false };
}

// ---------------------------------------------------------------------------
// Recibos, WhatsApp y correo
// ---------------------------------------------------------------------------

export function generateReceiptNumber(sequence: number): string {
  return String(sequence).padStart(6, "0");
}

/** Deja solo dígitos — wa.me exige el número sin '+', espacios ni guiones. */
export function toWhatsAppDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = toWhatsAppDigits(phone);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildMailtoLink(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function calcSaleTotals(
  items: { quantity: number; unitPrice: number }[],
  discountType: "none" | "fixed" | "percent",
  discountValue: number
) {
  const subtotal = items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  let discount = 0;
  if (discountType === "fixed") discount = Math.min(discountValue, subtotal);
  if (discountType === "percent") discount = subtotal * (Math.min(discountValue, 100) / 100);
  const total = Math.max(subtotal - discount, 0);
  return { subtotal, discount, total };
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
