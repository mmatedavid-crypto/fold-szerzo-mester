import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { TRANSACTION_EXCEPTIONS } from "@/lib/rank/rankPresets";
import type { TransactionException } from "@/lib/rank/leaseTypes";

export function ExceptionsCollapsible({
  value,
  onChange,
}: {
  value: TransactionException[];
  onChange: (next: TransactionException[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (e: TransactionException) =>
    onChange(value.includes(e) ? value.filter((x) => x !== e) : [...value, e]);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded border border-df-border bg-df-card p-3 shadow-sm"
    >
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-2 text-left text-sm font-semibold text-df-green">
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        Ritkább kivételek
        {value.length > 0 && (
          <span className="ml-auto rounded-full border border-df-yellow bg-df-yellow/15 px-2 py-0.5 text-xs font-semibold text-df-green">
            {value.length} bejelölve
          </span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-2">
        <p className="rounded-md border border-df-border bg-df-cream/60 p-2 text-xs leading-5 text-df-gray">
          Az alábbi esetekben a főszabály szerinti rangsor nem alkalmazható közvetlenül.
        </p>
        {TRANSACTION_EXCEPTIONS.map((e) => (
          <label
            key={e.value}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-df-border bg-white px-3 py-2 text-sm text-df-ink transition hover:bg-df-cream/60"
          >
            <Checkbox
              checked={value.includes(e.value as TransactionException)}
              onCheckedChange={() => toggle(e.value as TransactionException)}
            />
            {e.label}
          </label>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
