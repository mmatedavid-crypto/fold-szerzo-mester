import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const EXCEPTIONS = [
  "hozzátartozói láncolat",
  "gazdaságátadási szerződés",
  "mezőgazdasági termelőszervezet és tag / alkalmazott speciális esete",
  "erdőbirtokossági társulat és tagja",
  "tanya haszonbérlete",
  "CSMT és tagja",
  "öntözéses gazdálkodási törvény szerinti eset",
  "nem tudom",
];

export function ExceptionsCollapsible({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (e: string) =>
    onChange(value.includes(e) ? value.filter((x) => x !== e) : [...value, e]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border rounded p-3">
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium w-full text-left cursor-pointer">
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        Speciális kivételek
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-2">
        {EXCEPTIONS.map((e) => (
          <label key={e} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={value.includes(e)} onCheckedChange={() => toggle(e)} />
            {e}
          </label>
        ))}
        <p className="text-xs text-muted-foreground pt-1">
          Kivételszabályok esetén az előhaszonbérleti jog főszabály szerint nem áll fenn.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}