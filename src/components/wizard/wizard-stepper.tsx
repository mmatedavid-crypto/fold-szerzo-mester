import { Check } from "lucide-react";

export function WizardStepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap gap-2 text-xs">
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo";
        return (
          <li key={s} className={
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 " +
            (state === "done" ? "border-primary bg-primary/10 text-primary" :
             state === "active" ? "border-primary text-primary font-medium" :
             "border-border text-muted-foreground")
          }>
            {state === "done" ? <Check className="h-3 w-3" /> : <span className="font-mono">{i + 1}.</span>}
            {s}
          </li>
        );
      })}
    </ol>
  );
}