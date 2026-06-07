import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Cultivation, LandContext, Transaction, YesNoUnknown } from "@/lib/rank/leaseTypes";

const CULTIVATIONS: { value: Cultivation; label: string }[] = [
  { value: "szanto", label: "szántó" },
  { value: "ret", label: "rét" },
  { value: "legelo", label: "legelő / gyep" },
  { value: "kert", label: "kert" },
  { value: "szolo", label: "szőlő" },
  { value: "gyumolcsos", label: "gyümölcsös" },
  { value: "rizstelep", label: "rizstelep" },
  { value: "erdo", label: "erdő" },
  { value: "vegyes", label: "vegyes / nem tudom" },
];

export interface LandContextValue extends LandContext {
  commonOwnershipUI: YesNoUnknown;
  coOwnerLeaseUI: YesNoUnknown;
  wineUI: YesNoUnknown;
}

const yesNo = (v: YesNoUnknown) => v === "yes";

export function toLandContext(v: LandContextValue): LandContext {
  return {
    transaction: v.transaction,
    branch: v.branch,
    cultivationBranch: v.cultivationBranch,
    commonOwnership: yesNo(v.commonOwnershipUI),
    coOwnerLeaseToThirdParty: yesNo(v.coOwnerLeaseUI),
    wineGeoIndication: yesNo(v.wineUI),
  };
}

export const DEFAULT_LAND: LandContextValue = {
  transaction: "lease",
  branch: "non_forest",
  cultivationBranch: undefined,
  commonOwnershipUI: "unknown",
  coOwnerLeaseUI: "unknown",
  wineUI: "unknown",
  commonOwnership: false,
  coOwnerLeaseToThirdParty: false,
  wineGeoIndication: false,
};

function YNU({ value, onChange }: { value: YesNoUnknown; onChange: (v: YesNoUnknown) => void }) {
  return (
    <RadioGroup value={value} onValueChange={(v) => onChange(v as YesNoUnknown)} className="flex gap-3">
      <label className="flex items-center gap-1.5 text-sm cursor-pointer"><RadioGroupItem value="yes" /> igen</label>
      <label className="flex items-center gap-1.5 text-sm cursor-pointer"><RadioGroupItem value="no" /> nem</label>
      <label className="flex items-center gap-1.5 text-sm cursor-pointer"><RadioGroupItem value="unknown" /> nem tudom</label>
    </RadioGroup>
  );
}

export function LandContextCard({
  value,
  onChange,
}: {
  value: LandContextValue;
  onChange: (next: LandContextValue) => void;
}) {
  const set = <K extends keyof LandContextValue>(k: K, v: LandContextValue[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <Card className="p-5 space-y-5">
      <div>
        <h2 className="text-lg font-semibold">1. Milyen földről van szó?</h2>
        <p className="text-xs text-muted-foreground mt-1">
          A kalkulátor a haszonbérleti előhaszonbérleti ranghelyet hasonlítja össze.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Ügylet típusa</Label>
        <RadioGroup
          value={value.transaction}
          onValueChange={(v) => set("transaction", v as Transaction)}
          className="flex gap-3"
        >
          <label className="flex items-center gap-1.5 cursor-pointer">
            <RadioGroupItem value="lease" /> Haszonbérlet
          </label>
          <label className="flex items-center gap-1.5 cursor-not-allowed text-muted-foreground">
            <RadioGroupItem value="sale" disabled /> Adásvétel{" "}
            <span className="text-xs">(hamarosan)</span>
          </label>
        </RadioGroup>
        {value.transaction === "sale" && (
          <p className="text-xs text-muted-foreground">
            Az adásvételi elővásárlási ranghely kalkulátor külön modulban készül.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Föld típusa</Label>
        <RadioGroup
          value={value.branch}
          onValueChange={(v) => set("branch", v as "forest" | "non_forest")}
          className="flex gap-3"
        >
          <label className="flex items-center gap-1.5 cursor-pointer">
            <RadioGroupItem value="non_forest" /> Nem erdő
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <RadioGroupItem value="forest" /> Erdő
          </label>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Művelési ág</Label>
        <Select
          value={value.cultivationBranch}
          onValueChange={(v) => set("cultivationBranch", v as Cultivation)}
        >
          <SelectTrigger><SelectValue placeholder="Válassz…" /></SelectTrigger>
          <SelectContent>
            {CULTIVATIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Közös tulajdon?</Label>
        <YNU value={value.commonOwnershipUI} onChange={(v) => set("commonOwnershipUI", v)} />
      </div>
      <div className="space-y-2">
        <Label>Tulajdonostárs adja bérbe harmadik személynek?</Label>
        <YNU value={value.coOwnerLeaseUI} onChange={(v) => set("coOwnerLeaseUI", v)} />
      </div>
      <div className="space-y-2">
        <Label>Borszőlő termőhelyi / hegyközségi érintettség?</Label>
        <YNU value={value.wineUI} onChange={(v) => set("wineUI", v)} />
      </div>
    </Card>
  );
}