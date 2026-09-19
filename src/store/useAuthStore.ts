"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_ADMIN, MOCK_BUSINESS, MOCK_CASHIER, MOCK_OWNER } from "@/lib/mock-data";
import type { Business, SectorKey, UserRole } from "@/lib/types";

interface AuthState {
  hasOnboarded: boolean;
  business: Business;
  userName: string;
  role: UserRole;
  /** Cambia de owner <-> cashier. No es autenticación real: sirve para demostrar
   *  ambas vistas sin tener que montar un backend de auth completo (ver manual
   *  del desarrollador, sección "Roles y autenticación"). */
  switchRole: (role: UserRole) => void;
  completeOnboarding: (input: { businessName: string; sector: SectorKey; city: string }) => void;
  resetOnboarding: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      hasOnboarded: true,
      business: MOCK_BUSINESS,
      userName: MOCK_OWNER.name,
      role: "owner",
      switchRole: (role) =>
        set({
          role,
          userName:
            role === "owner" ? MOCK_OWNER.name : role === "admin" ? MOCK_ADMIN.name : MOCK_CASHIER.name,
        }),
      completeOnboarding: ({ businessName, sector, city }) =>
        set((state) => ({
          hasOnboarded: true,
          business: {
            ...state.business,
            name: businessName || state.business.name,
            sector,
            city: city || state.business.city,
            slug: (businessName || state.business.name)
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, ""),
            trialStartDate: new Date().toISOString(),
          },
        })),
      resetOnboarding: () => set({ hasOnboarded: false }),
    }),
    { name: "nexocorp-auth", skipHydration: true }
  )
);
