import { cn } from "@/lib/utils";

type DrFoldLogoProps = {
  variant?: "full" | "compact" | "stamp";
  className?: string;
};

export function DrFoldLogo({ variant = "full", className }: DrFoldLogoProps) {
  if (variant === "stamp") {
    return (
      <div
        className={cn(
          "grid aspect-square place-items-center rounded-full border border-df-red/80 px-3 text-center text-df-red",
          className,
        )}
        aria-label="Dr Föld dokumentum pecsét"
      >
        <div className="-rotate-6">
          <div className="font-brand text-lg font-bold leading-none">Dr Föld</div>
          <div className="mt-1 border-t border-df-red pt-1 text-[9px] font-bold uppercase tracking-[0.18em]">
            Dokumentum
          </div>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-md border border-df-green bg-df-card text-df-green",
          className,
        )}
        aria-label="Dr Föld"
      >
        <Monogram className="h-7 w-7" />
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)} aria-label="Dr Föld">
      <Monogram className="h-10 w-10 text-df-green" />
      <div className="leading-none">
        <div className="font-brand text-2xl font-bold tracking-[-0.02em] text-df-green">
          Dr Föld
        </div>
        <div className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.22em] text-df-green">
          Ravasz a gazda
        </div>
      </div>
    </div>
  );
}

function Monogram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path
        d="M8 40C18 37.5 25 31.2 27.5 20.8C29.2 13.8 25.4 8.2 18.4 6.5H8V40Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 39C29.2 38.4 38 30.3 39.4 18.3C31 18.8 24.1 22.4 19.9 28.6C17.9 31.7 16.8 35.2 17.5 39Z"
        fill="currentColor"
        opacity="0.12"
      />
      <path
        d="M17.5 39C29.2 38.4 38 30.3 39.4 18.3C31 18.8 24.1 22.4 19.9 28.6C17.9 31.7 16.8 35.2 17.5 39Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M13.5 31.5C19.8 30.7 26.6 25.6 31 16" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
