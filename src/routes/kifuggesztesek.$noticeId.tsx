import { useMemo, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { WizardStepper } from "@/components/wizard/wizard-stepper";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";
import { computeRank, computeAcceptanceDeadline } from "@/lib/rank/engine";
import type { ClaimantProfile, NoticeFacts, LandBranch, TransactionKind } from "@/lib/rank/types";
import { ArrowLeft, ArrowRight, ExternalLink, FileCheck2, Loader2, ShieldAlert, ShieldCheck, Trophy } from "lucide-react";

export const Route = createFileRoute("/kifuggesztesek/$noticeId")({
  head: ({ params }) => ({
    meta: [
      { title: `Ranghely-kalkulátor — ${params.noticeId} | Földbérleti Szerződés Generátor` },
      { name: "description", content: "Ellenőrizd a Földforgalmi tv. 46. §-a szerinti elővásárlási/előhaszonbérleti ranghelyedet a kifüggesztett hirdetményhez." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: NoticeDetailPage,
});

type Notice = {
  id: string;
  source_notice_id: string | null;
  subject: string | null;
  settlement: string | null;
  municipality: string | null;
  parcel_numbers: string[] | null;
  notice_type: string | null;
  cultivation_branch: string | null;
  publication_date: string | null;
  deadline_date: string | null;
  original_detail_url: string | null;
};

const STEPS = ["Hirdetmény", "Föld", "Profil", "Földhasználat", "Eredmény"];

const DEFAULT_CLAIMANT: ClaimantProfile = {
  isFoldmuves: false,
  isHelybenLako: false,
  isSzomszedosFoldhasznalo: false,
  isJelenlegiFoldhasznalo: false,
  isTelepulesiFoldhasznalo: false,
  isAllattarto: false,
  isCsaladiGazdasagTag: false,
  isCloseRelativeOfSeller: false,
  isExemptEntity: false,
};

function NoticeDetailPage() {
  const { noticeId } = Route.useParams();
  const router = useRouter();

  const q = useQuery({
    queryKey: ["notice", noticeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("id, source_notice_id, subject, settlement, municipality, parcel_numbers, notice_type, cultivation_branch, publication_date, deadline_date, original_detail_url")
        .eq("id", noticeId)
        .maybeSingle();
      if (error) throw error;
      return data as Notice | null;
    },
  });

  const [step, setStep] = useState(0);
  const [branch, setBranch] = useState<LandBranch>("non_forest");
  const [transaction, setTransaction] = useState<TransactionKind>("lease");
  const [contractingPartyRank, setContractingPartyRank] = useState<number | null>(4);
  const [claimant, setClaimant] = useState<ClaimantProfile>(DEFAULT_CLAIMANT);

  const cultivationTags = useMemo<string[]>(() => {
    const cb = (q.data?.cultivation_branch ?? "").toLowerCase();
    const tags: string[] = [];
    if (cb.includes("legel")) tags.push("legelo");
    if (cb.includes("rét") || cb.includes("ret")) tags.push("ret");
    return tags;
  }, [q.data]);

  const facts: NoticeFacts = {
    branch,
    transaction,
    settlement: q.data?.settlement ?? "",
    contractingPartyRank,
    cultivationBranchTags: cultivationTags,
  };

  const result = useMemo(() => (step === 4 ? computeRank(facts, claimant) : null), [step, facts, claimant]);

  const deadline = useMemo(() => {
    if (!q.data?.publication_date) return null;
    return computeAcceptanceDeadline(new Date(q.data.publication_date));
  }, [q.data?.publication_date]);

  if (q.isLoading) {
    return (
      <PageShell>
        <div className="container mx-auto px-4 py-16 max-w-3xl flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Betöltés…
        </div>
      </PageShell>
    );
  }

  if (!q.data) {
    return (
      <PageShell>
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <h1 className="font-serif text-2xl">A hirdetmény nem található</h1>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/kifuggesztesek"><ArrowLeft className="h-4 w-4 mr-1" /> Vissza a listához</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  const n = q.data;

  return (
    <PageShell>
      <section className="container mx-auto px-4 py-8 max-w-3xl">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/kifuggesztesek"><ArrowLeft className="h-4 w-4 mr-1" /> Vissza</Link>
        </Button>

        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2 mb-2">
                {n.notice_type && <Badge variant="outline">{n.notice_type}</Badge>}
                {n.cultivation_branch && <Badge variant="secondary">{n.cultivation_branch}</Badge>}
              </div>
              <h1 className="font-serif text-xl leading-tight">{n.subject ?? n.source_notice_id ?? "Kifüggesztés"}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {n.settlement ?? "—"} {n.municipality ? `• ${n.municipality}` : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Közzététel: {n.publication_date ? formatDate(n.publication_date) : "—"}
                {deadline && (
                  <> • Elfogadás határideje (15 nap): <strong className="text-foreground">{formatDate(deadline.toISOString())}</strong></>
                )}
              </p>
            </div>
            {n.original_detail_url && (
              <Button asChild size="sm" variant="outline">
                <a href={n.original_detail_url} target="_blank" rel="noopener noreferrer">
                  Hivatalos oldal <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </Button>
            )}
          </div>
          {n.parcel_numbers?.length ? (
            <p className="text-xs text-muted-foreground mt-3">Hrsz.: {n.parcel_numbers.join(", ")}</p>
          ) : null}
        </Card>

        <div className="mt-6">
          <WizardStepper steps={STEPS} current={step} />
        </div>

        <Card className="p-5 mt-3">
          {step === 0 && (
            <div className="space-y-3 text-sm">
              <h2 className="font-serif text-lg">Van-e elővásárlási / előhaszonbérleti jogod?</h2>
              <p className="text-muted-foreground">
                A 2013. évi CXXII. tv. (Földforgalmi tv.) 46. §-a alapján egy rövid kérdéssorral kiszámoljuk a ranghelyedet, és összevetjük a szerződő félével.
              </p>
              <p className="text-xs text-muted-foreground">
                Tájékoztató jellegű, hatósági döntést nem helyettesít. Az adatok nem mentődnek.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5 text-sm">
              <h2 className="font-serif text-lg">A föld besorolása és az ügylet típusa</h2>
              <div className="space-y-2">
                <Label>Föld típusa</Label>
                <RadioGroup value={branch} onValueChange={(v) => setBranch(v as LandBranch)} className="grid gap-2">
                  <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
                    <RadioGroupItem value="non_forest" /> Nem erdő (szántó, rét, legelő, szőlő, gyümölcs, stb.)
                  </label>
                  <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
                    <RadioGroupItem value="forest" /> Erdő (Evt. szerinti speciális szabályok)
                  </label>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Ügylet típusa</Label>
                <RadioGroup value={transaction} onValueChange={(v) => setTransaction(v as TransactionKind)} className="grid gap-2 md:grid-cols-2">
                  <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
                    <RadioGroupItem value="lease" /> Haszonbérlet (előhaszonbérleti jog)
                  </label>
                  <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
                    <RadioGroupItem value="sale" /> Adásvétel (elővásárlási jog)
                  </label>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>A kifüggesztésen szereplő szerződő fél ranghelye (ha ismert)</Label>
                <RadioGroup
                  value={contractingPartyRank?.toString() ?? "unknown"}
                  onValueChange={(v) => setContractingPartyRank(v === "unknown" ? null : Number(v))}
                  className="grid gap-2 md:grid-cols-5"
                >
                  {["1", "2", "3", "4", "unknown"].map((v) => (
                    <label key={v} className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
                      <RadioGroupItem value={v} /> {v === "unknown" ? "Nem tudom" : `${v}.`}
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-sm">
              <h2 className="font-serif text-lg">A te profilod</h2>
              <CheckRow
                checked={claimant.isFoldmuves}
                onChange={(v) => setClaimant({ ...claimant, isFoldmuves: v })}
                title="Földműves vagyok"
                desc="A földműves nyilvántartásban szereplő természetes személy (Földforgalmi tv. 5. § 7. pont)."
              />
              <CheckRow
                checked={claimant.isHelybenLako}
                onChange={(v) => setClaimant({ ...claimant, isHelybenLako: v })}
                title="Helyben lakó vagyok"
                desc={`Életvitelszerűen a föld fekvése szerinti településen (${n.settlement ?? "—"}) lakom legalább 3 éve.`}
              />
              <CheckRow
                checked={claimant.isCsaladiGazdasagTag}
                onChange={(v) => setClaimant({ ...claimant, isCsaladiGazdasagTag: v })}
                title="Családi mezőgazdasági társaság / őstermelők családi gazdaságának tagja vagyok"
                desc="46. § (1) a) — a legerősebb 1. ranghelyi alcsoport."
              />
              <CheckRow
                checked={claimant.isAllattarto}
                onChange={(v) => setClaimant({ ...claimant, isAllattarto: v })}
                title="Állattartó telepet üzemeltetek"
                desc="46. § (1) c) — rét/legelő esetén külön preferencia."
              />
              <Separator />
              <CheckRow
                checked={claimant.isCloseRelativeOfSeller}
                onChange={(v) => setClaimant({ ...claimant, isCloseRelativeOfSeller: v })}
                title="Közeli hozzátartozó vagyok az eladóval/bérbeadóval"
                desc="Ptk. 8:1. § — ez kizárja az elővásárlási jog gyakorlását."
              />
              <CheckRow
                checked={claimant.isExemptEntity}
                onChange={(v) => setClaimant({ ...claimant, isExemptEntity: v })}
                title="Állam, önkormányzat vagy egyházi jogi személy vagyok"
                desc="Az általános 46. § szerinti ranghely nem alkalmazható."
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-sm">
              <h2 className="font-serif text-lg">Földhasználat</h2>
              <CheckRow
                checked={claimant.isJelenlegiFoldhasznalo}
                onChange={(v) => setClaimant({ ...claimant, isJelenlegiFoldhasznalo: v })}
                title="Jelenleg én használom ezt a földet"
                desc="A kifüggesztett parcellán jelenlegi haszonbérlő / földhasználó vagyok."
              />
              <CheckRow
                checked={claimant.isSzomszedosFoldhasznalo}
                onChange={(v) => setClaimant({ ...claimant, isSzomszedosFoldhasznalo: v })}
                title="Szomszédos földhasználó vagyok"
                desc="A kifüggesztett földdel közvetlenül határos parcellát használok."
              />
              <CheckRow
                checked={claimant.isTelepulesiFoldhasznalo}
                onChange={(v) => setClaimant({ ...claimant, isTelepulesiFoldhasznalo: v })}
                title="A településen másik földön földhasználó vagyok"
                desc={`A föld fekvése szerinti településen (${n.settlement ?? "—"}) más parcellán használok földet.`}
              />
              {branch === "forest" && (
                <>
                  <Separator />
                  <p className="text-xs text-muted-foreground">Erdő esetén kiegészítő jogcímek (Evt., 2009. évi XXXVII. tv.):</p>
                  <CheckRow
                    checked={!!claimant.forest?.isAdjacentForestOwner}
                    onChange={(v) => setClaimant({ ...claimant, forest: { ...claimant.forest, isAdjacentForestOwner: v } })}
                    title="Szomszédos erdő tulajdonosa vagyok"
                    desc="Evt. szerinti tulajdonosi szomszédság."
                  />
                  <CheckRow
                    checked={!!claimant.forest?.isCommonForestOwner}
                    onChange={(v) => setClaimant({ ...claimant, forest: { ...claimant.forest, isCommonForestOwner: v } })}
                    title="Közös tulajdonú erdőben tulajdonostárs vagyok"
                    desc="Evt. szerinti tulajdonostársi jogcím."
                  />
                  <CheckRow
                    checked={!!claimant.forest?.isForestryProfessional}
                    onChange={(v) => setClaimant({ ...claimant, forest: { ...claimant.forest, isForestryProfessional: v } })}
                    title="Erdőgazdálkodói minősítéssel rendelkezem"
                    desc="Bejegyzett erdőgazdálkodó / szakmai minősítéssel."
                  />
                </>
              )}
            </div>
          )}

          {step === 4 && result && (
            <ResultPanel
              result={result}
              noticeId={n.id}
              deadline={deadline}
              onRestart={() => { setStep(0); setClaimant(DEFAULT_CLAIMANT); }}
            />
          )}

          <div className="flex items-center justify-between mt-6">
            <Button variant="outline" size="sm" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Vissza
            </Button>
            {step < STEPS.length - 1 ? (
              <Button size="sm" onClick={() => setStep(step + 1)}>
                Tovább <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => router.invalidate()}>
                Újraszámítás
              </Button>
            )}
          </div>
        </Card>

        <p className="text-xs text-muted-foreground mt-4">
          A számítás csak előzetes tájékoztatás — a jogosultság megállapítása a jegyző / mezőgazdasági igazgatási szerv hatáskörébe tartozik.
        </p>
      </section>
    </PageShell>
  );
}

function CheckRow({ checked, onChange, title, desc }: { checked: boolean; onChange: (v: boolean) => void; title: string; desc: string }) {
  return (
    <label className="flex items-start gap-3 border rounded-md px-3 py-3 cursor-pointer hover:bg-muted/30">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <div className="min-w-0">
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </label>
  );
}

function ResultPanel({
  result,
  noticeId,
  deadline,
  onRestart,
}: {
  result: ReturnType<typeof computeRank>;
  noticeId: string;
  deadline: Date | null;
  onRestart: () => void;
}) {
  const stronger = result.strongerThanContractingParty;
  const hasRank = result.rank !== null;

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start gap-3">
        <div className={
          "h-10 w-10 rounded-full flex items-center justify-center shrink-0 " +
          (stronger ? "bg-primary/10 text-primary" : hasRank ? "bg-muted text-foreground" : "bg-destructive/10 text-destructive")
        }>
          {stronger ? <Trophy className="h-5 w-5" /> : hasRank ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <h2 className="font-serif text-lg">
            {hasRank ? `${result.rank}. ranghely` : "Az adott profillal nincs jogod"}
          </h2>
          <p className="text-muted-foreground mt-1">{result.reason}</p>
        </div>
      </div>

      {stronger === true && (
        <Alert>
          <AlertTitle>Erősebb vagy a szerződő félnél</AlertTitle>
          <AlertDescription>
            Elfogadó nyilatkozattal beléphetsz a szerződésbe a 15 napos jogvesztő határidőn belül
            {deadline ? <> ({formatDate(deadline.toISOString())}-ig)</> : null}.
          </AlertDescription>
        </Alert>
      )}
      {stronger === false && hasRank && (
        <Alert>
          <AlertTitle>Nem vagy erősebb a szerződő félnél</AlertTitle>
          <AlertDescription>
            A megadott profillal a szerződő fél ranghelye azonos vagy erősebb, így elfogadó nyilatkozattal nem léphetsz be.
          </AlertDescription>
        </Alert>
      )}

      {result.warnings.length > 0 && (
        <Alert>
          <AlertTitle>Figyelmeztetések</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 space-y-1">
              {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        {stronger === true && (
          <Button asChild>
            <Link to="/belepes">
              <FileCheck2 className="h-4 w-4 mr-1" /> Elfogadó nyilatkozat (hamarosan)
            </Link>
          </Button>
        )}
        <Button variant="outline" onClick={onRestart}>Új számítás</Button>
      </div>

      <p className="text-[11px] text-muted-foreground pt-2">
        Szabálykészlet verzió: {result.rulesVersion} • Indoklás-kód: <code>{result.reasonCode}</code>
      </p>
    </div>
  );
}