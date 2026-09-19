"use client";

import { useState } from "react";
import { ShieldAlert, X } from "lucide-react";
import type { SanitaryConflict } from "@/lib/alerts";

export function SanitaryBanner({ conflicts }: { conflicts: SanitaryConflict[] }) {
  const [dismissed, setDismissed] = useState(false);
  if (conflicts.length === 0 || dismissed) return null;

  const first = conflicts[0];
  const otherSensitiveCount = new Set(conflicts.map((c) => c.sensitive.id)).size - 1;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-danger-100 bg-danger-50 p-4">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger-600" />
      <div className="flex-1">
        <p className="text-sm font-bold text-danger-700">Alerta Sanitaria</p>
        <p className="mt-0.5 text-sm text-danger-600">
          No puedes almacenar <span className="font-semibold">{first.hazard.name}</span> junto a{" "}
          <span className="font-semibold">{first.sensitive.name}</span>
          {otherSensitiveCount > 0 ? ` y ${otherSensitiveCount} producto(s) más` : ""} — riesgo de contaminación.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 text-danger-400 hover:text-danger-600"
        aria-label="Cerrar aviso"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
