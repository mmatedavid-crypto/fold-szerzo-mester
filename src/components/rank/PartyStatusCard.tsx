import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X } from "lucide-react";
import type { PartyStatus } from "@/lib/rank/leaseTypes";
import { EMPTY_PARTY } from "@/lib/rank/leaseTypes";
import { CHIP_GROUPS, PRESETS, applyPresetByValue, type Voice, type ChipKey } from "@/lib/rank/rankPresets";

export function PartyStatusCard({
  title,
  subtitle,
  helper,
  value,
  onChange,
  voice,
  accentClass = "border-primary/40 bg-primary/5",
  onUnsure,
}: {
  title: string;
  subtitle?: string;
  helper?: string;
  value: PartyStatus;
  onChange: (next: PartyStatus) => void;
  voice: Voice;
  accentClass?: string;
  onUnsure?: () => void;
}) {
  const [preset, setPreset] = useState<string>("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const applyPreset = (v: string) => {
    setPreset(v);
    onChange(applyPresetByValue(v, value));
  };

  const toggle = (k: ChipKey) => onChange({ ...value, [k]: !value[k] });
  const remove = (k: ChipKey) => onChange({ ...value, [k]: false });
  const reset = () => { setPreset(""); onChange({ ...EMPTY_PARTY }); };

  const selected = useMemo(() => {
    const out: { key: ChipKey; label: string }[] = [];
    for (const g of CHIP_GROUPS) {
      for (const c of g.chips) {
        if (value[c.key]) out.push({ key: c.key, label: c.label[voice] });
      }
    }
    return out;
  }, [value, voice]);

  return (
    <Card className={`p-5 space-y-4 border-2 ${accentClass}`}>
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Kiválasztom gyorsan</Label>
        <Select value={preset} onValueChange={applyPreset}>
          <SelectTrigger><SelectValue placeholder="Válassz egy jellemző helyzetet…" /></SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label[voice]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="text-xs font-medium text-muted-foreground mb-2">
          {voice === "first" ? "Rád bejelölve:" : "Nála bejelölve:"}
        </div>
        <div className="flex flex-wrap gap-1.5 min-h-[28px]">
          {selected.length === 0 && (
            <span className="text-xs text-muted-foreground italic">Még semmi sincs bejelölve.</span>
          )}
          {selected.map((s) => (
            <Badge key={s.key} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
              {s.label}
              <button onClick={() => remove(s.key)} aria-label="Eltávolít" className="hover:bg-muted rounded p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1"><Plus className="h-3 w-3" /> Másik jogcím hozzáadása</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 max-h-[60vh] overflow-y-auto" align="start">
              <div className="space-y-3">
                {CHIP_GROUPS.map((g) => (
                  <div key={g.label}>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">{g.label}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {g.chips.map((c) => {
                        const on = !!value[c.key];
                        return (
                          <button
                            key={c.key}
                            type="button"
                            onClick={() => toggle(c.key)}
                            className={`text-xs rounded-full border px-2.5 py-1 transition-colors ${on ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
                          >
                            {c.label[voice]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {onUnsure && (
            <Button variant="ghost" size="sm" onClick={onUnsure}>Nem vagyok biztos benne</Button>
          )}
          {selected.length > 0 && (
            <Button variant="ghost" size="sm" onClick={reset}>Törlés</Button>
          )}
        </div>
      </div>

      {helper && (
        <p className="text-xs text-muted-foreground bg-muted/40 rounded p-2">{helper}</p>
      )}
    </Card>
  );
}