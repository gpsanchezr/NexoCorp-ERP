import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/config";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="currentColor" className="text-brand-600" />
      <path
        d="M9 9 L16 16 L9 23"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M23 9 L16 16 L23 23"
        stroke="white"
        strokeOpacity="0.55"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({
  className,
  dark = false,
  withTagline = false,
}: {
  className?: string;
  dark?: boolean;
  withTagline?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="h-8 w-8 shrink-0" />
      <div className="flex flex-col leading-none">
        <span className={cn("text-lg font-bold tracking-tight", dark ? "text-white" : "text-ink-900")}>
          {APP_NAME}
        </span>
        {withTagline && (
          <span className={cn("text-[11px] font-medium", dark ? "text-white/60" : "text-ink-400")}>
            Tu negocio en la nube
          </span>
        )}
      </div>
    </div>
  );
}
