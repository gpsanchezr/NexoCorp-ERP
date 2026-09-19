import { DIAN_UVT_LIMIT, DIAN_UVT_THRESHOLD_COP } from "@/lib/config";
import { DIAN_STATUS_COPY, formatCOP, getDianReading } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STROKE: Record<string, string> = {
  verde: "#1fa64c",
  amarillo: "#e2960f",
  rojo: "#d92c2c",
};

const STATUS_BADGE: Record<string, "success" | "warning" | "danger"> = {
  verde: "success",
  amarillo: "warning",
  rojo: "danger",
};

export function DianGauge({
  currentTotal,
  compact = false,
  className,
}: {
  currentTotal: number;
  compact?: boolean;
  className?: string;
}) {
  const reading = getDianReading(currentTotal);
  const copy = DIAN_STATUS_COPY[reading.status];
  const stroke = STATUS_STROKE[reading.status];
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * Math.min(reading.ratio, 1);

  return (
    <div className={cn("flex flex-col items-center gap-4 text-center", className)}>
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#eceef2" strokeWidth="9" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-ink-900">{reading.percentage}%</span>
          <span className="text-[10px] font-medium text-ink-400">del tope</span>
        </div>
      </div>

      <Badge variant={STATUS_BADGE[reading.status]}>{copy.label}</Badge>

      {!compact && (
        <div className="w-full space-y-2">
          <Progress
            value={Math.min(reading.ratio, 1) * 100}
            indicatorClassName={cn(
              reading.status === "verde" && "bg-success-500",
              reading.status === "amarillo" && "bg-warning-500",
              reading.status === "rojo" && "bg-danger-500"
            )}
          />
          <p className="text-xs text-ink-500">
            Ingresos brutos acumulados: <span className="font-semibold text-ink-700">{formatCOP(currentTotal)}</span>{" "}
            de {formatCOP(DIAN_UVT_THRESHOLD_COP)} ({DIAN_UVT_LIMIT.toLocaleString("es-CO")} UVT)
          </p>
          <p className="text-xs text-ink-400">{copy.hint}</p>
        </div>
      )}
    </div>
  );
}
