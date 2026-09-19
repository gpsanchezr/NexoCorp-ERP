import { Gauge, MessageSquareText, ShieldCheck, ShoppingCart } from "lucide-react";
import { Container } from "./container";

const BENEFITS = [
  {
    icon: ShoppingCart,
    title: "Modo fácil de un solo botón",
    body: "Vende, controla y gestiona desde tu celular.",
    tint: "bg-[#edf5ff] text-[#1f6fe0]",
  },
  {
    icon: MessageSquareText,
    title: "Facturas PDF automáticas a WhatsApp",
    body: "Cumple con la DIAN sin complicaciones.",
    tint: "bg-[#eaf7ff] text-[#0ea5e9]",
  },
  {
    icon: ShieldCheck,
    title: "Protección fiscal con el Radar DIAN",
    body: "Evita multas y mantén tu negocio seguro.",
    tint: "bg-[#eafaf7] text-[#0f766e]",
  },
];

export function Benefits() {
  return (
    <section id="funciones" className="bg-white py-12 md:py-14">
      <Container className="mx-auto max-w-7xl px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, body, tint }) => (
            <div key={title} className="flex items-start gap-4 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${tint}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-[1.1rem] font-bold leading-snug text-ink-900">{title}</h3>
                <p className="mt-2 text-[1rem] leading-relaxed text-ink-500">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
