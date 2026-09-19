import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Container } from "./container";

const LINKS = [
  { href: "#inicio", label: "Inicio" },
  { href: "#funciones", label: "Funciones" },
  { href: "#precios", label: "Precios" },
  { href: "#testimonios", label: "Testimonios" },
];

export function LandingNav() {
  return (
    <header className="bg-[#071327] text-white">
      <Container className="mx-auto max-w-7xl px-6">
        <div className="flex h-20 items-center justify-between gap-4">
          <Link href="/" aria-label="Ir al inicio" className="shrink-0">
            <Logo dark withTagline={false} />
          </Link>

          <nav aria-label="Navegacion principal" className="hidden items-center gap-8 md:flex">
            {LINKS.map((link) => (
              <a
                key={link.href + link.label}
                href={link.href}
                className="text-sm font-medium text-white/80 transition hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="hidden bg-white/5 text-white hover:bg-white/10 sm:inline-flex">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild size="sm" className="bg-[#1e7df2] text-white hover:bg-[#0f6fe6]">
              <Link href="/registro">Prueba gratis</Link>
            </Button>
          </div>
        </div>

        <nav aria-label="Navegacion movil" className="-mx-2 flex gap-2 overflow-x-auto pb-4 md:hidden">
          {LINKS.map((link) => (
            <a
              key={link.href + link.label}
              href={link.href}
              className="shrink-0 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </Container>
    </header>
  );
}
