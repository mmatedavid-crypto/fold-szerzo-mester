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
    <Collapsible open={open} onOpenChange={setOpen} className="border rounded p-3 bg-card">
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium w-full text-left cursor-pointer">
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        Ritkább kivételek
        {value.length > 0 && <span className="ml-auto text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">{value.length} bejelölve</span>}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-2">
        <p className="text-xs text-muted-foreground">
          Az alábbi esetekben a főszabály szerinti rangsor nem alkalmazható közvetlenül.
        </p>
        {TRANSACTION_EXCEPTIONS.map((e) => (
          <label key={e.value} className="flex items-center gap-2 text-sm cursor-pointer">
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