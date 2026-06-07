import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { EMPTY_PARTY, type PartyStatus } from "@/lib/rank/leaseTypes";

type Field = keyof PartyStatus;

interface StatusOption {
  key: Field;
  title: string;
  hint: string;
  details?: string;
}

const GROUPS: { label: string; options: StatusOption[] }[] = [
  {
    label: "Alap státusz",
    options: [
      { key: "farmer_natural", title: "Földműves természetes személy", hint: "Földműves nyilvántartásban szerepel." },
      { key: "org_producer", title: "Mezőgazdasági termelőszervezet", hint: "Nyilvántartott mg. termelőszervezet." },
      { key: "unknown_base", title: "Nem tudom / nem állapítható meg", hint: "Az alap státusz nem ismert." },
    ],
  },
  {
    label: "Hely és reláció",
    options: [
      { key: "local_resident", title: "Helyben lakó", hint: "A föld fekvése szerinti településen él életvitelszerűen." },
      { key: "local_neighbor", title: "Helyben lakó szomszéd", hint: "A földdel közvetlenül szomszédos földje van.", details: "Földművesként igazolható szomszédosság." },
      { key: "within_20km", title: "20 km-en belüli földműves", hint: "A települési határtól 20 km-en belül lakik / üzemközpontja van." },
      { key: "org_local", title: "Helybeli mg. termelőszervezet", hint: "A szervezet üzemközpontja a településen." },
      { key: "org_local_neighbor", title: "Helybeli mg. termelőszervezet szomszéd", hint: "Helybeli szervezet, közvetlenül szomszédos földdel." },
      { key: "org_within_20km", title: "20 km-en belüli mg. termelőszervezet", hint: "20 km-es körzeten belüli szervezet." },
    ],
  },
  {
    label: "Használati előzmény",
    options: [
      { key: "former_lessee", title: "Volt haszonbérlő", hint: "Korábban haszonbérelte a földet." },
      { key: "used_3_years", title: "Legalább 3 éve haszonbérelte / használta a földet", hint: "Folyamatos földhasználat 3 éven át." },
      { key: "metayer_lessee", title: "Volt részesművelő vagy feles bérlő", hint: "Részesművelés / feles bérlet jogcímen használta." },
      { key: "current_user", title: "Jelenlegi földhasználó", hint: "Most is használja a földet." },
    ],
  },
  {
    label: "Tulajdon",
    options: [
      { key: "co_owner_farmer", title: "Földműves tulajdonostárs közös tulajdonban", hint: "Földműves, közös tulajdonban tulajdonostárs." },
    ],
  },
  {
    label: "Speciális csúcs-jogcímek",
    options: [
      { key: "animal_holder", title: "Állattartó telepet üzemeltet", hint: "Saját üzemeltetésű állattartó telep." },
      { key: "feed_purpose", title: "Takarmányszükséglet biztosítása a cél", hint: "A haszonbérlet célja takarmánytermesztés." },
      { key: "animal_density_ok", title: "Megfelelő állatsűrűség igazolható", hint: "Jogszabályi állatsűrűség teljesül." },
      { key: "organic_purpose", title: "Ökológiai gazdálkodás a cél", hint: "Tanúsított vagy átállási ökológiai termelés." },
      { key: "geo_indication_purpose", title: "Oltalom alatt álló földrajzi árujelzős termék előállítása", hint: "OFJ termék termelése a cél." },
      { key: "horticulture_purpose", title: "Kertészeti tevékenység a cél", hint: "Kertészeti termelés a haszonbérlet célja." },
      { key: "seed_purpose", title: "Szaporítóanyag-előállítás a cél", hint: "Szaporítóanyag-előállítás a cél." },
      { key: "irrigation_invested", title: "Öntözésfejlesztési beruházást valósított meg", hint: "Beruházás a földön / kapcsolódóan." },
      { key: "irrigation_half_land", title: "A föld legalább fele öntözhető a beruházással", hint: "Az 50 %-os öntözhetőség feltétele teljesül." },
      { key: "irrigation_half_term", title: "A beruházás a futamidő legalább feléig értékkel bír", hint: "Számvitelileg igazolt értékvesztés-tűrés." },
      { key: "rice_former_lessee", title: "Rizstelep volt haszonbérlője", hint: "Rizstelep művelési ág volt haszonbérlője." },
    ],
  },
  {
    label: "Csoporton belüli prioritás",
    options: [
      { key: "csmt_member", title: "Családi mezőgazdasági társaság tagja", hint: "CSMT tagság." },
      { key: "ocsg_member", title: "Őstermelők családi gazdaságának tagja", hint: "ŐCSG tagság." },
      { key: "young_farmer", title: "Fiatal földműves", hint: "Fiatal földműves státusz." },
    ],
  },
  {
    label: "Kockázat / kizárás",
    options: [
      { key: "has_use_debt", title: "Földhasználati díjtartozása van", hint: "Fennálló díjtartozás." },
      { key: "recent_penalty", title: "Elmúlt 5 évben releváns bírság", hint: "Földvédelmi / földhasználati bírság." },
      { key: "bankruptcy", title: "Csőd / felszámolás / végelszámolás alatt áll (szervezet)", hint: "Szervezeti fizetésképtelenség." },
      { key: "close_relative", title: "Közeli hozzátartozója a szerződő félnek", hint: "Ez kizárhatja az előhaszonbérleti jogot." },
      { key: "unknown_status", title: "Nem tudom", hint: "Bizonytalan." },
    ],
  },
];

