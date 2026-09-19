import {
  Beef,
  Building2,
  Coffee,
  CircleGauge,
  Croissant,
  Dog,
  Flower2,
  Gauge,
  Gem,
  Glasses,
  IceCreamCone,
  Leaf,
  Package,
  PencilRuler,
  Pill,
  ScanLine,
  Scissors,
  Shirt,
  ShoppingBasket,
  ShoppingCart,
  Smartphone,
  Sprout,
  Store,
  ToyBrick,
  UtensilsCrossed,
  WashingMachine,
  Wine,
  Wrench,
} from "lucide-react";
import type { SectorInfo, SectorKey } from "./types";

/**
 * Todo lo que sea "identidad de marca" vive aquí. El equipo de NexoCorp evaluó
 * también el nombre "Vendify" para este mismo producto — si se decide el cambio,
 * basta con editar APP_NAME (y opcionalmente el logo en components/shared/logo.tsx).
 */
export const APP_NAME = "NexoCorp";
export const APP_TAGLINE = "Tu negocio en la nube";
export const APP_DESCRIPTION =
  "Organiza tu inventario, automatiza tus facturas y evita multas de la DIAN sin enredos.";

/**
 * Tope de ingresos brutos (año gravable) que obliga a declarar renta en Colombia,
 * expresado en UVT y en pesos aproximados. La DIAN publica el valor de la UVT cada
 * año — actualiza DIAN_UVT_THRESHOLD_COP cuando cambie (ver manual del desarrollador).
 */
export const DIAN_UVT_LIMIT = 1400;
export const DIAN_UVT_THRESHOLD_COP = 69_700_000;
export const DIAN_YELLOW_FROM = 0.5; // 50 %
export const DIAN_RED_FROM = 0.8; // 80 %

export const TRIAL_DAYS = 30;

export const SECTORS: SectorInfo[] = [
  { key: "farmacia", label: "Farmacia", icon: Pill, showsExpirationInDays: true, defaultCategories: ["Medicamentos", "Cuidado personal", "Dispositivos médicos"] },
  { key: "restaurante", label: "Restaurante", icon: UtensilsCrossed, showsExpirationInDays: true, defaultCategories: ["Alimentos", "Bebidas", "Insumos de cocina"] },
  { key: "panaderia", label: "Panadería", icon: Croissant, showsExpirationInDays: true, defaultCategories: ["Panadería", "Pastelería", "Insumos"] },
  { key: "ferreteria", label: "Ferretería", icon: Wrench, showsExpirationInDays: false, defaultCategories: ["Herramientas", "Construcción", "Pinturas", "Eléctricos"] },
  { key: "peluqueria", label: "Peluquería / Barbería", icon: Scissors, showsExpirationInDays: false, defaultCategories: ["Cuidado del cabello", "Químicos", "Accesorios"] },
  { key: "miscelanea", label: "Miscelánea", icon: Store, showsExpirationInDays: true, defaultCategories: ["Aseo", "Alimentos", "Papelería", "Varios"] },
  { key: "tienda_naturista", label: "Tienda Naturista", icon: Leaf, showsExpirationInDays: true, defaultCategories: ["Suplementos", "Alimentos naturales", "Cuidado personal"] },
  { key: "papeleria", label: "Papelería", icon: PencilRuler, showsExpirationInDays: false, defaultCategories: ["Útiles escolares", "Oficina", "Impresiones"] },
  { key: "ropa_calzado", label: "Ropa y Calzado", icon: Shirt, showsExpirationInDays: false, defaultCategories: ["Ropa", "Calzado", "Accesorios"] },
  { key: "tecnologia_celulares", label: "Tecnología y Celulares", icon: Smartphone, showsExpirationInDays: false, defaultCategories: ["Celulares", "Accesorios", "Reparaciones"] },
  { key: "licorera", label: "Licorera", icon: Wine, showsExpirationInDays: false, defaultCategories: ["Licores", "Cervezas", "Snacks"] },
  { key: "heladeria", label: "Heladería", icon: IceCreamCone, showsExpirationInDays: true, defaultCategories: ["Helados", "Postres", "Bebidas"] },
  { key: "veterinaria", label: "Veterinaria", icon: Dog, showsExpirationInDays: true, defaultCategories: ["Medicamentos", "Alimento para mascotas", "Accesorios"] },
  { key: "floristeria", label: "Floristería", icon: Flower2, showsExpirationInDays: true, defaultCategories: ["Flores", "Plantas", "Arreglos"] },
  { key: "joyeria", label: "Joyería", icon: Gem, showsExpirationInDays: false, defaultCategories: ["Joyas", "Relojes", "Accesorios"] },
  { key: "llanteria_taller", label: "Llantería / Taller", icon: CircleGauge, showsExpirationInDays: false, defaultCategories: ["Llantas", "Repuestos", "Lubricantes"] },
  { key: "jugueteria", label: "Juguetería", icon: ToyBrick, showsExpirationInDays: false, defaultCategories: ["Juguetes", "Juegos de mesa", "Fiestas"] },
  { key: "supermercado", label: "Supermercado", icon: ShoppingBasket, showsExpirationInDays: true, defaultCategories: ["Abarrotes", "Aseo", "Lácteos", "Carnes"] },
  { key: "cafeteria", label: "Cafetería", icon: Coffee, showsExpirationInDays: true, defaultCategories: ["Café", "Repostería", "Bebidas"] },
  { key: "salsamentaria", label: "Salsamentaria", icon: Beef, showsExpirationInDays: true, defaultCategories: ["Carnes frías", "Quesos", "Congelados"] },
  { key: "optica", label: "Óptica", icon: Glasses, showsExpirationInDays: false, defaultCategories: ["Monturas", "Lentes", "Accesorios"] },
  { key: "lavanderia", label: "Lavandería", icon: WashingMachine, showsExpirationInDays: false, defaultCategories: ["Insumos de lavado", "Servicios"] },
  { key: "agropecuaria", label: "Agropecuaria", icon: Sprout, showsExpirationInDays: true, defaultCategories: ["Insumos agrícolas", "Alimento animal", "Fertilizantes"] },
  { key: "otro", label: "Otro negocio", icon: Building2, showsExpirationInDays: true, defaultCategories: ["General"] },
];

export function getSector(key: SectorKey): SectorInfo {
  return SECTORS.find((s) => s.key === key) ?? SECTORS[SECTORS.length - 1];
}

/** Colores + textos de los 4 botones gigantes del "Modo de un solo botón". */
export const QUICK_ACTIONS = [
  {
    href: "/app/venta-rapida",
    label: "Vender Rápido",
    icon: ShoppingCart,
    className: "bg-success-500 hover:bg-success-600",
    ownerOnly: false,
  },
  {
    href: "/app/escanear-factura",
    label: "Escanear Factura",
    icon: ScanLine,
    className: "bg-brand-600 hover:bg-brand-700",
    ownerOnly: false,
  },
  {
    href: "/app/stock",
    label: "Ver Stock",
    icon: Package,
    className: "bg-amber-500 hover:bg-amber-600",
    ownerOnly: false,
  },
  {
    href: "/app/caja-dian",
    label: "Ver Caja & DIAN",
    icon: Gauge,
    className: "bg-violet-500 hover:bg-violet-600",
    ownerOnly: true,
  },
] as const;
