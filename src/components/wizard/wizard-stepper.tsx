import { Check } from "lucide-react";

export function WizardStepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap gap-2 text-xs">
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo";
        return (
          <li key={s} className={
            "flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 font-semibold transition-colors " +
            (state === "done" ? "border-df-green bg-df-green/10 text-df-green" :
             state === "active" ? "border-df-green bg-df-card text-df-green shadow-sm" :
             "border-df-border bg-white/70 text-df-gray")
          }>
            {state === "done" ? <Check className="h-3.5 w-3.5" /> : <span className={"grid h-5 w-5 place-items-center rounded-full text-[11px] " + (state === "active" ? "bg-df-green text-white" : "bg-df-cream text-df-gray")}>{i + 1}</span>}
            {s}
          </li>
        );
      })}
    </ol>
  );
}
