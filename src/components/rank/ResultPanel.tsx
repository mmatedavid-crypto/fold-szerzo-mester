import type { ReactElement } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertTriangle,
  CheckCircle2,
  Minus,
  HelpCircle,
  Ban,
  Scale,
  Sparkles,
  Copy,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { LeaseComparisonResult } from "@/lib/rank/leaseRankComparison";
import type { ProofCategory } from "@/lib/rank/proofRequirements";
import { StampBadge } from "@/components/brand/brand-elements";

const CATEGORY_LABEL: Record<ProofCategory, string> = {
  kotelezo: "Alap",
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
  const {
    comparison,
    explanation,
    userStrongestRank,
    lesseeStrongestRank,
    requiredProofs,
    missingConditions,
    warnings,
  } = result;
  const meta = META[comparison];
  const [openLegal, setOpenLegal] = useState(false);

  const copyProofs = () => {
    const text = ["Igazolási lista (Dr Föld):", ...requiredProofs.map((p) => `• ${p.label}`)].join(
      "\n",
    );
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Igazolási lista vágólapra másolva"));
  };

  return (
    <Card className="space-y-4 border-2 border-df-border bg-df-card p-5 shadow-[4px_4px_0_var(--df-border)] lg:sticky lg:top-4">
      <div className="flex items-center gap-2">
        <Scale className="h-4 w-4 text-df-green" />
        <h3 className="font-brand text-base font-black text-df-green">Eredmény</h3>
      </div>

      <div className={`rounded-lg border-2 p-4 ${meta.cls}`}>
        <div className="flex items-center gap-2 mb-2">
          {meta.icon}
          <Badge variant="outline" className="border-current font-brand font-black tracking-wide">
            {meta.badge}
          </Badge>
        </div>
        {comparison === "user_stronger" && (
          <StampBadge className="mb-3">NEM TRÜKK. RANGHELY.</StampBadge>
        )}
        <p className="text-sm leading-relaxed">{meta.copy ?? explanation}</p>
      </div>

      {comparison !== "empty" && (
        <div className="grid grid-cols-2 gap-3">
          <RankCell
            title="Kifüggesztett bérlő"
            rank={lesseeStrongestRank?.humanName}
            ref={lesseeStrongestRank?.legalRef}
            state={lesseeStrongestRank?.state}
          />
          <RankCell
            title="Te"
            rank={userStrongestRank?.humanName}
            ref={userStrongestRank?.legalRef}
            state={userStrongestRank?.state}
          />
        </div>
      )}

      {missingConditions.length > 0 && (
        <div className="text-sm">
          <div className="font-medium mb-1">Mi hiányozhat?</div>
          <ul className="list-disc pl-5 text-muted-foreground space-y-0.5 text-xs">
            {missingConditions.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 space-y-1">
          {warnings.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
      )}

      {requiredProofs.length > 0 && userStrongestRank && (
        <div className="text-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Ezt kell igazolnod</div>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={copyProofs}>
              <Copy className="h-3 w-3" /> Másolás
            </Button>
          </div>
          {(["kotelezo", "jogcim_fuggo", "jogi_ellenorzes"] as ProofCategory[]).map((cat) => {
            const items = requiredProofs.filter((p) => p.category === cat);
            if (!items.length) return null;
            return (
              <div key={cat} className="mb-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  {CATEGORY_LABEL[cat]}
                </div>
                <ul className="list-disc pl-5 text-xs space-y-0.5">
                  {items.map((p) => (
                    <li key={p.id}>{p.label}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2 pt-2">
        {comparison === "user_stronger" && (
          <Button className="w-full" size="lg" onClick={onAccept}>
            <Sparkles className="h-4 w-4" /> Elfogadó nyilatkozat készítése
          </Button>
        )}
        {comparison === "same_rank" && (
          <>
            <Button className="w-full" onClick={onAccept}>
              Elfogadó nyilatkozat előkészítése
            </Button>
            <p className="text-xs text-amber-700">
              Azonos ranghely esetén nem biztos, hogy átveheted a bérlő helyét. Jogi ellenőrzés
              javasolt.
            </p>
          </>
        )}
        {comparison === "lessee_unknown" && (
          <>
            <Button className="w-full" onClick={onAccept}>
              Elfogadó nyilatkozat előkészítése
            </Button>
            <p className="text-xs text-amber-700">
              A bérlő jogcíme nélkül a kimenetel bizonytalan.
            </p>
          </>
        )}
        {comparison === "user_weaker" && (
          <Button className="w-full" variant="outline">
            Megnézem, milyen jogcím hiányzik
          </Button>
        )}
        {comparison === "incomplete_special" && (
          <Button className="w-full" variant="outline">
            Hiányzó feltételek bepipálása
          </Button>
        )}
        {comparison === "cannot_determine" && (
          <Button className="w-full" variant="outline">
            Adatok pontosítása
          </Button>
        )}
      </div>

      {(userStrongestRank || lesseeStrongestRank) && (
        <Collapsible open={openLegal} onOpenChange={setOpenLegal} className="border-t pt-3">
          <CollapsibleTrigger className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer">
            <ChevronDown
              className={`h-3 w-3 transition-transform ${openLegal ? "rotate-180" : ""}`}
            />{" "}
            Jogszabályi háttér
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1 text-xs text-muted-foreground">
            {userStrongestRank && <div>• {userStrongestRank.legalRef}</div>}
            {lesseeStrongestRank && lesseeStrongestRank.id !== userStrongestRank?.id && (
              <div>• {lesseeStrongestRank.legalRef}</div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      <p className="text-[11px] text-muted-foreground border-t pt-3">
        A kalkulátor tájékoztató jellegű. A jogosultságot és az elfogadó jognyilatkozat
        figyelembevételét a hatóság vizsgálja. Vitás ügyben ügyvédi ellenőrzés javasolt.
      </p>
    </Card>
  );
}

function RankCell({
  title,
  rank,
  ref: legalRef,
  state,
}: {
  title: string;
  rank?: string;
  ref?: string;
  state?: "match" | "incomplete";
}) {
  return (
    <div className="rounded border p-2.5">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-sm font-medium mt-1 leading-tight">{rank ?? "—"}</div>
      {state && (
        <Badge
          variant="outline"
          className={`mt-1 text-[10px] ${state === "match" ? "text-emerald-700 border-emerald-300" : "text-amber-700 border-amber-300"}`}
        >
          {state === "match" ? "érvényes" : "hiányos"}
        </Badge>
      )}
      {legalRef && <div className="text-[11px] text-muted-foreground mt-1">{legalRef}</div>}
    </div>
  );
}

const META: Record<
  LeaseComparisonResult["comparison"],
  { badge: string; cls: string; icon: ReactElement; copy?: string }
> = {
  empty: {
    badge: "PIPÁLJ BE PÁR DOLGOT",
    cls: "border-df-border bg-df-cream text-df-ink",
    icon: <HelpCircle className="h-4 w-4 text-df-green" />,
  },
  user_stronger: {
    badge: "ERŐSEBB RANGHELYED LEHET",
    cls: "border-df-green bg-df-cream text-df-green",
    icon: <CheckCircle2 className="h-4 w-4 text-df-green" />,
    copy: "A megadott adatok alapján előrébb állhatsz a sorban. Ha az adatok helyesek, lehet mire hivatkoznod.",
  },
  same_rank: {
    badge: "AZONOS RANGHELY",
    cls: "border-df-yellow bg-df-cream text-df-ink",
    icon: <Minus className="h-4 w-4 text-df-yellow" />,
  },
  user_weaker: {
    badge: "MOST NEM TE ÁLLSZ ELŐRÉBB",
    cls: "border-df-red bg-df-cream text-df-red",
    icon: <AlertTriangle className="h-4 w-4 text-df-red" />,
    copy: "A megadott adatok alapján valószínűleg hátrébb vagy a sorban. Jobb most tudni, mint vakon indulni.",
  },
  lessee_unknown: {
    badge: "A BÉRLŐ RANGHELYE NEM ISMERT",
    cls: "border-df-yellow bg-df-cream text-df-ink",
    icon: <HelpCircle className="h-4 w-4 text-df-yellow" />,
  },
  incomplete_special: {
    badge: "HIÁNYOS ERŐS JOGCÍM",
    cls: "border-df-yellow bg-df-cream text-df-ink",
    icon: <AlertTriangle className="h-4 w-4 text-df-yellow" />,
  },
  cannot_determine: {
    badge: "NEM ÁLLAPÍTHATÓ MEG BIZTONSÁGGAL",
    cls: "border-df-border bg-df-cream text-df-ink",
    icon: <HelpCircle className="h-4 w-4 text-df-green" />,
  },
  no_valid_user_rank: {
    badge: "NEM LÁTSZIK BIZTOS JOGCÍM",
    cls: "border-df-border bg-df-cream text-df-ink",
    icon: <Ban className="h-4 w-4 text-df-green" />,
  },
  exception: {
    badge: "KIVÉTEL LEHET",
    cls: "border-df-red bg-df-cream text-df-red",
    icon: <AlertTriangle className="h-4 w-4 text-df-red" />,
  },
  no_prelease_right: {
    badge: "NINCS ELŐHASZONBÉRLETI JOG",
    cls: "border-df-red bg-df-cream text-df-red",
    icon: <Ban className="h-4 w-4 text-df-red" />,
  },
};
