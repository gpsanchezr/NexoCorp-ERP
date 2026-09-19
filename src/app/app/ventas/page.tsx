import { BuscadorVentas } from "@/components/dashboard/buscador-ventas";

export default function VentasPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Ventas</h1>
        <p className="text-sm text-ink-500">Historial completo de facturas del negocio.</p>
      </div>
      <BuscadorVentas />
    </div>
  );
}