const PRESETS: { value: string; label: string; apply: (p: PartyStatus) => PartyStatus }[] = [
  { value: "unknown", label: "Nem tudom pontosan", apply: (p) => ({ ...p, unknown_status: true }) },
  { value: "former_lessee", label: "Volt haszonbérlő", apply: (p) => ({ ...p, farmer_natural: true, former_lessee: true, local_resident: true }) },
  { value: "local_neighbor", label: "Helyben lakó szomszéd földműves", apply: (p) => ({ ...p, farmer_natural: true, local_resident: true, local_neighbor: true }) },
  { value: "local_resident", label: "Helyben lakó földműves", apply: (p) => ({ ...p, farmer_natural: true, local_resident: true }) },
  { value: "within_20km", label: "20 km-en belüli földműves", apply: (p) => ({ ...p, farmer_natural: true, within_20km: true }) },
  { value: "org_local", label: "Helybeli mezőgazdasági termelőszervezet", apply: (p) => ({ ...p, org_producer: true, org_local: true }) },
  { value: "animal_holder", label: "Állattartó", apply: (p) => ({ ...p, farmer_natural: true, local_resident: true, animal_holder: true, feed_purpose: true, animal_density_ok: true }) },
  { value: "organic", label: "Bio / ökológiai gazdálkodó", apply: (p) => ({ ...p, farmer_natural: true, local_resident: true, organic_purpose: true }) },
  { value: "horticulture", label: "Kertészeti tevékenység", apply: (p) => ({ ...p, farmer_natural: true, local_resident: true, horticulture_purpose: true }) },
  { value: "seed", label: "Szaporítóanyag-előállító", apply: (p) => ({ ...p, farmer_natural: true, local_resident: true, seed_purpose: true }) },
  { value: "irrigation", label: "Öntözésfejlesztő", apply: (p) => ({ ...p, farmer_natural: true, local_resident: true, irrigation_invested: true, irrigation_half_land: true, irrigation_half_term: true }) },
  { value: "co_owner", label: "Földműves tulajdonostárs", apply: (p) => ({ ...p, farmer_natural: true, co_owner_farmer: true }) },
  { value: "custom", label: "Egyedi / több jogcím", apply: (p) => p },
];

export function PartyStatusCard({
  title,
  subtitle,
  helper,
  value,
  onChange,
}: {
  title: string;
  subtitle?: string;
  helper?: string;
  value: PartyStatus;
  onChange: (next: PartyStatus) => void;
}) {
  const [preset, setPreset] = useState<string>("custom");

  const toggle = (k: Field) => onChange({ ...value, [k]: !value[k] });

  const applyPreset = (v: string) => {
    setPreset(v);
    const p = PRESETS.find((x) => x.value === v);
    if (!p) return;
    onChange(p.apply({ ...EMPTY_PARTY }));
  };

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Gyors beállítás</Label>
        <Select value={preset} onValueChange={applyPreset}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {helper && (
        <p className="text-xs text-muted-foreground bg-muted/40 rounded p-2">{helper}</p>
      )}

      <div className="space-y-4">
        {GROUPS.map((g) => (
          <div key={g.label}>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {g.label}
            </div>
            <div className="grid gap-2">
              {g.options.map((opt) => (
                <OptionRow
                  key={opt.key}
                  opt={opt}
                  checked={!!value[opt.key]}
                  onToggle={() => toggle(opt.key)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function OptionRow({
  opt,
  checked,
  onToggle,
}: {
  opt: StatusOption;
  checked: boolean;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded border p-2.5 transition-colors ${checked ? "border-primary/60 bg-primary/5" : "border-border"}`}>
      <label className="flex gap-2.5 items-start cursor-pointer">
        <Checkbox checked={checked} onCheckedChange={onToggle} className="mt-0.5" />
        <div className="flex-1">
          <div className="text-sm font-medium leading-tight">{opt.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{opt.hint}</div>
        </div>
      </label>
      {opt.details && (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="text-xs text-primary flex items-center gap-1 mt-1.5 ml-7 cursor-pointer">
            Mit jelent? <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="text-xs text-muted-foreground ml-7 mt-1">
            {opt.details}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}