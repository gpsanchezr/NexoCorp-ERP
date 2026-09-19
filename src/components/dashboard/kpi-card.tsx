import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, formatCOP } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  variation,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  variation?: number;
  icon: LucideIcon;
  tone: "brand" | "violet" | "success";
}) {
  const toneClasses: Record<string, string> = {
    brand: "border-blue-700/20 bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-blue-900/10",
    violet: "border-indigo-700/20 bg-gradient-to-br from-indigo-500 to-violet-700 text-white shadow-indigo-900/10",
    success: "border-emerald-700/20 bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-emerald-900/10",
  };

  return (
    <Card className={cn("border p-5 shadow-lg", toneClasses[tone])}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white/85">{label}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-white">{formatCOP(value)}</p>
      {typeof variation === "number" && (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-white/80">
          <TrendingUp className="h-3.5 w-3.5" />
          {Math.round(variation * 100)}% vs. mes anterior
        </p>
      )}
    </Card>
  );
}
