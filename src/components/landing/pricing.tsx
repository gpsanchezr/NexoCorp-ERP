import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "./container";

const INCLUDED = [
  "Ventas ilimitadas desde el mostrador",
  "Facturas PDF por WhatsApp y correo",
  "Alertas de stock y vencimientos",
  "Radar Fiscal DIAN y libro contable",
  "Catálogo digital público",
  "Hasta 3 usuarios (owner + cajeros)",
];

export function Pricing() {
  return (
    <section id="precios" className="py-20">
      <Container className="flex flex-col items-center">
        <div className="max-w-lg text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink-900">Un solo plan, sin letra pequeña</h2>
          <p className="mt-3 text-ink-500">
            Empieza gratis. Si tu negocio ya vende todos los días, seguramente vale la pena.
          </p>
        </div>

        <Card className="mt-10 w-full max-w-md border-brand-100 p-8">
          <p className="text-sm font-semibold text-brand-600">Plan Negocio</p>
          <div className="mt-2 flex items-end gap-1">
            <span className="text-4xl font-bold text-ink-900">$59.900</span>
            <span className="pb-1 text-sm text-ink-400">COP / mes</span>
          </div>
          <p className="mt-1 text-sm text-ink-400">Primeros 30 días gratis, sin tarjeta de crédito.</p>

          <ul className="mt-6 space-y-3">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-ink-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-500" />
                {item}
              </li>
            ))}
          </ul>

          <Button asChild size="lg" className="mt-8 w-full">
            <Link href="/registro">Prueba gratis por 30 días</Link>
          </Button>
        </Card>
      </Container>
    </section>
  );
}
