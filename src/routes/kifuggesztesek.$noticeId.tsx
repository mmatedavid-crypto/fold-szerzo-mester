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
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  FileCheck2,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  Scale,
} from "lucide-react";

export const Route = createFileRoute("/kifuggesztesek/$noticeId")({
  head: () => ({
    meta: [
      { title: `Ranghely-kalkulátor | Dr Föld` },
      {
        name: "description",
        content:
          "Ellenőrizd az előhaszonbérleti ranghelyedet a kifüggesztett hirdetményhez. Ha előrébb állsz, ne maradj hátul.",
      },
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

const STEPS = ["Hirdetmény", "Föld", "Szerződő fél", "Te", "Eredmény"];

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
        .select(
          "id, source_notice_id, subject, settlement, municipality, parcel_numbers, notice_type, cultivation_branch, publication_date, deadline_date, original_detail_url",
        )
        .eq("id", noticeId)
        .maybeSingle();
      if (error) throw error;
      return data as Notice | null;
    },
  });

  const [step, setStep] = useState(0);
  const [branch, setBranch] = useState<LandBranch>("non_forest");
  const [transaction, setTransaction] = useState<TransactionKind>("lease");
  const [contractingParty, setContractingParty] = useState<ClaimantProfile>(DEFAULT_CLAIMANT);
  const [claimant, setClaimant] = useState<ClaimantProfile>(DEFAULT_CLAIMANT);

  const cultivationTags = useMemo<string[]>(() => {
    const cb = (q.data?.cultivation_branch ?? "").toLowerCase();
    const tags: string[] = [];
    if (cb.includes("legel")) tags.push("legelo");
    if (cb.includes("rét") || cb.includes("ret")) tags.push("ret");
    return tags;
  }, [q.data]);

  // A szerződő fél ranghelyét UGYANAZZAL a motorral számoljuk —
  // így biztosítjuk, hogy a saját rangsorral konzisztens módon vethető össze.
  const partyRank = useMemo(() => {
    const baseFacts: NoticeFacts = {
      branch,
      transaction,
      settlement: q.data?.settlement ?? "",
      contractingPartyRank: null,
      cultivationBranchTags: cultivationTags,
    };
    return computeRank(baseFacts, contractingParty).rank;
  }, [branch, transaction, q.data?.settlement, cultivationTags, contractingParty]);

  const facts: NoticeFacts = useMemo(
    () => ({
      branch,
      transaction,
      settlement: q.data?.settlement ?? "",
      contractingPartyRank: partyRank,
      cultivationBranchTags: cultivationTags,
    }),
    [branch, transaction, q.data?.settlement, partyRank, cultivationTags],
  );

  const result = useMemo(
    () => (step === 4 ? computeRank(facts, claimant) : null),
    [step, facts, claimant],
  );

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
            <Link to="/kifuggesztesek">
              <ArrowLeft className="h-4 w-4 mr-1" /> Vissza a listához
            </Link>
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
          <Link to="/kifuggesztesek">
            <ArrowLeft className="h-4 w-4 mr-1" /> Vissza
          </Link>
        </Button>

        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2 mb-2">
                {n.notice_type && <Badge variant="outline">{n.notice_type}</Badge>}
                {n.cultivation_branch && <Badge variant="secondary">{n.cultivation_branch}</Badge>}
              </div>
              <h1 className="font-serif text-xl leading-tight">
                {n.subject ?? n.source_notice_id ?? "Kifüggesztés"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {n.settlement ?? "—"} {n.municipality ? `• ${n.municipality}` : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Közzététel: {n.publication_date ? formatDate(n.publication_date) : "—"}
                {deadline && (
                  <>
                    {" "}
                    • Elfogadás határideje (15 nap):{" "}
                    <strong className="text-foreground">
                      {formatDate(deadline.toISOString())}
                    </strong>
                  </>
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
            <p className="text-xs text-muted-foreground mt-3">
              Hrsz.: {n.parcel_numbers.join(", ")}
            </p>
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
                A 2013. évi CXXII. tv. (Földforgalmi tv.) 46. §-a alapján egy rövid kérdéssorral
                kiszámoljuk a ranghelyedet, és összevetjük a szerződő félével.
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
                <RadioGroup
                  value={branch}
                  onValueChange={(v) => setBranch(v as LandBranch)}
                  className="grid gap-2"
                >
                  <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
                    <RadioGroupItem value="non_forest" /> Nem erdő (szántó, rét, legelő, szőlő,
                    gyümölcs, stb.)
                  </label>
                  <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
                    <RadioGroupItem value="forest" /> Erdő (Evt. szerinti speciális szabályok)
                  </label>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Ügylet típusa</Label>
                <RadioGroup
                  value={transaction}
                  onValueChange={(v) => setTransaction(v as TransactionKind)}
                  className="grid gap-2 md:grid-cols-2"
                >
                  <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
                    <RadioGroupItem value="lease" /> Haszonbérlet (előhaszonbérleti jog)
                  </label>
                  <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
                    <RadioGroupItem value="sale" /> Adásvétel (elővásárlási jog)
                  </label>
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-sm">
              <h2 className="font-serif text-lg">A szerződő fél státusza</h2>
              <p className="text-xs text-muted-foreground">
                Jelöld be a kifüggesztett szerződésben szereplő vevő/bérlő jogcímeit. Ezek alapján a
                rendszer kiszámolja a ranghelyét. Több jogcím is jelölhető — a motor a legerősebb
                szerint sorolja be.
              </p>
              <ProfileFields
                profile={contractingParty}
                setProfile={setContractingParty}
                settlement={n.settlement}
                branch={branch}
                role="party"
              />
              <Separator />
              <p className="text-xs text-muted-foreground">
                Számított ranghely:{" "}
                <strong className="text-foreground">{formatRank(partyRank)}</strong>
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-sm">
              <h2 className="font-serif text-lg">A te státuszod</h2>
              <p className="text-xs text-muted-foreground">
                Jelöld be a saját jogcímeidet. Egyszerre több is bejelölhető (pl. helyben lakó +
                állattartó).
              </p>
              <ProfileFields
                profile={claimant}
                setProfile={setClaimant}
                settlement={n.settlement}
                branch={branch}
                role="self"
              />
            </div>
          )}

          {step === 4 && result && (
            <ResultPanel
              result={result}
              noticeId={n.id}
              deadline={deadline}
              partyRank={partyRank}
              onRestart={() => {
                setStep(0);
                setClaimant(DEFAULT_CLAIMANT);
                setContractingParty(DEFAULT_CLAIMANT);
              }}
            />
          )}

          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={step === 0}
              onClick={() => setStep(Math.max(0, step - 1))}
            >
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
          A számítás csak előzetes tájékoztatás — a jogosultság megállapítása a jegyző /
          mezőgazdasági igazgatási szerv hatáskörébe tartozik.
        </p>
      </section>
    </PageShell>
  );
}

function CheckRow({
  checked,
  onChange,
  title,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  desc: string;
}) {
  return (
    <label className="flex items-start gap-3 border rounded-md px-3 py-3 cursor-pointer hover:bg-muted/30">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="mt-0.5"
      />
      <div className="min-w-0">
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </label>
  );
}

function formatRank(r: number | null): string {
  if (r === null) return "Nincs ranghely";
  return `${r}. ranghely`;
}

function ProfileFields({
  profile,
  setProfile,
  settlement,
  branch,
  role,
}: {
  profile: ClaimantProfile;
  setProfile: (p: ClaimantProfile) => void;
  settlement: string | null;
  branch: LandBranch;
  role: "self" | "party";
}) {
  const meLabel = role === "self" ? "vagyok" : "ő";
  const setForest = (patch: Partial<NonNullable<ClaimantProfile["forest"]>>) =>
    setProfile({ ...profile, forest: { ...profile.forest, ...patch } });

  return (
    <div className="space-y-3">
      <CheckRow
        checked={profile.isFoldmuves}
        onChange={(v) => setProfile({ ...profile, isFoldmuves: v })}
        title={`Földműves ${meLabel}`}
        desc="A földműves nyilvántartásban szereplő természetes személy (Földforgalmi tv. 5. § 7. pont)."
      />
      <CheckRow
        checked={profile.isHelybenLako}
        onChange={(v) => setProfile({ ...profile, isHelybenLako: v })}
        title={`Helyben lakó ${meLabel}`}
        desc={`Életvitelszerűen a föld fekvése szerinti településen (${settlement ?? "—"}) lakik legalább 3 éve.`}
      />
      <CheckRow
        checked={profile.isCsaladiGazdasagTag}
        onChange={(v) => setProfile({ ...profile, isCsaladiGazdasagTag: v })}
        title="Családi mezőgazdasági társaság / őstermelők családi gazdaságának tagja"
        desc="46. § (1) a) — a legerősebb 1. ranghelyi alcsoport."
      />
      <CheckRow
        checked={profile.isAllattarto}
        onChange={(v) => setProfile({ ...profile, isAllattarto: v })}
        title="Állattartó telepet üzemeltet"
        desc="46. § (1) c) — rét/legelő esetén külön preferencia."
      />
      <CheckRow
        checked={profile.isJelenlegiFoldhasznalo}
        onChange={(v) => setProfile({ ...profile, isJelenlegiFoldhasznalo: v })}
        title="Jelenlegi földhasználó ezen a parcellán"
        desc="A kifüggesztett földön jelenleg haszonbérlő / földhasználó."
      />
      <CheckRow
        checked={profile.isSzomszedosFoldhasznalo}
        onChange={(v) => setProfile({ ...profile, isSzomszedosFoldhasznalo: v })}
        title="Szomszédos földhasználó"
        desc="A kifüggesztett földdel közvetlenül határos parcellát használ."
      />
      <CheckRow
        checked={profile.isTelepulesiFoldhasznalo}
        onChange={(v) => setProfile({ ...profile, isTelepulesiFoldhasznalo: v })}
        title="A településen másik földön földhasználó"
        desc={`A föld fekvése szerinti településen (${settlement ?? "—"}) más parcellán használ földet.`}
      />
      <Separator />
      <CheckRow
        checked={profile.isCloseRelativeOfSeller}
        onChange={(v) => setProfile({ ...profile, isCloseRelativeOfSeller: v })}
        title={
          role === "self"
            ? "Közeli hozzátartozó vagyok az eladóval/bérbeadóval"
            : "Az eladó/bérbeadó közeli hozzátartozója"
        }
        desc="Ptk. 8:1. § — kizárja az elővásárlási jog gyakorlását (46. § (5))."
      />
      <CheckRow
        checked={profile.isExemptEntity}
        onChange={(v) => setProfile({ ...profile, isExemptEntity: v })}
        title="Állam, önkormányzat vagy egyházi jogi személy"
        desc="Az általános 46. § szerinti ranghely nem alkalmazható."
      />
      {branch === "forest" && (
        <>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Erdő esetén kiegészítő jogcímek (Evt., 2009. évi XXXVII. tv.):
          </p>
          <CheckRow
            checked={!!profile.forest?.isAdjacentForestOwner}
            onChange={(v) => setForest({ isAdjacentForestOwner: v })}
            title="Szomszédos erdő tulajdonosa"
            desc="Evt. szerinti tulajdonosi szomszédság."
          />
          <CheckRow
            checked={!!profile.forest?.isCommonForestOwner}
            onChange={(v) => setForest({ isCommonForestOwner: v })}
            title="Közös tulajdonú erdőben tulajdonostárs"
            desc="Evt. szerinti tulajdonostársi jogcím."
          />
          <CheckRow
            checked={!!profile.forest?.isForestryProfessional}
            onChange={(v) => setForest({ isForestryProfessional: v })}
            title="Erdőgazdálkodói minősítéssel rendelkezik"
            desc="Bejegyzett erdőgazdálkodó / szakmai minősítéssel."
          />
        </>
      )}
    </div>
  );
}

function ResultPanel({
  result,
  noticeId,
  deadline,
  partyRank,
  onRestart,
}: {
  result: ReturnType<typeof computeRank>;
  noticeId: string;
  deadline: Date | null;
  partyRank: number | null;
  onRestart: () => void;
}) {
  const stronger = result.strongerThanContractingParty;
  const hasRank = result.rank !== null;
  const sameRank = hasRank && partyRank !== null && result.rank === partyRank;

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start gap-3">
        <div
          className={
            "h-10 w-10 rounded-full flex items-center justify-center shrink-0 " +
            (stronger
              ? "bg-primary/10 text-primary"
              : hasRank
                ? "bg-muted text-foreground"
                : "bg-destructive/10 text-destructive")
          }
        >
          {stronger ? (
            <Trophy className="h-5 w-5" />
          ) : hasRank ? (
            <ShieldCheck className="h-5 w-5" />
          ) : (
            <ShieldAlert className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-serif text-lg">
            {hasRank ? `${result.rank}. ranghely` : "Az adott profillal nincs jogod"}
          </h2>
          <p className="text-muted-foreground mt-1">{result.reason}</p>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 pt-2">
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">Te</div>
          <div className="font-serif text-base">{formatRank(result.rank)}</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">Szerződő fél</div>
          <div className="font-serif text-base">{formatRank(partyRank)}</div>
        </div>
      </div>

      <Alert>
        <Scale className="h-4 w-4" />
        <AlertTitle>
          {stronger === true
            ? "Erősebb vagy a szerződő félnél"
            : sameRank
              ? "Azonos ranghelyen álltok"
              : hasRank && partyRank !== null
                ? "A szerződő fél erősebb"
                : "Összevetés nem értelmezhető"}
        </AlertTitle>
        <AlertDescription>
          {stronger === true && (
            <>
              Elfogadó nyilatkozattal beléphetsz a szerződésbe a 15 napos jogvesztő határidőn belül
              {deadline ? <> ({formatDate(deadline.toISOString())}-ig)</> : null}.
            </>
          )}
          {sameRank && (
            <>
              Azonos ranghely esetén az elfogadó nyilatkozat csak akkor előzi meg a szerződő felet,
              ha azon belül erősebb alcsoportba tartozol — ezt a jegyző / mg-i igazgatási szerv
              bírálja el.
            </>
          )}
          {!stronger && !sameRank && hasRank && partyRank !== null && (
            <>A szerződő fél ranghelye erősebb, így elfogadó nyilatkozattal nem léphetsz be.</>
          )}
          {!hasRank && <>A megadott profillal nincs elővásárlási / előhaszonbérleti jogod.</>}
        </AlertDescription>
      </Alert>

      {result.warnings.length > 0 && (
        <Alert>
          <AlertTitle>Figyelmeztetések</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 space-y-1">
              {result.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        {stronger === true && (
          <Button asChild>
            <Link to="/elfogado-nyilatkozat">
              <FileCheck2 className="h-4 w-4 mr-1" /> Elfogadó nyilatkozatot készítek
            </Link>
          </Button>
        )}
        <Button variant="outline" onClick={onRestart}>
          Új számítás
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground pt-2">
        Szabálykészlet verzió: {result.rulesVersion} • Indoklás-kód:{" "}
        <code>{result.reasonCode}</code>
      </p>
    </div>
  );
}
