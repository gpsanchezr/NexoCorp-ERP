import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content";

type DashboardChartPoint = { mes: string; ingresos: number; gastos: number };
type DashboardExpense = { type: string; amount: number };
type DashboardData = {
  ventasDelMes: number;
  comprasDelMes: number;
  gastosFijos: number;
  chartData: DashboardChartPoint[];
  expenses: DashboardExpense[];
};

const normalizeKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[$.\s]/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const getValue = (row: Record<string, unknown>, aliases: string[]) => {
  const keys = aliases.map(normalizeKey);
  const entry = Object.entries(row).find(([key, value]) => {
    const normalized = normalizeKey(key);
    return keys.some((alias) => normalized === alias || normalized.includes(alias)) && value !== null && value !== undefined;
  });
  return entry?.[1];
};

const getAmount = (row: Record<string, unknown>, aliases: string[]) => toNumber(getValue(row, aliases));

const toMonthKey = (value: unknown): string => {
  const numericValue = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (Number.isFinite(numericValue) && numericValue >= 1 && numericValue <= 2958465) {
    const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(numericValue * 86_400_000));
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 7);
  }

  const text = String(value ?? "").trim();
  if (!text) return "";

  const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}`;

  const latinDateMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (latinDateMatch) return `${latinDateMatch[3]}-${latinDateMatch[2].padStart(2, "0")}`;

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 7);
};

const getDate = (row: Record<string, unknown>): string => {
  const value = getValue(row, [
    "date",
    "fecha",
    "created_at",
    "fecha_venta",
    "fecha_compra",
    "fecha_gasto",
    "fecha_registro",
    "expense_date",
    "periodo",
    "month",
  ]);
  return toMonthKey(value);
};

const monthLabel = (month: string) =>
  new Intl.DateTimeFormat("es-CO", { month: "short" }).format(new Date(`${month}-01T00:00:00`)).replace(".", "");

const addMonths = (month: string, amount: number): string => {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};

const buildTimeline = (months: string[], now: Date): string[] => {
  const validMonths = months.filter((month) => /^\d{4}-\d{2}$/.test(month)).sort();
  if (validMonths.length === 0) {
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return Array.from({ length: 12 }, (_, index) => addMonths(currentMonth, index - 11));
  }

  const firstMonth = validMonths[0];
  const lastMonth = validMonths[validMonths.length - 1];
  const timeline: string[] = [];
  let cursor = firstMonth;
  while (cursor <= lastMonth) {
    timeline.push(cursor);
    cursor = addMonths(cursor, 1);
  }

  if (timeline.length === 1) {
    return Array.from({ length: 12 }, (_, index) => addMonths(lastMonth, index - 11));
  }
  return timeline;
};

const getIdentity = (row: Record<string, unknown>, aliases: string[]): string | null => {
  const value = getValue(row, aliases);
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized || null;
};

const mergeWithFallback = (
  relationalRows: Array<Record<string, unknown>>,
  fallbackRows: Array<Record<string, unknown>>,
  identityAliases: string[]
) => {
  const identities = new Set(relationalRows.map((row) => getIdentity(row, identityAliases)).filter(Boolean));
  const uniqueFallbackRows = fallbackRows.filter((row) => {
    const identity = getIdentity(row, identityAliases);
    if (identity) return !identities.has(identity);
    return relationalRows.length === 0;
  });
  return [...relationalRows, ...uniqueFallbackRows];
};

async function loadDashboardData(supabase: ReturnType<typeof createClient>, businessId: string): Promise<DashboardData> {
  const [salesResult, purchasesResult, expensesResult, cashResult, genericResult] = await Promise.all([
    supabase.from("sales").select("*").eq("business_id", businessId),
    supabase.from("purchases").select("*").eq("business_id", businessId),
    supabase.from("operating_expenses").select("*").eq("business_id", businessId),
    supabase.from("cash_movements").select("*").eq("business_id", businessId),
    supabase.from("excel_import_rows").select("sheet_name, row_number, row_data").eq("business_id", businessId),
  ]);

  const sales = (salesResult.data ?? []).map((row) => ({ ...row, kind: "sale" }));
  const purchases = (purchasesResult.data ?? []).map((row) => ({ ...row, kind: "purchase" }));
  const expenses = (expensesResult.data ?? []).map((row) => ({ ...row, kind: "expense" }));
  const cash = (cashResult.data ?? []).map((row) => ({ ...row, kind: "cash" }));
  const genericRows = (genericResult.data ?? []).map((row) => ({
    ...(row.row_data && typeof row.row_data === "object" ? row.row_data : {}),
    sheet_name: row.sheet_name,
  } as Record<string, unknown>));

  const genericSales = genericRows.filter((row) => ["ventas", "sales"].includes(normalizeKey(String(row.sheet_name)))).map((row) => ({ ...row, kind: "sale" }));
  const genericPurchases = genericRows.filter((row) => ["compras", "purchases"].includes(normalizeKey(String(row.sheet_name)))).map((row) => ({ ...row, kind: "purchase" }));
  const genericExpenses = genericRows
    .filter((row) => ["gastos_costos", "gastos", "costos", "operating_expenses"].includes(normalizeKey(String(row.sheet_name))))
    .map((row) => ({ ...row, kind: "expense" }));

  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const saleRows = mergeWithFallback(
    sales,
    genericSales,
    ["id", "receipt_number", "numero_factura", "factura", "id_factura", "invoice_id"]
  ).map((row) => ({ ...row, kind: "sale" }));
  const purchaseRows = mergeWithFallback(
    purchases,
    genericPurchases,
    ["id", "invoice_number", "numero_factura", "factura", "id_compra", "purchase_id"]
  ).map((row) => ({ ...row, kind: "purchase" }));
  const expenseRows = [...mergeWithFallback(expenses, genericExpenses, ["id", "expense_id", "id_gasto"]), ...cash].map((row) => ({ ...row, kind: "expense" }));
  const currentSales = saleRows.filter((row) => getDate(row) === currentMonth).reduce((sum, row) => sum + getAmount(row, ["total_amount", "total", "total_venta", "grand_total", "monto_total", "amount"]), 0);
  const currentPurchases = purchaseRows.filter((row) => getDate(row) === currentMonth).reduce((sum, row) => sum + getAmount(row, ["total_amount", "total", "total_compra", "monto_total", "amount", "valor_total"]), 0);
  const grouped = new Map<string, DashboardChartPoint>();

  [...saleRows, ...purchaseRows].forEach((row) => {
    const month = getDate(row);
    if (!/^\d{4}-\d{2}$/.test(month)) return;
    const point = grouped.get(month) ?? { mes: monthLabel(month), ingresos: 0, gastos: 0 };
    if (row.kind === "sale") point.ingresos += getAmount(row, ["total_amount", "total", "total_venta", "grand_total", "monto_total", "amount"]);
    else point.gastos += getAmount(row, ["total_amount", "total", "total_compra", "monto_total", "amount", "valor_total"]);
    grouped.set(month, point);
  });

  const expenseGroups = new Map<string, number>();
  expenseRows.forEach((row) => {
    const amount = getAmount(row, ["amount", "monto", "valor", "total", "importe", "gasto_total", "costo", "valor_gasto"]);
    if (amount <= 0) return;
    const type = String(getValue(row, ["expense_type", "type", "tipo_gasto", "gasto", "category", "categoria", "concept", "concepto"]) ?? "Otros").trim() || "Otros";
    expenseGroups.set(type, (expenseGroups.get(type) ?? 0) + amount);
  });
  const dashboardExpenses = Array.from(expenseGroups, ([type, amount]) => ({ type, amount }));
  const expensesTotal = dashboardExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const timeline = buildTimeline(Array.from(grouped.keys()), now);
  const chartData = timeline.map((month) => {
    const point = grouped.get(month);
    return point ?? { mes: monthLabel(month), ingresos: 0, gastos: 0 };
  });

  return {
    ventasDelMes: currentSales,
    comprasDelMes: currentPurchases,
    gastosFijos: expensesTotal,
    chartData,
    expenses: dashboardExpenses,
  };
}

function getFirstNameFromUser(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null, profile?: { full_name?: string | null; first_name?: string | null } | null) {
  const candidates = [
    profile?.first_name,
    profile?.full_name,
    user?.user_metadata?.first_name,
    user?.user_metadata?.given_name,
    user?.user_metadata?.name,
    user?.user_metadata?.full_name,
    user?.email,
  ];

  for (const candidate of candidates) {
    const normalized = String(candidate ?? "").trim();
    if (!normalized) continue;

    const firstName = normalized.split(/\s+/).find(Boolean);
    if (firstName) {
      return firstName;
    }
  }

  return "Usuario";
}

export default async function DashboardPage() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, first_name, role, business_id")
    .eq("id", user.id)
    .single();

  const firstName = getFirstNameFromUser(user, profile);
  const role = profileError ? "owner" : profile?.role;

  if (role === "admin" || role === "cashier") {
    redirect("/app/stock");
  }

  const dashboardData = profile?.business_id ? await loadDashboardData(supabase, profile.business_id) : {
    ventasDelMes: 0,
    comprasDelMes: 0,
    gastosFijos: 0,
    chartData: [],
    expenses: [],
  };

  return <DashboardPageContent firstName={firstName} isOwner={role === "owner"} dashboardData={dashboardData} />;
}
