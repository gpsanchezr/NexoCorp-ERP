import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8" aria-busy="true" aria-label="Cargando dashboard">
      <div className="space-y-3">
        <div className="h-4 w-32 animate-pulse rounded bg-ink-100" />
        <div className="h-8 w-3/4 animate-pulse rounded bg-ink-100" />
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-3">
          {["ventas", "compras", "utilidad"].map((item) => (
            <Card key={item} className="h-32 animate-pulse bg-ink-50" />
          ))}
        </div>
        <Card className="h-32 animate-pulse bg-ink-50" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="h-72 animate-pulse bg-ink-50 lg:col-span-2" />
        <Card className="h-72 animate-pulse bg-ink-50" />
      </div>
    </div>
  );
}
