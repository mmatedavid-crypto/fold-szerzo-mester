import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X } from "lucide-react";
import { LandContextCard } from "@/components/rank/LandContextCard";
import { GuidedFlow } from "@/components/rank/GuidedFlow";
import { DEFAULT_LAND, toLandContext, type LandContextValue } from "@/lib/rank/landContextUi";
import { EMPTY_PARTY, type PartyStatus } from "@/lib/rank/leaseTypes";
import { compareLeaseRanks } from "@/lib/rank/leaseRankComparison";
import { company } from "@/lib/company";

type Search = {
  from?: string;
  branch?: "forest" | "non_forest";
};

export const Route = createFileRoute("/ranghely-kalkulator")({
  head: () => ({
    meta: [
      { title: "Ki áll előrébb a haszonbérleti rangsorban? | Dr Föld" },
      {
        name: "description",
        content:
          "Dr Föld ranghely kalkulátor: jelöld be, mi igaz a kifüggesztett bérlőre és mi igaz rád. Megmutatjuk, kinek lehet erősebb előhaszonbérleti ranghelye.",
      },
      { property: "og:title", content: "Dr Föld — Ranghely kalkulátor" },
      { property: "og:description", content: "Ravasz a gazda: nézd meg, hol állsz a sorban." },
    ],
    links: [{ rel: "canonical", href: `${company.websiteUrl}/ranghely-kalkulator` }],
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
  const [resetKey, setResetKey] = useState(0);

  const [land, setLand] = useState<LandContextValue>(() => ({
    ...DEFAULT_LAND,
    branch: search.branch ?? DEFAULT_LAND.branch,
  }));
  const [lessee, setLessee] = useState<PartyStatus>(() => ({ ...EMPTY_PARTY }));
  const [me, setMe] = useState<PartyStatus>(() => ({ ...EMPTY_PARTY }));

  const result = useMemo(
    () =>
      compareLeaseRanks({ landContext: toLandContext(land), lesseeStatus: lessee, userStatus: me }),
    [land, lessee, me],
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
    try {
      sessionStorage.setItem("rank_calculation_snapshot", JSON.stringify(snapshot));
    } catch {
      // sessionStorage may be unavailable in restricted browser contexts.
    }
    toast.success("Számítás mentve. Folytasd az elfogadó nyilatkozat előkészítésével.");
    void navigate({ to: "/elfogado-nyilatkozat" });
  };

  const restart = () => {
    setLand({ ...DEFAULT_LAND, branch: search.branch ?? DEFAULT_LAND.branch });
    setLessee({ ...EMPTY_PARTY });
    setMe({ ...EMPTY_PARTY });
    setResetKey((k) => k + 1);
  };

  return (
    <PageShell>
      <div className="min-h-[calc(100vh-4rem)] space-y-6 bg-df-cream px-4 py-6 md:px-8 md:py-10">
        <header className="mx-auto max-w-2xl space-y-2 text-center">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="border-primary/40 text-primary">
              Dr Föld
            </Badge>
            <span>Ranghely kalkulátor</span>
          </div>
          <h1 className="font-brand text-3xl font-bold tracking-[-0.02em] text-df-ink md:text-5xl">
            Ranghely kalkulátor
          </h1>
          <p className="mx-auto max-w-xl text-df-gray">
            Válaszolj pár egyszerű kérdésre. Dr Föld megmutatja, kinek lehet erősebb
            előhaszonbérleti ranghelye.
          </p>
          <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-df-green">
            <Sparkles className="h-4 w-4" /> Ravasz a gazda: nézd meg, hol állsz a sorban.
          </p>
          {showNoticeChip && (
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 text-xs bg-muted px-2.5 py-1 rounded-full">
                Kifüggesztésből indítva
                <button onClick={() => setShowNoticeChip(false)} aria-label="Bezár">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </header>

        <GuidedFlow
          key={resetKey}
          land={land}
          setLand={setLand}
          lessee={lessee}
          setLessee={setLessee}
          me={me}
          setMe={setMe}
          result={result}
          onAccept={onAccept}
          onFinish={restart}
        />
      </div>
    </PageShell>
  );
}
