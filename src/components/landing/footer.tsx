import Link from "next/link";
import { Layers, Store, FileCheck2, ShieldCheck, Headset } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Container } from "./container";

const STRIP = [
  { icon: Layers, title: "ERP + POS", body: "Todo en un solo lugar" },
  { icon: Store, title: "Multisectorial", body: "Farmacias, restaurantes, ferreterías, peluquerías…" },
  { icon: FileCheck2, title: "Facturación electrónica", body: "PDF por WhatsApp y correo" },
  { icon: ShieldCheck, title: "Seguridad por negocio", body: "Cada negocio ve solo sus datos" },
  { icon: Headset, title: "Soporte", body: "Acompañamiento en la puesta en marcha" },
];

export function FinalCta() {
  return (
    <section className="bg-brand-950 py-20 text-white">
      <Container className="flex flex-col items-center text-center">
        <h2 className="max-w-xl text-3xl font-bold tracking-tight">
          Tu mostrador, organizado desde hoy.
        </h2>
        <p className="mt-3 max-w-md text-brand-100">
          Crea tu cuenta, elige el sector de tu negocio y empieza a vender en menos de cinco minutos.
        </p>
        <Button asChild size="xl" className="mt-8 bg-white text-brand-700 hover:bg-brand-50">
          <Link href="/registro">Prueba gratis por 30 días</Link>
        </Button>
      </Container>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="bg-ink-900 text-ink-300">
      <Container className="grid grid-cols-2 gap-8 py-14 sm:grid-cols-5">
        {STRIP.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex flex-col gap-2">
            <Icon className="h-5 w-5 text-brand-300" />
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs text-ink-400">{body}</p>
          </div>
        ))}
      </Container>
      <Container className="flex flex-col items-center gap-4 border-t border-white/10 py-8 sm:flex-row sm:justify-between">
        <Logo dark />
        <p className="text-xs text-ink-500">© {new Date().getFullYear()} NexoCorp. Hecho en Barranquilla, Colombia.</p>
      </Container>
    </footer>
  );
}
