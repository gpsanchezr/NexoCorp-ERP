"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, CircleAlert } from "lucide-react";
import { AuthHeader } from "@/components/shared/auth-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";

const PASSWORD_REQUIREMENTS = [
  { key: "length", label: "Mínimo 8 caracteres" },
  { key: "uppercase", label: "Al menos una mayúscula" },
  { key: "number", label: "Al menos un número" },
  { key: "special", label: "Al menos un carácter especial (!, #, $)" },
] as const;

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const checks = useMemo(() => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9\s]/.test(password),
  }), [password]);
  const valid = Object.values(checks).every(Boolean) && password === confirmation;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!Object.values(checks).every(Boolean)) return setError("La contraseña no cumple todos los requisitos de seguridad.");
    if (password !== confirmation) return setError("Las contraseñas no coinciden.");
    setLoading(true);
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#e6e6e6]"><AuthHeader /><div className="mx-auto flex max-w-[520px] justify-center px-6 py-10 md:py-16"><section className="w-full rounded-[28px] border border-slate-200/80 bg-[#f1f1f1] p-6 shadow-[0_14px_32px_rgba(15,23,42,0.08)] md:p-8"><p className="text-[15px] font-semibold text-[#4d8bc2]">Seguridad</p><h1 className="mt-2 text-[2.1rem] font-black tracking-[-0.06em] text-[#111827]">Crea tu nueva contraseña</h1><p className="mt-2 text-[17px] text-[#4b5563]">Asegura tu cuenta con una contraseña robusta.</p>
      {success ? <div className="mt-7 space-y-4"><p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Tu contraseña se actualizó correctamente.</p><Link href="/login" className="block text-center font-semibold text-[#2d74d8] hover:underline">Volver al inicio de sesión</Link></div> : <form onSubmit={handleSubmit} className="mt-7 space-y-5"><div className="space-y-2"><label htmlFor="new-password" className="block text-[15px] font-semibold text-[#111827]">Nueva contraseña</label><Input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ingresa nueva contraseña" required className="h-12 rounded-xl bg-[#f9f9f9] px-4 text-[17px]" /></div><div className="space-y-2"><p className="text-[15px] font-semibold text-[#111827]">Requisitos de seguridad</p><div className="space-y-2">{PASSWORD_REQUIREMENTS.map((requirement) => { const passed = checks[requirement.key]; return <p key={requirement.key} className={`flex items-center gap-2 text-sm ${passed ? "text-emerald-700" : "text-slate-600"}`}><span className={`flex h-5 w-5 items-center justify-center rounded-full ${passed ? "bg-[#4d8bc2] text-white" : "border border-slate-300 bg-white"}`}>{passed ? <Check className="h-3 w-3" /> : null}</span>{requirement.label}</p>; })}</div></div><div className="space-y-2"><label htmlFor="confirm-password" className="block text-[15px] font-semibold text-[#111827]">Confirmar nueva contraseña</label><Input id="confirm-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repite tu contraseña" required className={`h-12 rounded-xl bg-[#f9f9f9] px-4 text-[17px] ${confirmation && password !== confirmation ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`} /></div>{confirmation && password !== confirmation ? <p className="flex items-center gap-2 text-sm font-medium text-red-700"><CircleAlert className="h-4 w-4" />Aviso: las contraseñas no coinciden.</p> : null}{error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}<Button type="submit" disabled={loading || !valid} className="h-12 w-full rounded-xl bg-[#2d74d8] text-base">{loading ? "Actualizando..." : "Cambiar contraseña"}</Button></form>}
    </section></div></main>
  );
}