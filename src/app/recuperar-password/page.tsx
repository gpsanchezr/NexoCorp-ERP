"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare } from "lucide-react";
import { AuthHeader } from "@/components/shared/auth-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";

type RecoveryMethod = "email" | "sms";

export default function RecoverPasswordPage() {
  const [method, setMethod] = useState<RecoveryMethod>("email");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const supabase = createClient();

      if (method === "email") {
        const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(value.trim(), {
          redirectTo: `${window.location.origin}/restablecer`,
        });
        if (recoveryError) throw recoveryError;
        setMessage("Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo.");
      } else {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone: value.trim(),
          options: { channel: "sms" },
        });
        if (otpError) throw otpError;
        setCodeSent(true);
        setMessage("Te enviamos un código por SMS al celular registrado.");
      }
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo enviar la verificación.");
    } finally {
      setLoading(false);
    }
  };

  const verifySmsCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({ phone: value.trim(), token: code.trim(), type: "sms" });
      if (verifyError) throw verifyError;
      window.location.href = "/restablecer-password";
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "El código no es válido.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#e6e6e6]">
      <AuthHeader />
      <div className="mx-auto flex max-w-[520px] justify-center px-6 py-10 md:py-16">
        <section className="w-full rounded-[28px] border border-slate-200/80 bg-[#f1f1f1] p-6 shadow-[0_14px_32px_rgba(15,23,42,0.08)] md:p-8">
          <p className="text-[15px] font-semibold text-[#4d8bc2]">Recuperar acceso</p>
          <h1 className="mt-2 text-[2.1rem] font-black tracking-[-0.06em] text-[#111827]">Restablece tu contraseña</h1>
          <p className="mt-2 text-[17px] text-[#4b5563]">Elige cómo recibir tu código de verificación.</p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {([
              ["email", Mail, "Correo electrónico"],
              ["sms", MessageSquare, "Mensaje de texto"],
            ] as const).map(([option, Icon, label]) => (
              <button key={option} type="button" onClick={() => { setMethod(option); setCodeSent(false); setMessage(""); setError(""); }} className={`rounded-2xl border p-4 text-left transition ${method === option ? "border-[#2d74d8] bg-[#edf5ff]" : "border-slate-300 bg-white hover:border-slate-400"}`}>
                <Icon className="h-6 w-6 text-[#2d74d8]" />
                <span className="mt-3 block font-semibold text-slate-900">{label}</span>
                <span className="mt-1 block text-sm text-slate-500">{option === "email" ? "Recibe un enlace seguro" : "Recibe un código en tu celular"}</span>
              </button>
            ))}
          </div>

          {!codeSent ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="space-y-2">
                <label htmlFor="recovery-value" className="block text-[15px] font-semibold text-[#111827]">{method === "email" ? "Correo electrónico" : "Celular registrado"}</label>
                <Input id="recovery-value" type={method === "email" ? "email" : "tel"} value={value} onChange={(event) => setValue(event.target.value)} placeholder={method === "email" ? "tu@correo.com" : "+57 300 000 0000"} required className="h-12 rounded-xl bg-[#f9f9f9] px-4 text-[17px]" />
              </div>
              <Button type="submit" disabled={loading || !value.trim()} className="h-12 w-full rounded-xl bg-[#2d74d8] text-base">{loading ? "Enviando..." : "Continuar"}</Button>
            </form>
          ) : (
            <form onSubmit={verifySmsCode} className="mt-6 space-y-5">
              <div className="space-y-2"><label htmlFor="sms-code" className="block text-[15px] font-semibold text-[#111827]">Código de verificación</label><Input id="sms-code" inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} placeholder="123456" required className="h-12 rounded-xl bg-[#f9f9f9] px-4 text-[17px]" /></div>
              <Button type="submit" disabled={loading || !code.trim()} className="h-12 w-full rounded-xl bg-[#2d74d8] text-base">{loading ? "Verificando..." : "Verificar código"}</Button>
            </form>
          )}

          {message ? <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          <p className="mt-6 text-center text-sm text-slate-500"><Link href="/login" className="font-semibold text-[#2d74d8] hover:underline">Volver al inicio de sesión</Link></p>
        </section>
      </div>
    </main>
  );
}