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
    <Card className="overflow-hidden border border-df-border bg-df-card shadow-[0_18px_45px_rgba(26,26,26,0.12)] lg:sticky lg:top-4">
      <div className="df-dark-card p-5 text-df-card">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-df-yellow" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-df-yellow">
            Előzetes eredmény
          </span>
        </div>
        <div className="mt-3 font-brand text-3xl font-bold leading-tight">{meta.badge}</div>
        <p className="mt-3 text-sm leading-relaxed text-df-cream">{meta.copy ?? explanation}</p>
        {comparison === "user_stronger" && (
          <StampBadge className="mt-4 border-df-yellow text-df-yellow">
            NEM TRÜKK. RANGHELY.
          </StampBadge>
        )}
      </div>

      <div className="space-y-4 p-5">
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
            <div className="mb-1 font-medium">Mi hiányozhat?</div>
            <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
              {missingConditions.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="space-y-1 rounded border border-df-red/30 bg-df-red/5 p-2 text-xs text-df-red">
            {warnings.map((w, i) => (
              <div key={i}>{w}</div>
            ))}
          </div>
        )}

        {requiredProofs.length > 0 && userStrongestRank && (
          <Collapsible className="text-sm">
            <div className="mb-2 flex items-center justify-between">
              <CollapsibleTrigger className="flex items-center gap-1 font-medium text-df-green">
                Igazolások megtekintése <ChevronDown className="h-3 w-3" />
              </CollapsibleTrigger>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={copyProofs}>
                <Copy className="h-3 w-3" /> Másolás
              </Button>
            </div>
            <CollapsibleContent>
              {(["kotelezo", "jogcim_fuggo", "jogi_ellenorzes"] as ProofCategory[]).map((cat) => {
                const items = requiredProofs.filter((p) => p.category === cat);
                if (!items.length) return null;
                return (
                  <div key={cat} className="mb-2">
                    <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                      {CATEGORY_LABEL[cat]}
                    </div>
                    <ul className="list-disc space-y-0.5 pl-5 text-xs">
                      {items.map((p) => (
                        <li key={p.id}>{p.label}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className="space-y-2 pt-2">
          {comparison === "user_stronger" && (
            <Button
              className="w-full bg-df-green text-white hover:bg-[#173B2A]"
              size="lg"
              onClick={onAccept}
            >
              <Sparkles className="h-4 w-4" /> Elfogadó nyilatkozatot készítek
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

        <p className="border-t pt-3 text-[11px] text-muted-foreground">
          A kalkulátor tájékoztató jellegű. A jogosultságot és az elfogadó jognyilatkozat
          figyelembevételét a hatóság vizsgálja. Vitás ügyben ügyvédi ellenőrzés javasolt.
        </p>
      </div>
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
    <div className="rounded-md border border-df-border bg-df-cream/40 p-3">
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

const META: Record<LeaseComparisonResult["comparison"], { badge: string; copy?: string }> = {
  empty: {
    badge: "PIPÁLJ BE PÁR DOLGOT",
  },
  user_stronger: {
    badge: "TE ÁLLHATSZ ELŐRÉBB",
    copy: "A megadott adatok alapján előrébb állhatsz a sorban. Ha az adatok helyesek, lehet mire hivatkoznod.",
  },
  same_rank: {
    badge: "AZONOS RANGHELY",
  },
  user_weaker: {
    badge: "A BÉRLŐ ÁLLHAT ELŐRÉBB",
    copy: "A megadott adatok alapján valószínűleg hátrébb vagy a sorban. Jobb most tudni, mint vakon indulni.",
  },
  lessee_unknown: {
    badge: "A BÉRLŐ RANGHELYE NEM ISMERT",
  },
  incomplete_special: {
    badge: "HIÁNYOS ERŐS JOGCÍM",
  },
  cannot_determine: {
    badge: "NEM ÁLLAPÍTHATÓ MEG BIZTONSÁGGAL",
  },
  no_valid_user_rank: {
    badge: "NEM LÁTSZIK BIZTOS JOGCÍM",
  },
  exception: {
    badge: "KIVÉTEL LEHET",
  },
  no_prelease_right: {
    badge: "NINCS ELŐHASZONBÉRLETI JOG",
  },
  out_of_scope: {
    badge: "NEM FÖLDFORGALMI TV. HATÁLY",
    copy: "Kivett terület esetén ez a ranghely kalkulátor nem alkalmazható. Ilyenkor nem a Földforgalmi törvény szerinti előhaszonbérleti ranghelyről beszélünk.",
  },
};
