import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sprout, TreePine } from "lucide-react";
import type { LandContextValue } from "@/lib/rank/landContextUi";
import type { Cultivation, Transaction, YesNoUnknown } from "@/lib/rank/leaseTypes";

const CULTIVATIONS: { value: Cultivation; label: string }[] = [
  { value: "szanto", label: "szántó" },
  { value: "ret", label: "rét / legelő / gyep" },
  { value: "kert", label: "kert" },
  { value: "szolo", label: "szőlő" },
  { value: "gyumolcsos", label: "gyümölcsös" },
  { value: "rizstelep", label: "rizstelep" },
  { value: "nadas_halastao", label: "nádas / halastó / egyéb" },
  { value: "erdo", label: "erdő / fásított terület" },
  { value: "vegyes", label: "nem tudom" },
];

function YNU({ value, onChange }: { value: YesNoUnknown; onChange: (v: YesNoUnknown) => void }) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as YesNoUnknown)}
      className="flex gap-3 flex-wrap"
    >
      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
        <RadioGroupItem value="yes" /> igen
      </label>
      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
        <RadioGroupItem value="no" /> nem
      </label>
      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
        <RadioGroupItem value="unknown" /> nem tudom
      </label>
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
          className="flex gap-3 flex-wrap"
        >
          <label className="flex items-center gap-1.5 cursor-pointer">
            <RadioGroupItem value="lease" /> Haszonbérlet
          </label>
          <label className="flex items-center gap-1.5 cursor-not-allowed text-muted-foreground">
            <RadioGroupItem value="sale" disabled /> Adásvétel{" "}
            <span className="text-xs">(külön ranghelylogika készül)</span>
          </label>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Föld típusa</Label>
        <div className="grid grid-cols-2 gap-2">
          <BranchTile
            active={value.branch === "non_forest"}
            onClick={() => set("branch", "non_forest")}
            icon={<Sprout className="h-5 w-5" />}
            title="Termőföld"
            desc="Szántó, rét, legelő, gyep, kert, szőlő, gyümölcsös stb. — nem erdő."
          />
          <BranchTile
            active={value.branch === "forest"}
            onClick={() => set("branch", "forest")}
            icon={<TreePine className="h-5 w-5" />}
            title="Erdő / fásított terület"
            desc="Erdőnek minősülő föld — külön erdős ranghelyszabályokkal."
          />
          <BranchTile
            active={value.branch === "out_of_scope"}
            onClick={() => set("branch", "out_of_scope")}
            icon={<Sprout className="h-5 w-5" />}
            title="Kivett terület"
            desc="Nem Földforgalmi tv. szerinti föld — ranghely kalkuláció nem fut."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Művelési ág</Label>
        <Select
          value={value.cultivationBranch}
          onValueChange={(v) => set("cultivationBranch", v as Cultivation)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Válassz…" />
          </SelectTrigger>
          <SelectContent>
            {CULTIVATIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Közös tulajdon?</Label>
        <YNU value={value.commonOwnershipUI} onChange={(v) => set("commonOwnershipUI", v)} />
      </div>

      <Accordion type="single" collapsible>
        <AccordionItem value="advanced" className="border rounded">
          <AccordionTrigger className="px-3 text-sm">Haladó földadatok</AccordionTrigger>
          <AccordionContent className="px-3 space-y-4">
            <div className="space-y-2">
              <Label>Vegyes alrészlet (erdő és nem erdő ugyanazon földrészleten)?</Label>
              <YNU value={value.mixedParcelUI} onChange={(v) => set("mixedParcelUI", v)} />
            </div>
            {value.mixedParcelUI === "yes" && (
              <div className="space-y-2">
                <Label>Melyik terület nagyobb?</Label>
                <RadioGroup
                  value={value.largerArea ?? "unknown"}
                  onValueChange={(v) => set("largerArea", v as "non_forest" | "forest" | "unknown")}
                  className="flex gap-3 flex-wrap"
                >
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <RadioGroupItem value="non_forest" /> termőföld nagyobb
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <RadioGroupItem value="forest" /> erdő nagyobb
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <RadioGroupItem value="unknown" /> nem tudom
                  </label>
                </RadioGroup>
              </div>
            )}
            <div className="space-y-2">
              <Label>Tulajdonostárs ad bérbe harmadik személynek?</Label>
              <YNU value={value.coOwnerLeaseUI} onChange={(v) => set("coOwnerLeaseUI", v)} />
            </div>
            <div className="space-y-2">
              <Label>Egybefoglalt haszonbér több földre?</Label>
              <YNU value={value.bundledLeaseUI} onChange={(v) => set("bundledLeaseUI", v)} />
            </div>
            <div className="space-y-2">
              <Label>Borszőlő / hegyközségi érintettség?</Label>
              <YNU value={value.wineUI} onChange={(v) => set("wineUI", v)} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

function BranchTile({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg border-2 p-3 transition-all ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
    >
      <div className="flex items-center gap-2 font-medium text-sm">
        {icon} {title}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
    </button>
  );
}
