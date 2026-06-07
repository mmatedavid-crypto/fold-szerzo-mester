import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { ResultPanel } from "./ResultPanel";
import type { LandContextValue } from "./LandContextCard";
import type { PartyStatus } from "@/lib/rank/leaseTypes";
import { applyPresetByValue } from "@/lib/rank/rankPresets";
import type { LeaseComparisonResult } from "@/lib/rank/leaseRankComparison";
import { EMPTY_PARTY } from "@/lib/rank/leaseTypes";

interface Props {
  land: LandContextValue;
  setLand: (v: LandContextValue) => void;
  lessee: PartyStatus;
  setLessee: (v: PartyStatus) => void;
  me: PartyStatus;
  setMe: (v: PartyStatus) => void;
  result: LeaseComparisonResult;
  onAccept: () => void;
  onFinish: () => void;
}

type ChoiceBtn = { value: string; label: string };

function Choices({ options, onPick }: { options: ChoiceBtn[]; onPick: (v: string) => void }) {
  return (
    <div className="grid gap-2">
      {options.map((o) => (
        <Button key={o.value} variant="outline" size="lg" className="justify-start h-auto py-3 text-left" onClick={() => onPick(o.value)}>
          {o.label}
        </Button>
      ))}
    </div>
  );
}

export function GuidedFlow({ land, setLand, lessee, setLessee, me, setMe, result, onAccept, onFinish }: Props) {
  const [step, setStep] = useState(0);
  const total = 6;

  const next = () => setStep((s) => Math.min(total, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <Card className="p-5 space-y-5 max-w-xl mx-auto">
      <div>
        <Progress value={((step + 1) / (total + 1)) * 100} className="h-1" />
        <div className="text-xs text-muted-foreground mt-1.5">{step + 1}. / {total + 1}. lépés</div>
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Haszonbérletről vagy adásvételről van szó?</h2>
          <Choices
            options={[
              { value: "lease", label: "Haszonbérlet" },
              { value: "sale", label: "Adásvétel (hamarosan)" },
            ]}
            onPick={(v) => { setLand({ ...land, transaction: v as "lease" | "sale" }); next(); }}
          />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Milyen föld?</h2>
          <Choices
            options={[
              { value: "non_forest", label: "Termőföld (szántó, rét, kert, szőlő…)" },
              { value: "forest", label: "Erdő / fásított terület" },
              { value: "unknown", label: "Nem tudom" },
            ]}
            onPick={(v) => {
              if (v !== "unknown") setLand({ ...land, branch: v as "forest" | "non_forest" });
              next();
            }}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Mit tudsz a kifüggesztett bérlőről?</h2>
          <Choices
            options={[
              { value: "former_lessee", label: "Volt haszonbérlő" },
              { value: "local_neighbor", label: "Helyben lakó szomszéd" },
              { value: "local_resident", label: "Helyben lakó" },
              { value: "within_20km", label: "20 km-en belüli" },
              { value: "animal_holder", label: "Állattartó" },
              { value: "organic", label: "Bio / öko" },
              { value: "co_owner", label: "Tulajdonostárs" },
              { value: "org_local", label: "Mezőgazdasági termelőszervezet" },
              { value: "unknown", label: "Nem tudom" },
            ]}
            onPick={(v) => { setLessee(applyPresetByValue(v, lessee)); next(); }}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Mi igaz rád?</h2>
          <Choices
            options={[
              { value: "former_lessee", label: "Volt haszonbérlő vagyok" },
              { value: "local_neighbor", label: "Helyben lakó szomszéd vagyok" },
              { value: "local_resident", label: "Helyben lakó vagyok" },
              { value: "within_20km", label: "20 km-en belüli vagyok" },
              { value: "co_owner", label: "Földműves tulajdonostárs vagyok" },
              { value: "org_local", label: "Helybeli szervezet vagyok" },
              { value: "unknown", label: "Nem tudom" },
            ]}
            onPick={(v) => { setMe(applyPresetByValue(v, me)); next(); }}
          />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Van valami erős külön jogcímed?</h2>
          <Choices
            options={[
              { value: "animal_holder", label: "Állattartó vagyok" },
              { value: "organic", label: "Bio / öko gazdálkodó vagyok" },
              { value: "irrigation", label: "Öntözésfejlesztő vagyok" },
              { value: "young_farmer", label: "Fiatal gazda vagyok" },
              { value: "csmt", label: "CSMT / ŐCSG tag vagyok" },
              { value: "none", label: "Nincs ilyen" },
            ]}
            onPick={(v) => {
              if (v !== "none") setMe(applyPresetByValue(v, me));
              next();
            }}
          />
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Meg tudod igazolni?</h2>
          <p className="text-sm text-muted-foreground">
            Az erős speciális jogcímekhez (állattartó, bio, öntözés…) több igazolás kell. Az igazolási listát az eredmény után megkapod.
          </p>
          <div className="grid gap-2">
            <Button size="lg" onClick={next}>Igen, lássuk az eredményt</Button>
            <Button size="lg" variant="outline" onClick={() => { setMe({ ...EMPTY_PARTY }); setStep(3); }}>
              Vissza — újraválasztom magamat
            </Button>
          </div>
        </div>
      )}

      {step >= 6 && (
        <div className="space-y-4">
          <ResultPanel result={result} onAccept={onAccept} />
          <Button variant="outline" className="w-full" onClick={onFinish}>
            Tovább a részletes kalkulátorhoz <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      )}

      {step > 0 && step < 6 && (
        <div className="flex justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={back}><ArrowLeft className="h-3 w-3" /> Vissza</Button>
          <Button variant="ghost" size="sm" onClick={next}>Kihagyás <ArrowRight className="h-3 w-3" /></Button>
        </div>
      )}
    </Card>
  );
}