import { useMemo, useState } from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Wand2, X } from "lucide-react";
import { LandContextCard, DEFAULT_LAND, toLandContext, type LandContextValue } from "@/components/rank/LandContextCard";
import { PartyStatusCard } from "@/components/rank/PartyStatusCard";
import { ResultPanel } from "@/components/rank/ResultPanel";
import { ExceptionsCollapsible } from "@/components/rank/ExceptionsCollapsible";
import { GuidedFlow } from "@/components/rank/GuidedFlow";
import { EMPTY_PARTY, type PartyStatus, type TransactionException } from "@/lib/rank/leaseTypes";
import { compareLeaseRanks } from "@/lib/rank/leaseRankComparison";

type Search = {
  from?: string;
  branch?: "forest" | "non_forest";
  mode?: "quick" | "guided";
};

export const Route = createFileRoute("/ranghely-kalkulator")({
  head: () => ({
    meta: [
      { title: "Ki áll előrébb a haszonbérleti rangsorban? | Dr Föld" },
      { name: "description", content: "Dr Föld ranghely kalkulátor: jelöld be, mi igaz a kifüggesztett bérlőre és mi igaz rád. Megmutatjuk, kinek lehet erősebb előhaszonbérleti ranghelye." },
      { property: "og:title", content: "Dr Föld — Ranghely kalkulátor" },
      { property: "og:description", content: "Ravasz a gazda: nézd meg, hol állsz a sorban." },
    ],
  }),
  validateSearch: (s): Search => ({
    from: typeof s.from === "string" ? s.from : undefined,
    branch: s.branch === "forest" || s.branch === "non_forest" ? s.branch : undefined,
    mode: s.mode === "guided" ? "guided" : "quick",
  }),
  component: RankCalculatorPage,
});

function RankCalculatorPage() {
  const search = useSearch({ from: "/ranghely-kalkulator" });
  const [showNoticeChip, setShowNoticeChip] = useState(!!search.from);
  const [mode, setMode] = useState<"quick" | "guided">(search.mode ?? "quick");

  const [land, setLand] = useState<LandContextValue>(() => ({
    ...DEFAULT_LAND,
    branch: search.branch ?? DEFAULT_LAND.branch,
  }));
  const [lessee, setLessee] = useState<PartyStatus>(() => ({ ...EMPTY_PARTY }));
  const [me, setMe] = useState<PartyStatus>(() => ({ ...EMPTY_PARTY }));

  const setExceptions = (next: TransactionException[]) => setLand({ ...land, exceptions: next });

  const result = useMemo(
    () => compareLeaseRanks({ landContext: toLandContext(land), lesseeStatus: lessee, userStatus: me }),
    [land, lessee, me]
  );

  const onAccept = () => {
    const snapshot = {
      landContext: toLandContext(land),
      lesseeStatus: lessee,
      userStatus: me,
      userStrongestRank: result.userStrongestRank,
      lesseeStrongestRank: result.lesseeStrongestRank,
      comparison: result.comparison,
      requiredProofs: result.requiredProofs,
      warnings: result.warnings,
      createdAt: new Date().toISOString(),
    };
    try { sessionStorage.setItem("rank_calculation_snapshot", JSON.stringify(snapshot)); } catch {}
    toast.success("Számítás mentve. Folytasd az elfogadó nyilatkozat előkészítésével.");
  };

  return (
    <PageShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="border-primary/40 text-primary">Dr Föld</Badge>
            <span>Ranghely kalkulátor</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
            Ki áll előrébb a haszonbérleti rangsorban?
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Válaszd ki, mi igaz a kifüggesztett bérlőre és mi igaz rád. Dr Föld megmutatja, kinek lehet erősebb előhaszonbérleti ranghelye.
          </p>
          <p className="text-sm text-primary font-medium flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" /> Ravasz a gazda: nézd meg, hol állsz a sorban.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <div className="inline-flex rounded-lg border p-0.5 bg-muted/40">
              <button
                onClick={() => setMode("quick")}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors ${mode === "quick" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
              >
                Gyors kalkulátor
              </button>
              <button
                onClick={() => setMode("guided")}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors inline-flex items-center gap-1 ${mode === "guided" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
              >
                <Wand2 className="h-3 w-3" /> Kérdezz-felelek
              </button>
            </div>
            {showNoticeChip && (
              <div className="inline-flex items-center gap-2 text-xs bg-muted px-2.5 py-1 rounded-full">
                Kifüggesztésből indítva
                <button onClick={() => setShowNoticeChip(false)} aria-label="Bezár"><X className="h-3 w-3" /></button>
              </div>
            )}
          </div>
        </header>

        {mode === "guided" ? (
          <GuidedFlow
            land={land}
            setLand={setLand}
            lessee={lessee}
            setLessee={setLessee}
            me={me}
            setMe={setMe}
            result={result}
            onAccept={onAccept}
            onFinish={() => setMode("quick")}
          />
        ) : (
          <>
            {/* Desktop: 2-col with sticky result. */}
            <div className="hidden lg:grid lg:grid-cols-[2fr_1fr] gap-6 items-start">
              <div className="space-y-5">
                <LandContextCard value={land} onChange={setLand} />
                <div className="grid grid-cols-2 gap-4">
                  <PartyStatusCard
                    title="2. Kifüggesztett bérlő"
                    subtitle="Mit tudsz róla? Több is igaz lehet."
                    value={lessee}
                    onChange={setLessee}
                    voice="third"
                    accentClass="border-rose-200 bg-rose-50/30"
                  />
                  <PartyStatusCard
                    title="3. Te"
                    subtitle="Mi igaz rád? Több dolgot is bejelölhetsz."
                    helper="A Dr Föld nem összeadja a jogcímeket, hanem megkeresi a legerősebb érvényes ranghelyedet."
                    value={me}
                    onChange={setMe}
                    voice="first"
                    accentClass="border-emerald-200 bg-emerald-50/30"
                    onUnsure={() => setMode("guided")}
                  />
                </div>
                <ExceptionsCollapsible value={land.exceptions ?? []} onChange={setExceptions} />
              </div>
              <div>
                <ResultPanel result={result} onAccept={onAccept} />
              </div>
            </div>

            {/* Mobile: stack. */}
            <div className="lg:hidden space-y-4">
              <LandContextCard value={land} onChange={setLand} />
              <PartyStatusCard
                title="2. Kifüggesztett bérlő"
                subtitle="Mit tudsz róla? Több is igaz lehet."
                value={lessee}
                onChange={setLessee}
                voice="third"
                accentClass="border-rose-200 bg-rose-50/30"
              />
              <PartyStatusCard
                title="3. Te"
                subtitle="Mi igaz rád? Több is igaz lehet."
                helper="Nem összeadjuk — a legerősebb érvényes jogcímedet keressük."
                value={me}
                onChange={setMe}
                voice="first"
                accentClass="border-emerald-200 bg-emerald-50/30"
                onUnsure={() => setMode("guided")}
              />
              <ResultPanel result={result} onAccept={onAccept} />
              <ExceptionsCollapsible value={land.exceptions ?? []} onChange={setExceptions} />
              {result.comparison === "user_stronger" && (
                <div className="fixed bottom-0 inset-x-0 bg-background border-t p-3 z-40 shadow-lg">
                  <Button className="w-full" size="lg" onClick={onAccept}>
                    <Sparkles className="h-4 w-4" /> Elfogadó nyilatkozatot készítek
                  </Button>
                </div>
              )}
              <div className="h-16" />
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
