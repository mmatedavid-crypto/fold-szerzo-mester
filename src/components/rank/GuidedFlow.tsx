import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { ResultPanel } from "./ResultPanel";
import type { LandContextValue } from "./LandContextCard";
import type { PartyStatus, TransactionException } from "@/lib/rank/leaseTypes";
import { applyPresetByValue, TRANSACTION_EXCEPTIONS } from "@/lib/rank/rankPresets";
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="min-h-14 rounded-md border border-df-border bg-df-card px-4 py-3 text-left text-sm font-semibold text-df-ink transition-colors hover:border-df-green hover:bg-df-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-df-yellow"
          onClick={() => onPick(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function GuidedFlow({
  land,
  setLand,
  lessee,
  setLessee,
  me,
  setMe,
  result,
  onAccept,
  onFinish,
}: Props) {
  const [step, setStep] = useState(0);
  const total = 7;

  const next = () => setStep((s) => Math.min(total, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const exceptions = land.exceptions ?? [];
  const toggleException = (e: TransactionException) => {
    const has = exceptions.includes(e);
    setLand({ ...land, exceptions: has ? exceptions.filter((x) => x !== e) : [...exceptions, e] });
  };

  return (
    <Card className="mx-auto max-w-2xl space-y-6 border border-df-border bg-df-card p-5 shadow-[0_16px_42px_rgba(26,26,26,0.08)] md:p-7">
      <div>
        <Progress value={((step + 1) / (total + 1)) * 100} className="h-1.5" />
        <div className="mt-2 text-xs font-semibold text-df-gray">
          {step + 1}. / {total + 1}. lépés
        </div>
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <h2 className="font-brand text-2xl font-bold text-df-ink">Miről van szó?</h2>
          <p className="text-sm text-df-gray">Földet bérelnél vagy vennél?</p>
          <Choices
            options={[
              { value: "lease", label: "Bérelni szeretnék (haszonbérlet)" },
              { value: "sale", label: "Venni szeretnék (adásvétel) — hamarosan" },
            ]}
            onPick={(v) => {
              setLand({ ...land, transaction: v as "lease" | "sale" });
              next();
            }}
          />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-brand text-2xl font-bold text-df-ink">Milyen földről beszélünk?</h2>
          <p className="text-sm text-df-gray">Válaszd ki, melyik illik rá a legjobban.</p>
          <Choices
            options={[
              {
                value: "non_forest",
                label: "Termőföld",
              },
              { value: "forest", label: "Erdő" },
              { value: "non_forest", label: "Gyep" },
              { value: "out_of_scope", label: "Kivett terület" },
            ]}
            onPick={(v) => {
              setLand({ ...land, branch: v as "forest" | "non_forest" | "out_of_scope" });
              next();
            }}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-brand text-2xl font-bold text-df-ink">Ki a kifüggesztett bérlő?</h2>
          <p className="text-sm text-df-gray">
            Az, akivel a tulajdonos szerződést kötne. Válaszd a legjellemzőbbet — később
            finomíthatod.
          </p>
          <Choices
            options={[
              { value: "former_lessee", label: "Eddig is ő bérelte (korábbi haszonbérlő)" },
              { value: "local_neighbor", label: "Helyben lakó, és szomszédos földje van" },
              { value: "local_resident", label: "Helyben lakó a településen" },
              {
                value: "within_20km",
                label: "20 km-en belül lakik / székhelye 20 km-en belül van",
              },
              { value: "animal_holder", label: "Állattartó gazda" },
              { value: "organic", label: "Bio- vagy ökogazdálkodó" },
              { value: "co_owner", label: "Tulajdonostárs a földön" },
              { value: "org_local", label: "Mezőgazdasági termelőszervezet (cég, szövetkezet)" },
              { value: "unknown", label: "Őszintén szólva nem tudom" },
            ]}
            onPick={(v) => {
              setLessee(applyPresetByValue(v, lessee));
              next();
            }}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-brand text-2xl font-bold text-df-ink">
            És te ki vagy ebben a sztoriban?
          </h2>
          <p className="text-sm text-df-gray">
            Válaszd ki, ami a leginkább igaz rád. A részletes jogcímeket utána pontosítjuk.
          </p>
          <Choices
            options={[
              { value: "former_lessee", label: "Eddig én béreltem ezt a földet" },
              { value: "local_neighbor", label: "Helyben lakok, és szomszédos földem van" },
              { value: "local_resident", label: "Helyben lakok a településen" },
              { value: "within_20km", label: "20 km-en belül lakok" },
              { value: "co_owner", label: "Földműves vagyok, és tulajdonostárs ezen a földön" },
              { value: "org_local", label: "Helyi termelőszervezet képviseletében jövök" },
              { value: "unknown", label: "Még nem tudom, segítsetek" },
            ]}
            onPick={(v) => {
              setMe(applyPresetByValue(v, me));
              next();
            }}
          />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="font-brand text-2xl font-bold text-df-ink">
            Van valami extra ütőkártyád?
          </h2>
          <p className="text-sm text-df-gray">
            Ezek az „erős” jogcímek — ha megvan hozzá az igazolásod, fellökhetnek a rangsorban.
          </p>
          <Choices
            options={[
              {
                value: "animal_holder",
                label: "Állattartó vagyok (a földet takarmányozásra használnám)",
              },
              { value: "organic", label: "Bio- vagy ökogazdálkodó vagyok" },
              { value: "irrigation", label: "Öntözésfejlesztést végzek a területen" },
              { value: "young_farmer", label: "Fiatal gazda vagyok (40 év alatti)" },
              {
                value: "csmt",
                label: "Családi mezőgazdasági társaság / őstermelői család tagja vagyok",
              },
              { value: "none", label: "Nincs ilyen — sima gazda vagyok" },
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
          <h2 className="font-brand text-2xl font-bold text-df-ink">
            Papírral is alá tudod támasztani?
          </h2>
          <p className="text-sm text-df-gray">
            A komolyabb jogcímekhez (állattartó, bio, öntözés…) hivatalos igazolások kellenek. Ne
            aggódj — az eredmény után pontos listát kapsz arról, mit kell összeszedned.
          </p>
          <div className="grid gap-2">
            <Button size="lg" className="bg-df-green text-white hover:bg-[#173B2A]" onClick={next}>
              Rendben, megyünk tovább
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                setMe({ ...EMPTY_PARTY });
                setStep(3);
              }}
            >
              Mégis újrakezdem magamnál
            </Button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <h2 className="font-brand text-2xl font-bold text-df-ink">
            Van valami különleges helyzet?
          </h2>
          <p className="text-sm text-df-gray">
            Ezek ritka esetek, de teljesen átírják a rangsort. Ha bármelyik igaz, pipáld be — ha
            egyik sem, csak menj tovább.
          </p>
          <div className="grid gap-2">
            {TRANSACTION_EXCEPTIONS.filter((e) => e.value !== "unknown").map((e) => {
              const checked = exceptions.includes(e.value as TransactionException);
              return (
                <label
                  key={e.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${checked ? "border-df-green bg-df-green text-white" : "border-df-border hover:bg-df-cream"}`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleException(e.value as TransactionException)}
                    className="mt-0.5"
                  />
                  <span className="text-sm">{e.label}</span>
                </label>
              );
            })}
          </div>
          <Button
            size="lg"
            className="w-full bg-df-green text-white hover:bg-[#173B2A]"
            onClick={next}
          >
            {exceptions.length > 0 ? "Tovább az eredményhez" : "Egyik sem — lássuk az eredményt"}
          </Button>
        </div>
      )}

      {step >= 7 && (
        <div className="space-y-4">
          <ResultPanel result={result} onAccept={onAccept} />
          <Button variant="outline" className="w-full" onClick={onFinish}>
            Újrakezdem <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      )}

      {step > 0 && step < 7 && (
        <div className="flex justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={back}>
            <ArrowLeft className="h-3 w-3" /> Vissza
          </Button>
          <Button variant="ghost" size="sm" onClick={next}>
            Most kihagyom <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </Card>
  );
}
