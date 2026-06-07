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
          "df-stamp-logo inline-flex aspect-square items-center justify-center rounded-full border-2 border-df-red px-3 text-center font-brand text-df-red",
          className,
        )}
        aria-label="Dr Föld dokumentum pecsét"
      >
        <div className="-rotate-6">
          <div className="text-lg font-black leading-none">DR</div>
          <div className="text-xl font-black leading-none">FÖLD</div>
          <div className="mt-1 border-t border-df-red pt-1 text-[9px] font-black uppercase tracking-wide">
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
          "inline-flex aspect-square items-center justify-center rounded-xl border-2 border-df-green bg-df-green px-2 font-brand text-df-card shadow-[3px_3px_0_var(--df-border)]",
          className,
        )}
        aria-label="Dr Föld"
      >
        <div className="text-center text-[15px] font-black leading-[0.9] tracking-wide">
          <div>DR</div>
          <div>FÖLD</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-2xl border-2 border-df-green bg-df-card p-2 pr-4 shadow-[4px_4px_0_var(--df-border)]",
        className,
      )}
      aria-label="Dr Föld - Ravasz a gazda."
    >
      <div className="relative grid h-14 w-14 place-items-center rounded-xl border-2 border-df-green bg-df-cream">
        <div className="absolute top-1 h-2 w-10 rounded-sm bg-df-green" />
        <div className="mt-2 h-9 w-8 rounded-sm border-2 border-df-green bg-df-card shadow-sm">
          <div className="mx-auto mt-1 h-1.5 w-4 rounded-full bg-df-yellow" />
          <div className="mx-auto mt-1 grid w-5 grid-cols-3 gap-0.5">
            <span className="h-2 rounded-sm bg-df-yellow" />
            <span className="h-4 rounded-sm bg-df-green" />
            <span className="h-2.5 rounded-sm bg-df-gray" />
          </div>
        </div>
        <span className="absolute -right-1 -bottom-1 grid h-5 w-5 place-items-center rounded-full border-2 border-df-card bg-df-red text-[11px] font-black text-df-card">
          1
        </span>
      </div>
      <div className="leading-none">
        <div className="font-brand text-2xl font-black tracking-wide text-df-green">DR FÖLD</div>
        <div className="-mt-0.5 inline-flex -rotate-1 rounded-sm bg-df-yellow px-2 py-1 font-brand text-[11px] font-black uppercase tracking-wide text-df-ink">
          Ravasz a gazda.
        </div>
      </div>
    </div>
  );
}
