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
      className="flex flex-wrap gap-3"
    >
      <label className="flex cursor-pointer items-center gap-1.5 text-sm text-df-ink">
        <RadioGroupItem value="yes" /> igen
      </label>
      <label className="flex cursor-pointer items-center gap-1.5 text-sm text-df-ink">
        <RadioGroupItem value="no" /> nem
      </label>
      <label className="flex cursor-pointer items-center gap-1.5 text-sm text-df-gray">
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
    <Card className="space-y-5 border-2 border-df-border bg-df-card p-5 shadow-sm">
      <div>
        <h2 className="font-brand text-xl font-bold text-df-green">1. Milyen földről van szó?</h2>
        <p className="mt-1 text-xs text-df-gray">
          A kalkulátor a haszonbérleti előhaszonbérleti ranghelyet hasonlítja össze.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="font-semibold text-df-ink">Ügylet típusa</Label>
        <RadioGroup
          value={value.transaction}
          onValueChange={(v) => set("transaction", v as Transaction)}
          className="flex flex-wrap gap-3"
        >
          <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-df-green bg-df-green/10 px-3 py-2 text-sm font-medium text-df-green">
            <RadioGroupItem value="lease" /> Haszonbérlet
          </label>
          <label className="flex cursor-not-allowed items-center gap-1.5 rounded-md border border-df-border bg-df-cream/60 px-3 py-2 text-sm text-df-gray">
            <RadioGroupItem value="sale" disabled /> Adásvétel{" "}
            <span className="text-xs">(külön ranghelylogika készül)</span>
          </label>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label className="font-semibold text-df-ink">Föld típusa</Label>
        <div className="grid gap-2 sm:grid-cols-3">
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
            desc="Földforgalmi tv. hatályán kívül eshet — előhaszonbérleti ranghely nem fut."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="font-semibold text-df-ink">Művelési ág</Label>
        <Select
          value={value.cultivationBranch}
          onValueChange={(v) => set("cultivationBranch", v as Cultivation)}
        >
          <SelectTrigger className="border-df-border bg-white text-df-ink">
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
        <Label className="font-semibold text-df-ink">Közös tulajdon?</Label>
        <YNU value={value.commonOwnershipUI} onChange={(v) => set("commonOwnershipUI", v)} />
      </div>

      <Accordion type="single" collapsible>
        <AccordionItem value="advanced" className="rounded border border-df-border bg-white/70">
          <AccordionTrigger className="px-3 text-sm font-semibold text-df-green">
            Haladó földadatok
          </AccordionTrigger>
          <AccordionContent className="space-y-4 px-3">
            <div className="space-y-2">
              <Label className="font-semibold text-df-ink">
                Vegyes alrészlet (erdő és nem erdő ugyanazon földrészleten)?
              </Label>
              <YNU value={value.mixedParcelUI} onChange={(v) => set("mixedParcelUI", v)} />
            </div>
            {value.mixedParcelUI === "yes" && (
              <div className="space-y-2">
                <Label className="font-semibold text-df-ink">Melyik terület nagyobb?</Label>
                <RadioGroup
                  value={value.largerArea ?? "unknown"}
                  onValueChange={(v) => set("largerArea", v as "non_forest" | "forest" | "unknown")}
                  className="flex flex-wrap gap-3"
                >
                  <label className="flex cursor-pointer items-center gap-1.5 text-sm text-df-ink">
                    <RadioGroupItem value="non_forest" /> termőföld nagyobb
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5 text-sm text-df-ink">
                    <RadioGroupItem value="forest" /> erdő nagyobb
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5 text-sm text-df-gray">
                    <RadioGroupItem value="unknown" /> nem tudom
                  </label>
                </RadioGroup>
              </div>
            )}
            <div className="space-y-2">
              <Label className="font-semibold text-df-ink">
                Tulajdonostárs ad bérbe harmadik személynek?
              </Label>
              <YNU value={value.coOwnerLeaseUI} onChange={(v) => set("coOwnerLeaseUI", v)} />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-df-ink">
                Egybefoglalt haszonbér több földre?
              </Label>
              <YNU value={value.bundledLeaseUI} onChange={(v) => set("bundledLeaseUI", v)} />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-df-ink">
                Borszőlő / hegyközségi érintettség?
              </Label>
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
      className={`rounded-lg border-2 p-3 text-left transition-all ${
        active
          ? "border-df-green bg-df-green/10 shadow-sm"
          : "border-df-border bg-white hover:border-df-green/50 hover:bg-df-cream/50"
      }`}
    >
      <div
        className={`flex items-center gap-2 text-sm font-semibold ${active ? "text-df-green" : "text-df-ink"}`}
      >
        <span className={active ? "text-df-green" : "text-df-gray"}>{icon}</span> {title}
      </div>
      <div className="mt-1 text-xs leading-5 text-df-gray">{desc}</div>
    </button>
  );
}
