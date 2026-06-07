import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LandContextCard, DEFAULT_LAND, toLandContext, type LandContextValue } from "@/components/rank/LandContextCard";
import { PartyStatusCard } from "@/components/rank/PartyStatusCard";
import { ResultPanel } from "@/components/rank/ResultPanel";
import { ExceptionsCollapsible } from "@/components/rank/ExceptionsCollapsible";
import { EMPTY_PARTY, type PartyStatus } from "@/lib/rank/leaseTypes";
import { compareLeaseRanks } from "@/lib/rank/leaseRankComparison";

type Search = {
  from?: string;
  branch?: "forest" | "non_forest";
};

export const Route = createFileRoute("/ranghely-kalkulator")({
  head: () => ({
    meta: [
      { title: "Ranghely kalkulátor — Ki áll előrébb a haszonbérleti rangsorban? | Dr Föld" },
      { name: "description", content: "Önálló kalkulátor: jelöld be, mi igaz a kifüggesztett bérlőre és mi igaz rád. Megmutatjuk, ki áll előrébb a sorban, milyen jogcímen, és milyen igazolás kell hozzá." },
    ],
  }),
  validateSearch: (s): Search => ({
    from: typeof s.from === "string" ? s.from : undefined,
    branch: s.branch === "forest" || s.branch === "non_forest" ? s.branch : undefined,
  }),
  component: RankCalculatorPage,
});

function RankCalculatorPage() {
  const search = useSearch({ from: "/ranghely-kalkulator" });
  const navigate = useNavigate();
  const [showNoticeChip, setShowNoticeChip] = useState(!!search.from);

  const [land, setLand] = useState<LandContextValue>(() => ({
    ...DEFAULT_LAND,
    branch: search.branch ?? DEFAULT_LAND.branch,
  }));
  const [lessee, setLessee] = useState<PartyStatus>(() => ({ ...EMPTY_PARTY }));
  const [me, setMe] = useState<PartyStatus>(() => ({ ...EMPTY_PARTY }));
  const [exceptions, setExceptions] = useState<string[]>([]);

  const result = useMemo(
    () =>
      compareLeaseRanks({
        landContext: toLandContext(land),
        lesseeStatus: lessee,
        userStatus: me,
      }),
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
      createdAt: new Date().toISOString(),
    };
    try {
      sessionStorage.setItem("rank_calculation_snapshot", JSON.stringify(snapshot));
    } catch {}
    navigate({ to: "/szerzodes/uj", search: { fromRankCalculation: "1" } as never });
  };

  return (
    <PageShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">Ranghely kalkulátor</h1>
          <p className="text-muted-foreground">
            Jelöld be, mi igaz a kifüggesztett bérlőre és mi igaz rád. Megmutatjuk, ki áll előrébb a sorban.
          </p>
          <p className="text-sm text-primary font-medium">Nézd meg, hol állsz a sorban.</p>
          {showNoticeChip && (
            <div className="inline-flex items-center gap-2 text-xs bg-muted px-2.5 py-1 rounded-full">
              Kifüggesztésből indítva
              <button onClick={() => setShowNoticeChip(false)} aria-label="Bezár"><X className="h-3 w-3" /></button>
            </div>
          )}
        </header>

        {/* Desktop: 3-column. Mobile: accordion. */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_2fr_1fr] gap-5 items-start">
          <div className="space-y-4">
            <LandContextCard value={land} onChange={setLand} />
            <ExceptionsCollapsible value={exceptions} onChange={setExceptions} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <PartyStatusCard
              title="Kifüggesztett bérlő"
              subtitle="Több jogcím is bejelölhető. A Dr Föld a legerősebbet veszi figyelembe."
              value={lessee}
              onChange={setLessee}
            />
            <PartyStatusCard
              title="Te"
              subtitle="Több is igaz lehet rád. Lehetsz fiatal gazda és szomszéd egyszerre."
              helper="Nem összeadjuk, hanem a legerősebb érvényes jogcímedet keressük."
              value={me}
              onChange={setMe}
            />
          </div>
          <ResultPanel result={result} onAccept={onAccept} />
        </div>

        <div className="lg:hidden">
          <Accordion type="multiple" defaultValue={["land", "lessee", "me", "result"]}>
            <AccordionItem value="land">
              <AccordionTrigger>1. Föld és ügylet</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <LandContextCard value={land} onChange={setLand} />
                  <ExceptionsCollapsible value={exceptions} onChange={setExceptions} />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="lessee">
              <AccordionTrigger>2. Kifüggesztett bérlő</AccordionTrigger>
              <AccordionContent>
                <PartyStatusCard
                  title="Kifüggesztett bérlő"
                  subtitle="Több jogcím is bejelölhető."
                  value={lessee}
                  onChange={setLessee}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="me">
              <AccordionTrigger>3. Én</AccordionTrigger>
              <AccordionContent>
                <PartyStatusCard
                  title="Te"
                  subtitle="Több is igaz lehet rád."
                  helper="Nem összeadjuk, hanem a legerősebb érvényes jogcímedet keressük."
                  value={me}
                  onChange={setMe}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="result">
              <AccordionTrigger>4. Eredmény</AccordionTrigger>
              <AccordionContent>
                <ResultPanel result={result} onAccept={onAccept} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          {result.comparison === "user_stronger" && (
            <div className="fixed bottom-0 inset-x-0 bg-background border-t p-3 z-40">
              <Button className="w-full" onClick={onAccept}>Elfogadó nyilatkozatot készítek</Button>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}