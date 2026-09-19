"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthHeader } from "@/components/shared/auth-header";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const clearGhostSession = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) return;

        await supabase.auth.signOut();

        if (typeof window !== "undefined") {
          window.localStorage.clear();
          window.sessionStorage.clear();
        }
      } catch {
        // Silenciar limpieza de sesión fantasma en la ruta de login.
      }
    };

    void clearGhostSession();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      router.push("/app/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo iniciar sesión.";
      setError(message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#e6e6e6]">
      <AuthHeader />

      <div className="mx-auto flex max-w-[520px] justify-center px-6 py-10 md:py-16">
        <section className="w-full rounded-[28px] border border-slate-200/80 bg-[#f1f1f1] p-6 shadow-[0_14px_32px_rgba(15,23,42,0.08)] md:p-8">
          <p className="text-[15px] font-semibold text-[#4d8bc2]">Bienvenido</p>
          <h1 className="mt-2 text-[2.1rem] font-black tracking-[-0.06em] text-[#111827]">Inicia sesión</h1>
          <p className="mt-2 text-[17px] font-normal text-[#4b5563]">Accede a tu comercio y continúa con tu flujo.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[15px] font-semibold text-[#111827]">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@correo.com"
                className="h-12 rounded-xl border border-slate-300 bg-[#f9f9f9] px-4 text-[17px] text-slate-800 placeholder:text-slate-400 focus:border-[#5d9eea] focus:ring-2 focus:ring-[#dfeefe]"
              />
            </div>

            <div className="flex justify-end">
              <Link href="/recuperar" className="text-sm font-semibold text-[#245b8f] hover:text-[#17456f]">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-[15px] font-semibold text-[#111827]">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••••"
                  className="h-12 rounded-xl border border-slate-300 bg-[#f9f9f9] px-4 pr-10 text-[17px] text-slate-800 placeholder:text-slate-400 focus:border-[#5d9eea] focus:ring-2 focus:ring-[#dfeefe]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="h-12 w-full rounded-xl bg-[#2d74d8] text-base font-semibold text-white hover:bg-[#255fb6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>

            <Link href="/registro" className="block w-full rounded-xl border border-[#2d74d8] bg-white px-4 py-3 text-center text-base font-semibold text-[#2d74d8] transition hover:bg-[#f1f7ff]">
              Registrarse
            </Link>
          </form>

          <p className="mt-6 text-center text-[14px] text-slate-500">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="font-semibold text-[#2d74d8] hover:underline">
              Regístrate
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
