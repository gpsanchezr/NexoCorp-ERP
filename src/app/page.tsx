import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Benefits } from "@/components/landing/benefits";
import { Pricing } from "@/components/landing/pricing";
import { SectorsStrip } from "@/components/landing/sectors-strip";
import { Testimonials } from "@/components/landing/testimonials";
import { FinalCta, LandingFooter } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <main>
      <LandingNav />
      <Hero />
      <Benefits />
      <SectorsStrip />
      <Pricing />
      <Testimonials />
      <FinalCta />
      <LandingFooter />
    </main>
  );
}
