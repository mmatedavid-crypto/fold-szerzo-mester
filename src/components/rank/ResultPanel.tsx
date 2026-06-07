import type { ReactElement } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Minus, HelpCircle, Ban, Scale } from "lucide-react";
import type { LeaseComparisonResult } from "@/lib/rank/leaseRankComparison";
import type { ProofCategory } from "@/lib/rank/proofRequirements";

const CATEGORY_LABEL: Record<ProofCategory, string> = {
  kotelezo: "Kötelező",
  jogcim_fuggo: "Jogcímtől függő",
  jogi_ellenorzes: "Jogi ellenőrzést igényelhet",
};

export function ResultPanel({
  result,
  onAccept,
}: {
  result: LeaseComparisonResult;
  onAccept: () => void;
}) {
  const { comparison, explanation, userStrongestRank, lesseeStrongestRank, requiredProofs, missingConditions, warnings } = result;

  const meta = META[comparison];

  return (
    <Card className="p-5 space-y-4 sticky top-4">
      <div>
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" /> Eredmény
        </h3>
      </div>

      <div className={`rounded-md border p-3 ${meta.cls}`}>
        <div className="flex items-center gap-2 mb-1">
          {meta.icon}
          <Badge variant="outline" className="border-current">{meta.badge}</Badge>
        </div>
        <p className="text-sm">{explanation}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <RankCell title="Kifüggesztett bérlő" rank={lesseeStrongestRank?.humanName} ref={lesseeStrongestRank?.legalRef} />
        <RankCell title="Te" rank={userStrongestRank?.humanName} ref={userStrongestRank?.legalRef} />
      </div>

      {missingConditions.length > 0 && (
        <div className="text-sm">
          <div className="font-medium mb-1">Hiányzó adatok / feltételek</div>
          <ul className="list-disc pl-5 text-muted-foreground space-y-0.5 text-xs">
            {missingConditions.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 space-y-1">
          {warnings.map((w, i) => <div key={i}>{w}</div>)}
        </div>
      )}

      {requiredProofs.length > 0 && userStrongestRank && (
        <div className="text-sm">
          <div className="font-medium mb-2">Ezt kell igazolnod</div>
          {(["kotelezo", "jogcim_fuggo", "jogi_ellenorzes"] as ProofCategory[]).map((cat) => {
            const items = requiredProofs.filter((p) => p.category === cat);
            if (!items.length) return null;
            return (
              <div key={cat} className="mb-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{CATEGORY_LABEL[cat]}</div>
                <ul className="list-disc pl-5 text-xs space-y-0.5">
                  {items.map((p) => <li key={p.id}>{p.label}</li>)}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2 pt-2">
        {comparison === "user_stronger" && (
          <Button className="w-full" onClick={onAccept}>Elfogadó nyilatkozatot készítek</Button>
        )}
        {comparison === "same_rank" && (
          <>
            <Button className="w-full" variant="default" onClick={onAccept}>Elfogadó nyilatkozat előkészítése</Button>
            <p className="text-xs text-amber-700">Azonos ranghely esetén nem biztos, hogy át tudod venni a bérlő helyét.</p>
          </>
        )}
        {comparison === "user_weaker" && (
          <Button className="w-full" variant="outline">Megnézem, milyen jogcím hiányzik</Button>
        )}
        {comparison === "cannot_determine" && (
          <Button className="w-full" variant="outline">Adatok kiegészítése</Button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground border-t pt-3">
        A kalkulátor tájékoztató jellegű. A jogosultságot és az elfogadó jognyilatkozat figyelembevételét a hatóság vizsgálja. Vitás ügyben ügyvédi ellenőrzés javasolt.
      </p>
    </Card>
  );
}

function RankCell({ title, rank, ref: legalRef }: { title: string; rank?: string; ref?: string }) {
  return (
    <div className="rounded border p-2.5">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-sm font-medium mt-1">{rank ?? "—"}</div>
      {legalRef && <div className="text-[11px] text-muted-foreground mt-1">{legalRef}</div>}
    </div>
  );
}

const META: Record<LeaseComparisonResult["comparison"], { badge: string; cls: string; icon: ReactElement }> = {
  user_stronger: {
    badge: "ERŐSEBB RANGHELY VALÓSZÍNŰ",
    cls: "border-emerald-300 bg-emerald-50 text-emerald-900",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-700" />,
  },
  same_rank: {
    badge: "AZONOS RANGHELY",
    cls: "border-amber-300 bg-amber-50 text-amber-900",
    icon: <Minus className="h-4 w-4 text-amber-700" />,
  },
  user_weaker: {
    badge: "GYENGÉBB RANGHELY",
    cls: "border-rose-300 bg-rose-50 text-rose-900",
    icon: <AlertTriangle className="h-4 w-4 text-rose-700" />,
  },
  cannot_determine: {
    badge: "NEM ÁLLAPÍTHATÓ MEG BIZTONSÁGGAL",
    cls: "border-slate-300 bg-slate-50 text-slate-900",
    icon: <HelpCircle className="h-4 w-4 text-slate-700" />,
  },
  no_valid_user_rank: {
    badge: "NINCS BIZTOS ELŐHASZONBÉRLETI JOGCÍM",
    cls: "border-slate-300 bg-slate-50 text-slate-900",
    icon: <Ban className="h-4 w-4 text-slate-700" />,
  },
  no_prelease_right: {
    badge: "NINCS ELŐHASZONBÉRLETI JOG",
    cls: "border-rose-300 bg-rose-50 text-rose-900",
    icon: <Ban className="h-4 w-4 text-rose-700" />,
  },
};