import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { BrandBadge } from "@/components/brand/brand-elements";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, X } from "lucide-react";
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
        <header className="mx-auto max-w-3xl rounded-lg border border-df-border bg-df-card p-6 text-center shadow-[0_18px_45px_rgba(26,26,26,0.08)] md:p-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <BrandBadge>Ranghely kalkulátor</BrandBadge>
            <Badge variant="outline" className="border-df-yellow text-df-green">
              Ravasz a gazda
            </Badge>
          </div>
          <h1 className="mt-4 font-brand text-4xl font-bold leading-tight text-df-green md:text-6xl">
            Ha előrébb állsz, ne maradj hátul.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-df-gray md:text-lg">
            Válaszolj pár egyszerű kérdésre. Dr Föld megmutatja, kinek lehet erősebb
            előhaszonbérleti ranghelye.
          </p>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-df-green">
            <Sparkles className="h-4 w-4" /> Ravasz a gazda: nézd meg, hol állsz a sorban.
          </p>
          {showNoticeChip && (
            <div className="pt-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-df-border bg-df-cream px-3 py-1.5 text-xs font-semibold text-df-green">
                <Search className="h-3.5 w-3.5" />
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
