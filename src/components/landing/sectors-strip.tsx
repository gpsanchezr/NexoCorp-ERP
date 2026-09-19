import { Logo } from "@/components/shared/logo";
import { Container } from "./container";

const SECTORS = ["Farmacias", "Restaurantes", "Ferreterías", "Peluquerías", "Misceláneas"];

export function SectorsStrip() {
  return (
    <section className="bg-[#071327] py-5 text-white">
      <Container className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-3">
          <Logo dark withTagline={false} />
        </div>

        <div className="hidden items-center gap-6 text-sm text-white/75 md:flex">
          {SECTORS.map((sector) => (
            <span key={sector}>{sector}</span>
          ))}
        </div>
      </Container>
    </section>
  );
}
