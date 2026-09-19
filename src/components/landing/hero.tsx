import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "./container";

export function Hero() {
  return (
    <section id="inicio" className="w-full bg-[#071327] px-6 py-12 md:py-16 lg:py-20">
      <Container className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="max-w-[650px]">
          <h1 className="text-[2.8rem] font-extrabold leading-[0.96] text-white sm:text-[3.4rem] lg:text-[4.6rem]">
            Organiza tu inventario, automatiza tus facturas y evita multas de la DIAN sin enredos.
          </h1>

          <p className="mt-6 max-w-[620px] text-base text-gray-300 md:text-lg">
            El ERP y POS en la nube para negocios locales. Fácil, rápido y seguro.
          </p>

          <div className="mt-8">
            <Button
              asChild
              size="xl"
              className="rounded-[1.15rem] bg-[#1d7ef2] px-6 py-5 text-lg font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-[#0f6fe6]"
            >
              <Link href="/registro" className="inline-flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg">
                  <Plus className="h-4 w-4" />
                </span>
                <span>Prueba gratis por 30 días</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>

            <p className="mt-3 text-sm text-gray-300">Sin tarjeta de crédito</p>
          </div>
        </div>

        <div className="w-full flex justify-center lg:justify-end items-center relative z-10">
          <img 
            src="/images/imagen_pc_celular.jpg" 
            alt="NexoCorp ERP en PC y Celular" 
            className="w-full max-w-[500px] lg:max-w-[650px] h-auto object-contain drop-shadow-2xl" 
          />
        </div>
      </Container>
    </section>
  );
}
