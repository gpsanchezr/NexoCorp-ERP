import type { Product, StockAlert } from "./types";
import { daysUntil } from "./utils";

const EXPIRATION_WARNING_DAYS = 30;

export function getStockAlerts(products: Product[]): StockAlert[] {
  const alerts: StockAlert[] = [];

  for (const product of products) {
    if (product.stockQuantity <= product.minStock) {
      alerts.push({ product, kind: "bajo_stock" });
    }
    if (product.expirationDate) {
      const days = daysUntil(product.expirationDate);
      if (days <= EXPIRATION_WARNING_DAYS) {
        alerts.push({ product, kind: "por_vencer", daysToExpire: days });
      }
    }
  }

  // Bajo stock primero (más urgente para reponer), luego por fecha más próxima a vencer.
  return alerts.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "bajo_stock" ? -1 : 1;
    if (a.kind === "por_vencer") return (a.daysToExpire ?? 0) - (b.daysToExpire ?? 0);
    return a.product.stockQuantity / (a.product.minStock || 1) - b.product.stockQuantity / (b.product.minStock || 1);
  });
}

export function stockPercentage(product: Product): number {
  if (product.minStock <= 0) return 100;
  return Math.round(Math.min((product.stockQuantity / product.minStock) * 100, 100));
}

const HAZARD_FLAGS = ["toxico", "quimico"] as const;
const SENSITIVE_FLAGS = ["alimento", "medicamento"] as const;

export interface SanitaryConflict {
  hazard: Product;
  sensitive: Product;
}

/**
 * Escanea TODO el inventario actual en busca de mezclas peligrosas ya
 * guardadas (no solo al momento de crear un producto nuevo). Así el
 * Dashboard puede mostrar el banner de Alerta Sanitaria de forma persistente,
 * igual que en el mockup de referencia.
 */
export function getSanitaryConflicts(products: Product[]): SanitaryConflict[] {
  const hazards = products.filter((p) => (Array.isArray(p.safetyFlags) ? p.safetyFlags : []).some((f) => (HAZARD_FLAGS as readonly string[]).includes(f)));
  const sensitives = products.filter((p) => (Array.isArray(p.safetyFlags) ? p.safetyFlags : []).some((f) => (SENSITIVE_FLAGS as readonly string[]).includes(f)));
  const conflicts: SanitaryConflict[] = [];
  for (const hazard of hazards) {
    for (const sensitive of sensitives) {
      conflicts.push({ hazard, sensitive });
    }
  }
  return conflicts;
}
