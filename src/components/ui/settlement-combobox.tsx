import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import settlementsData from "@/data/hungary-settlements.json";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Settlement {
  name: string;
  zips: string[];
}

export const HU_SETTLEMENTS: Settlement[] = settlementsData as Settlement[];

export function zipsForSettlement(name?: string): string[] {
  if (!name) return [];
  const lower = name.trim().toLowerCase();
  const exact = HU_SETTLEMENTS.find((s) => s.name.toLowerCase() === lower);
  return exact?.zips ?? [];
}

interface Props {
  value?: string;
  onChange: (name: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

/** Magyar település combobox ghost autocomplete-tel. */
export function SettlementCombobox({ value, onChange, placeholder = "Kezdd el gépelni a település nevét…", id, className }: Props) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return HU_SETTLEMENTS.slice(0, 50);
    return HU_SETTLEMENTS.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 100);
  }, [search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-white border-df-border text-df-ink font-normal hover:bg-df-cream",
            !value && "text-muted-foreground",
            className,
          )}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 pointer-events-auto" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Település keresése…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Nincs találat.</CommandEmpty>
            <CommandGroup>
              {filtered.map((s) => (
                <CommandItem
                  key={s.name}
                  value={s.name}
                  onSelect={() => {
                    onChange(s.name);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === s.name ? "opacity-100" : "opacity-0")}
                  />
                  <span className="flex-1">{s.name}</span>
                  {s.zips[0] && (
                    <span className="ml-2 text-xs text-muted-foreground">{s.zips[0]}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}