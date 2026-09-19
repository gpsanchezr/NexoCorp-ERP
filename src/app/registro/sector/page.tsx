"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ArrowLeft } from "lucide-react";
import { SECTORS } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AuthHeader } from "@/components/shared/auth-header";

export default function RegistroSectorPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedSector = useMemo(
    () => SECTORS.find((sector) => sector.key === selected) ?? null,
    [selected]
  );

  const handleContinue = async () => {
    if (!selected) {
      setError("Selecciona un sector para continuar.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const supabase = (await import("@/utils/supabase/client")).createClient();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user?.id) {
        throw new Error("No se pudo identificar el usuario autenticado");
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role: "owner" })
        .eq("id", userData.user.id);

      if (profileError) {
        throw profileError;
      }

      const { error: businessError } = await supabase
        .from("businesses")
        .update({ sector: selected })
        .eq("id", (await supabase.from("profiles").select("business_id").eq("id", userData.user.id).single()).data?.business_id ?? "");

      if (businessError) {
        throw businessError;
      }

      router.push("/app/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo guardar el sector.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#e6e6e6]">
      <AuthHeader />

      <div className="mx-auto flex max-w-[980px] justify-center px-6 py-10 md:py-16">
        <section className="w-full rounded-[28px] border border-slate-200/80 bg-[#f1f1f1] p-5 shadow-[0_14px_32px_rgba(15,23,42,0.08)] md:p-8 lg:p-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold text-[#4d8bc2]">Paso 2 de 2</p>
              <h1 className="mt-2 text-[2.2rem] font-black tracking-[-0.06em] text-[#111827]">¿A qué se dedica tu negocio?</h1>
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECTORS.map((sector) => {
              const Icon = sector.icon;
              const active = selected === sector.key;

              return (
                <button
                  key={sector.key}
                  type="button"
                  onClick={() => setSelected(sector.key)}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-2xl border p-4 text-center transition-all",
                    active
                      ? "border-[#5d9eea] bg-[#edf5ff] text-[#1d4f9d] shadow-sm"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                  )}
                >
                  <Icon className="h-7 w-7" />
                  <span className="text-base font-semibold">{sector.label}</span>
                </button>
              );
            })}
          </div>

          {selectedSector ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Sector seleccionado: <span className="font-semibold">{selectedSector.label}</span>
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-7 flex justify-center">
            <Button
              type="button"
              onClick={handleContinue}
              disabled={saving || !selected}
              className="h-12 w-full max-w-[280px] rounded-xl bg-[#2d74d8] text-base font-semibold text-white shadow-sm hover:bg-[#255fb6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Continuar"}
            </Button>
          </div>

          <p className="mt-6 text-center text-[14px] text-slate-500">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-[#2d74d8] hover:underline">
              Inicia sesión
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
