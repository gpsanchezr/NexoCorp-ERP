"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useDataStore } from "@/store/useDataStore";
import { Logo } from "@/components/shared/logo";

/**
 * Los stores de Zustand usan `persist` con `skipHydration: true`. Eso evita que
 * Next.js (SSR) y el primer render del navegador no coincidan (el servidor no
 * tiene localStorage). Aquí disparamos la rehidratación manualmente, ya montado
 * el árbol en el cliente, y mostramos una pantalla breve mientras tanto.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    Promise.all([useAuthStore.persist.rehydrate(), useDataStore.persist.rehydrate()]).finally(() =>
      setHydrated(true)
    );
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const goOnline = () => useDataStore.getState().setOnline(true);
    const goOffline = () => useDataStore.getState().setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    useDataStore.getState().setOnline(navigator.onLine);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // El PWA offline-first es una mejora progresiva — si falla el registro
        // (p. ej. en un navegador sin soporte), la app sigue funcionando normal.
      });
    }

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [hydrated]);

  if (!hydrated) {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-white">
        <Logo className="h-9 w-auto animate-fade-in" />
        <div className="h-1 w-32 overflow-hidden rounded-full bg-ink-100">
          <div className="h-full w-1/3 animate-loading-x rounded-full bg-brand-600" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
