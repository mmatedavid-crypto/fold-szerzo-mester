import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { hu } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  /** ISO yyyy-MM-dd */
  value?: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

/** Magyar dátum-választó — tárolt érték: ISO yyyy-MM-dd, megjelenítés: "éééé. hh. nn." */
export function HuDatePicker({ value, onChange, placeholder = "Válassz dátumot", id, className }: Props) {
  const date = React.useMemo(() => {
    if (!value) return undefined;
    const d = parse(value, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : undefined;
  }, [value]);

  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-white border-df-border text-df-ink hover:bg-df-cream",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "yyyy. MM. dd.", { locale: hu }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={hu}
          captionLayout="dropdown"
          fromYear={1900}
          toYear={new Date().getFullYear() + 5}
          selected={date}
          onSelect={(d) => {
            if (d) {
              onChange(format(d, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}