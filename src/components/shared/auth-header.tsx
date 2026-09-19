import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export function AuthHeader() {
  return (
    <header className="flex h-16 items-center border-b border-slate-700 bg-[#1b2430] px-6 shadow-sm shadow-slate-900/20">
      <Link href="/" aria-label="Ir a la página principal">
        <Logo dark />
      </Link>
    </header>
  );
}