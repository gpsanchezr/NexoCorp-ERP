import { AppShell } from "@/components/shared/app-shell";
import { createClient } from "@/utils/supabase/server";
import type { UserRole } from "@/lib/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type AppIdentity = {
  userName: string;
  businessName: string;
  city: string;
  sector: string;
  trialStartDate: string;
  role: UserRole;
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, business_id, role")
    .eq("id", user.id)
    .single();

  const { data: business } = profile?.business_id
    ? await supabase
        .from("businesses")
        .select("business_name, name, city, sector, trial_start_date")
        .eq("id", profile.business_id)
        .single()
    : { data: null };

  const rawRole = profile?.role;
  const role: UserRole = rawRole === "admin" || rawRole === "cashier" || rawRole === "owner" ? rawRole : "owner";

  const identity: AppIdentity = {
    userName: profile?.full_name || user.user_metadata?.full_name || user.email || "Usuario",
    businessName: business?.business_name || business?.name || "Tu negocio",
    city: business?.city || "",
    sector: business?.sector || "otro",
    trialStartDate: business?.trial_start_date || new Date().toISOString(),
    role,
  };

  return <AppShell initialIdentity={identity}>{children}</AppShell>;
}
