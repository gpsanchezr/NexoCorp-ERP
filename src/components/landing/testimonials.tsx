import { Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Container } from "./container";

// Testimonios ilustrativos — reemplázalos por citas reales de tus primeros
// clientes antes de publicar el sitio (ver manual del desarrollador).
const TESTIMONIALS = [
  {
    quote:
      "Antes anotaba los fiados en un cuaderno y siempre perdía la cuenta. Ahora le doy un toque a WhatsApp y ya.",
    name: "Rosa Elena Padilla",
    role: "Miscelánea La Esquina, Soledad",
  },
  {
    quote:
      "El aviso de que no puedo guardar el cloro cerca de la comida me salvó de una visita de Sanidad.",
    name: "Wilmer Cantillo",
    role: "Panadería Cantillo, Barranquilla",
  },
  {
    quote:
      "Nunca supe cuánto llevaba vendido en el año hasta que vi el Radar DIAN. Ya hablé con mi contador con tiempo.",
    name: "Yolima Restrepo",
    role: "Ferretería Restrepo e Hijos, Malambo",
  },
];

export function Testimonials() {
  return (
    <section id="testimonios" className="bg-white py-20">
      <Container>
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight text-ink-900">
            Negocios como el tuyo, todos los días
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="flex flex-col p-6">
              <Quote className="h-5 w-5 text-brand-200" />
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-ink-700">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-5 border-t border-ink-100 pt-4">
                <p className="text-sm font-semibold text-ink-900">{t.name}</p>
                <p className="text-xs text-ink-400">{t.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
