import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X } from "lucide-react";
import type { PartyStatus } from "@/lib/rank/leaseTypes";
import { EMPTY_PARTY } from "@/lib/rank/leaseTypes";
import {
  CHIP_GROUPS,
  PRESETS,
  applyPresetByValue,
  type Voice,
  type ChipKey,
} from "@/lib/rank/rankPresets";

export function PartyStatusCard({
  title,
  subtitle,
  helper,
  value,
  onChange,
  voice,
  accentClass = "border-df-green/40 bg-df-green/5",
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
  const reset = () => {
    setPreset("");
    onChange({ ...EMPTY_PARTY });
  };

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
    <Card className={`space-y-4 border-2 bg-df-card p-5 shadow-sm ${accentClass}`}>
      <div>
        <h3 className="text-base font-semibold text-df-green">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-df-gray">{subtitle}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-df-ink">Kiválasztom gyorsan</Label>
        <Select value={preset} onValueChange={applyPreset}>
          <SelectTrigger className="border-df-border bg-white text-df-ink">
            <SelectValue placeholder="Válassz egy jellemző helyzetet..." />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label[voice]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-df-gray">
          {voice === "first" ? "Rád bejelölve:" : "Nála bejelölve:"}
        </div>
        <div className="flex min-h-[34px] flex-wrap gap-1.5">
          {selected.length === 0 && (
            <span className="rounded-md border border-dashed border-df-border bg-df-cream/60 px-3 py-1.5 text-xs text-df-gray">
              Még semmi sincs bejelölve.
            </span>
          )}
          {selected.map((s) => (
            <Badge
              key={s.key}
              variant="secondary"
              className="gap-1 border border-df-green/25 bg-df-green/10 py-1 pl-2 pr-1 text-df-green"
            >
              {s.label}
              <button
                onClick={() => remove(s.key)}
                aria-label="Eltávolít"
                className="rounded p-0.5 hover:bg-df-green/10"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 border-df-green text-df-green hover:bg-df-green hover:text-white"
              >
                <Plus className="h-3 w-3" /> Másik jogcím hozzáadása
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="max-h-[60vh] w-80 overflow-y-auto border-df-border bg-df-card"
              align="start"
            >
              <div className="space-y-3">
                {CHIP_GROUPS.map((g) => (
                  <div key={g.label}>
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-df-gray">
                      {g.label}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {g.chips.map((c) => {
                        const on = !!value[c.key];
                        return (
                          <button
                            key={c.key}
                            type="button"
                            onClick={() => toggle(c.key)}
                            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                              on
                                ? "border-df-green bg-df-green text-white"
                                : "border-df-border bg-white text-df-ink hover:bg-df-cream"
                            }`}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={onUnsure}
              className="text-df-gray hover:text-df-green"
            >
              Nem vagyok biztos benne
            </Button>
          )}
          {selected.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="text-df-red hover:text-df-red"
            >
              Törlés
            </Button>
          )}
        </div>
      </div>

      {helper && (
        <p className="rounded border border-df-border bg-df-cream/60 p-2 text-xs text-df-gray">
          {helper}
        </p>
      )}
    </Card>
  );
}
