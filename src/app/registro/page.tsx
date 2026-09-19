"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  CircleGauge,
  Coffee,
  Croissant,
  Dog,
  Eye,
  EyeOff,
  Flower2,
  Headphones,
  Leaf,
  Pill,
  ReceiptText,
  Scissors,
  ShieldCheck,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Store,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";
import { AuthHeader } from "@/components/shared/auth-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";

type FormState = {
  firstName: string;
  lastName: string;
  businessName: string;
  businessType: string;
  city: string;
  country: string;
  address: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  businessName: "",
  businessType: "",
  city: "",
  country: "Colombia",
  address: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const PASSWORD_REQUIREMENTS = [
  { key: "length", label: "Mínimo 8 caracteres" },
  { key: "uppercase", label: "Al menos una mayúscula" },
  { key: "number", label: "Al menos un número" },
  { key: "special", label: "Al menos un carácter especial (!, #, $)" },
] as const;

const inputClassName = "h-12 rounded-xl border border-slate-300 bg-[#f9f9f9] px-4 text-[17px] text-slate-800 placeholder:text-slate-400 focus:border-[#5d9eea] focus:ring-2 focus:ring-[#dfeefe]";

const sectorOptions = [
  { key: "farmacia", label: "Farmacia", icon: Pill },
  { key: "restaurante", label: "Restaurante", icon: UtensilsCrossed },
  { key: "ferreteria", label: "Ferretería", icon: Wrench },
  { key: "peluqueria", label: "Peluquería", icon: Scissors },
  { key: "panaderia", label: "Panadería", icon: Croissant },
  { key: "tienda", label: "Tienda", icon: Store },
  { key: "miscelanea", label: "Miscelánea", icon: ShoppingBasket },
  { key: "ropa", label: "Ropa", icon: Shirt },
  { key: "taller", label: "Taller", icon: CircleGauge },
  { key: "tecnologia", label: "Tecnología", icon: Smartphone },
  { key: "agro", label: "Agro", icon: Leaf },
  { key: "veterinaria", label: "Veterinaria", icon: Dog },
  { key: "cafe", label: "Café", icon: Coffee },
  { key: "floristeria", label: "Floristería", icon: Flower2 },
] as const;

const benefitItems = [
  { icon: ReceiptText, label: "Facturación electrónica" },
  { icon: Boxes, label: "Control de inventario" },
  { icon: BarChart3, label: "Reportes y finanzas" },
  { icon: Headphones, label: "Soporte 24/7" },
] as const;

export default function RegistroPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistrationSuccessful, setIsRegistrationSuccessful] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!isRegistrationSuccessful) return;
    const timer = window.setTimeout(() => router.push("/login"), 2000);
    return () => window.clearTimeout(timer);
  }, [isRegistrationSuccessful, router]);

  const passwordChecks = useMemo(
    () => ({
      length: form.password.length >= 8,
      uppercase: /[A-Z]/.test(form.password),
      number: /\d/.test(form.password),
      special: /[^A-Za-z0-9\s]/.test(form.password),
    }),
    [form.password]
  );

  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const isFormValid =
    form.firstName.trim() !== "" &&
    form.lastName.trim() !== "" &&
    form.businessName.trim() !== "" &&
    form.businessType !== "" &&
    form.city.trim() !== "" &&
    form.country.trim() !== "" &&
    form.email.trim() !== "" &&
    form.phone.trim() !== "" &&
    Object.values(passwordChecks).every(Boolean) &&
    passwordsMatch;

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrorMessage("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!isFormValid) {
      setErrorMessage("Completa los campos obligatorios y corrige la contraseña antes de continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      });

      if (signUpError) throw signUpError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("No se pudo crear el usuario autenticado.");

      const businessId = crypto.randomUUID();
      const businessName = form.businessName.trim();
      const businessSlug = businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "negocio";

      const { error: businessError } = await supabase.from("businesses").insert({
        id: businessId,
        name: businessName,
        business_name: businessName,
        slug: businessSlug,
        sector: form.businessType,
        business_type: form.businessType,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        address: form.address.trim() || null,
        phone: form.phone.trim(),
      });

      if (businessError) throw businessError;

      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        business_id: businessId,
        full_name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        role: "owner",
      });

      if (profileError) throw profileError;

      setIsRegistrationSuccessful(true);
    } catch (error: unknown) {
      console.error("Error detallado:", error);
      const message = error instanceof Error ? error.message : "No se pudo completar el registro.";
      setErrorMessage(
        /already registered|already.*exist|duplicate|usuario.*registrado/i.test(message)
          ? "Este correo ya está registrado. Intenta con otro o inicia sesión."
          : message || "Ocurrió un error al registrar tu cuenta. Inténtalo de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRegistrationSuccessful) {
    return (
      <main className="min-h-screen bg-[#e6e6e6]">
        <AuthHeader />
        <div className="mx-auto flex max-w-[980px] justify-center px-6 py-10 md:py-16">
          <section className="flex min-h-[420px] w-full flex-col items-center justify-center rounded-[28px] bg-[#f1f1f1] p-5 text-center shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            <h1 className="mt-5 text-[2.2rem] font-black text-[#111827]">¡Cuenta creada con éxito!</h1>
            <p className="mt-3 text-[17px] text-[#4b5563]">Serás redirigido al inicio de sesión en unos segundos.</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef5fb]">
      <AuthHeader />

      <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 lg:py-12">
        <section className="overflow-hidden rounded-[26px] bg-white shadow-[0_18px_42px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80 lg:grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="bg-white p-5 md:p-8 lg:p-10">
            <p className="text-[15px] font-semibold text-[#4d8bc2]">Crear cuenta</p>
            <h1 className="mt-2 text-[2.2rem] font-black tracking-[-0.06em] text-[#111827]">Información del negocio</h1>
            <p className="mt-2 text-[17px] text-[#4b5563]">Configura tu cuenta y los datos principales de tu comercio.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-7">
              <fieldset className="space-y-4">
                <legend className="text-lg font-bold text-[#111827]">Propietario</legend>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="firstName">Nombre(s)</label>
                    <Input id="firstName" value={form.firstName} onChange={(event) => updateField("firstName", event.target.value)} required className={inputClassName} />
                  </div>
                  <div>
                    <label htmlFor="lastName">Apellido(s)</label>
                    <Input id="lastName" value={form.lastName} onChange={(event) => updateField("lastName", event.target.value)} required className={inputClassName} />
                  </div>
                </div>
              </fieldset>

              <fieldset className="space-y-4">
                <legend className="text-lg font-bold text-[#111827]">Negocio</legend>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="businessName">Nombre de tu negocio</label>
                    <Input id="businessName" value={form.businessName} onChange={(event) => updateField("businessName", event.target.value)} required className={inputClassName} />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Sector del negocio</label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {sectorOptions.map(({ key, label, icon: Icon }) => {
                        const active = form.businessType === label;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => updateField("businessType", label)}
                            className={[
                              "flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition-all duration-200",
                              active
                                ? "border-[#3c82ea] bg-[#edf5ff] text-[#184ea2] shadow-md shadow-blue-100"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                            ].join(" ")}
                          >
                            <span className={[
                              "flex h-10 w-10 items-center justify-center rounded-xl",
                              active ? "bg-[#dfeeff] text-[#215ec3]" : "bg-slate-100 text-slate-600",
                            ].join(" ")}>
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className="text-[13px] font-semibold leading-tight">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <button type="button" className="mt-3 inline-flex text-sm font-medium text-[#2d74d8] transition hover:text-[#1f5ab3]">
                      Ver todos los sectores (20+)
                    </button>
                  </div>
                </div>
              </fieldset>

              <fieldset className="space-y-4">
                <legend className="text-lg font-bold text-[#111827]">Ubicación</legend>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="city">Ciudad</label>
                    <Input id="city" value={form.city} onChange={(event) => updateField("city", event.target.value)} required className={inputClassName} />
                  </div>
                  <div>
                    <label htmlFor="country">País</label>
                    <Input id="country" value={form.country} onChange={(event) => updateField("country", event.target.value)} required className={inputClassName} />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="address">Dirección (Opcional)</label>
                    <Input id="address" value={form.address} onChange={(event) => updateField("address", event.target.value)} className={inputClassName} />
                  </div>
                </div>
              </fieldset>

              <fieldset className="space-y-4">
                <legend className="text-lg font-bold text-[#111827]">Credenciales</legend>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label htmlFor="email">Correo Electrónico</label>
                    <Input id="email" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required className={inputClassName} />
                  </div>

                  <div>
                    <label htmlFor="phone">Teléfono / WhatsApp</label>
                    <Input id="phone" type="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} required className={inputClassName} />
                  </div>

                  <div>
                    <label htmlFor="password">Contraseña</label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => updateField("password", event.target.value)} required className={`${inputClassName} pr-10`} />
                      <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                    <div className="relative">
                      <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} required className={`${inputClassName} pr-10`} />
                      <button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  {PASSWORD_REQUIREMENTS.map(({ key, label }) => {
                    const active = passwordChecks[key];
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className={active ? "text-emerald-600" : "text-slate-400"}>
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                        <span className={active ? "text-emerald-700" : "text-slate-600"}>{label}</span>
                      </div>
                    );
                  })}

                  {form.confirmPassword.length > 0 ? (
                    <div className="flex items-center gap-2 pt-1">
                      <span className={passwordsMatch ? "text-emerald-600" : "text-slate-400"}>
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                      <span className={passwordsMatch ? "text-emerald-700" : "text-slate-600"}>Las contraseñas coinciden</span>
                    </div>
                  ) : null}
                </div>
              </fieldset>

              {errorMessage ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <Button type="submit" disabled={isSubmitting || !isFormValid} className="h-12 w-full bg-[#2d74d8] text-base font-semibold text-white hover:bg-[#255fb6] disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? "Creando cuenta..." : "Continuar"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              ¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-[#2d74d8]">Inicia sesión</Link>
            </p>
          </div>

          <aside
            className="relative flex min-h-[340px] bg-cover bg-center text-white lg:min-h-full"
            style={{
              backgroundImage:
                'linear-gradient(rgba(2, 6, 23, 0.68), rgba(2, 6, 23, 0.68)), url("/images/imagen_tienda.jpg")',
            }}
          >
            <div className="relative z-10 flex h-full w-full flex-col justify-center px-6 py-10 sm:px-8 lg:px-10">
              <div className="mx-auto w-full max-w-md text-center">
                <h2 className="text-4xl font-black leading-tight tracking-[-0.05em]">Tu aliado en el crecimiento de tu negocio</h2>

                <ul className="mt-10 space-y-4 text-left">
                  {benefitItems.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-3 rounded-2xl bg-slate-950/45 px-4 py-3 ring-1 ring-white/10">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-emerald-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-base font-medium text-slate-100">{label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-12 flex items-center justify-center gap-3 rounded-full border border-white/10 bg-slate-950/45 px-4 py-3 text-sm font-medium text-slate-100">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span>Datos seguros con Supabase</span>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
