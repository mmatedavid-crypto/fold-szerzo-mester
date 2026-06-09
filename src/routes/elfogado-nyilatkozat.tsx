import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BrandBadge, StampBadge } from "@/components/brand/brand-elements";
import {
  composeAcceptanceStatement,
  type AcceptanceInput,
} from "@/lib/contracts/acceptance.compose";
import { company } from "@/lib/company";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCopy,
  FileSignature,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/elfogado-nyilatkozat")({
  validateSearch: (search: Record<string, unknown>) => ({
    noticeId: stringSearch(search.noticeId),
    noticePublicationDate: stringSearch(search.noticePublicationDate),
    deadlineDate: stringSearch(search.deadlineDate),
    contractSubject: stringSearch(search.contractSubject),
  }),
  head: () => ({
    meta: [
      { title: "Elfogadó nyilatkozat előkészítése | Dr Föld" },
      {
        name: "description",
        content:
          "Készíts elő előhaszonbérleti elfogadó nyilatkozatot konkrét kifüggesztéshez, jogalaphoz, ranghelyhez és igazolásokhoz kapcsolva.",
      },
      { property: "og:title", content: "Elfogadó nyilatkozat előkészítése | Dr Föld" },
      {
        property: "og:description",
        content: "Előhaszonbérleti nyilatkozat előkészítése kézi indítással vagy ranghely alapján.",
      },
    ],
    links: [{ rel: "canonical", href: `${company.websiteUrl}/elfogado-nyilatkozat` }],
  }),
  component: AcceptancePage,
});

function AcceptancePage() {
  const search = Route.useSearch();
  const [input, setInput] = useState<AcceptanceInput>(() => {
    const rankPrefill = readRankSnapshotPrefill();
    return {
      noticeId: search.noticeId,
      noticePublicationDate: search.noticePublicationDate,
      deadlineDate: search.deadlineDate,
      contractSubject: search.contractSubject,
      ...rankPrefill,
      submittedAt: today(),
      signatureDate: today(),
      witnesses: [{}, {}],
    };
  });

  const composition = useMemo(() => composeAcceptanceStatement(input), [input]);
  const documentText = useMemo(() => renderComposition(composition), [composition]);

  function update<K extends keyof AcceptanceInput>(key: K, value: AcceptanceInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function updateWitness(index: 0 | 1, key: "name" | "address", value: string) {
    setInput((current) => {
      const witnesses = [...(current.witnesses ?? [{}, {}])];
      witnesses[index] = { ...(witnesses[index] ?? {}), [key]: value };
      return { ...current, witnesses };
    });
  }

  async function copyDocument() {
    try {
      await navigator.clipboard.writeText(documentText);
      toast.success("A nyilatkozat szövegét vágólapra másoltam.");
    } catch {
      toast.error("Nem sikerült másolni. Jelöld ki az előnézet szövegét kézzel.");
    }
  }

  return (
    <PageShell>
      <section className="border-b border-df-border bg-gradient-to-b from-df-card to-df-cream/70">
        <div className="container mx-auto max-w-7xl px-4 py-10 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[0.95fr,1.05fr]">
            <div>
              <BrandBadge>Nem trükk. Ranghely.</BrandBadge>
              <div className="mt-4 flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-md border border-df-border bg-df-card text-df-green">
                  <FileSignature className="h-7 w-7" />
                </span>
                <h1 className="font-brand text-4xl font-bold leading-tight text-df-green md:text-6xl">
                  Elfogadó nyilatkozat előkészítése
                </h1>
              </div>
              <p className="mt-4 max-w-3xl text-base leading-7 text-df-gray md:text-lg">
                Ha már tudod, melyik kifüggesztésre akarsz belépni, itt közvetlenül is elindíthatod.
                Add meg a konkrét hirdetményt, a jogalapodat, a törvény szerinti ranghelyedet és az
                igazolásokat.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button
                  asChild
                  variant="outline"
                  className="justify-start border-df-green text-df-green"
                >
                  <Link to="/kifuggesztesek">
                    <Search className="h-4 w-4" /> Kifüggesztést keresek
                  </Link>
                </Button>
                <Button asChild className="justify-start bg-df-green text-white hover:bg-[#173B2A]">
                  <Link to="/ranghely-kalkulator">
                    <Sparkles className="h-4 w-4" /> Ranghelyet ellenőrzök
                  </Link>
                </Button>
              </div>

              <Card className="mt-6 border-df-red/40 bg-df-red/10 p-5">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-df-red" />
                  <p className="text-sm leading-6 text-df-ink">
                    A Dr Föld dokumentumgeneráló és döntéstámogató szolgáltatás, nem ügyvédi iroda.
                    Egyedi, vitás vagy nagy értékű ügyben ügyvédi ellenőrzés javasolt.
                  </p>
                </div>
              </Card>
            </div>

            <Card className="df-dark-card relative overflow-hidden border-df-green p-6 text-df-card shadow-[0_18px_45px_rgba(26,26,26,0.14)]">
              <StampBadge className="absolute right-5 top-5 border-df-yellow text-df-yellow">
                Időben lépj
              </StampBadge>
              <div className="flex items-center gap-2 pr-28 font-semibold text-df-cream">
                <CheckCircle2 className="h-5 w-5 text-df-yellow" />
                Akkor indulj innen, ha ezek megvannak
              </div>
              <ul className="mt-5 grid gap-3 text-sm text-df-cream sm:grid-cols-2">
                <li>Kifüggesztett szerződés azonosítója</li>
                <li>15 napos jogvesztő határidő</li>
                <li>Jogalap és törvény szerinti ranghely</li>
                <li>Igazoló okiratok listája</li>
                <li>Benyújtás helye és időpontja</li>
                <li>Aláírás, tanúk vagy hiteles forma</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto grid max-w-7xl gap-6 px-4 pb-12 lg:grid-cols-[0.95fr,1.05fr]">
        <div className="space-y-4">
          <Card className="border-df-border bg-df-card p-5 shadow-sm">
            <h2 className="font-brand text-2xl font-bold text-df-green">1. Kifüggesztés</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Hirdetmény / ügy azonosító">
                <Input
                  value={input.noticeId ?? ""}
                  onChange={(event) => update("noticeId", event.target.value)}
                  placeholder="pl. 2220847 vagy ügyiratszám"
                />
              </Field>
              <Field label="Közzététel kezdő napja">
                <Input
                  type="date"
                  value={input.noticePublicationDate ?? ""}
                  onChange={(event) => update("noticePublicationDate", event.target.value)}
                />
              </Field>
              <Field label="Jogvesztő határidő utolsó napja">
                <Input
                  type="date"
                  value={input.deadlineDate ?? ""}
                  onChange={(event) => update("deadlineDate", event.target.value)}
                />
              </Field>
              <Field label="Benyújtás helye / címzettje">
                <Input
                  value={input.submissionPlace ?? ""}
                  onChange={(event) => update("submissionPlace", event.target.value)}
                  placeholder="pl. föld fekvése szerint illetékes jegyző"
                />
              </Field>
            </div>
            <Field label="Szerződés / hirdetmény tárgya" className="mt-4">
              <Textarea
                value={input.contractSubject ?? ""}
                onChange={(event) => update("contractSubject", event.target.value)}
                placeholder="Település, helyrajzi szám, haszonbérleti szerződés rövid azonosítása"
              />
            </Field>
          </Card>

          <Card className="border-df-border bg-df-card p-5 shadow-sm">
            <h2 className="font-brand text-2xl font-bold text-df-green">2. Nyilatkozattevő</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Név / megnevezés">
                <Input
                  value={input.claimantName ?? ""}
                  onChange={(event) => update("claimantName", event.target.value)}
                />
              </Field>
              <Field label="Lakcím / székhely">
                <Input
                  value={input.claimantAddress ?? ""}
                  onChange={(event) => update("claimantAddress", event.target.value)}
                />
              </Field>
              <Field label="Születési hely">
                <Input
                  value={input.claimantBirthPlace ?? ""}
                  onChange={(event) => update("claimantBirthPlace", event.target.value)}
                />
              </Field>
              <Field label="Születési idő">
                <Input
                  type="date"
                  value={input.claimantBirthDate ?? ""}
                  onChange={(event) => update("claimantBirthDate", event.target.value)}
                />
              </Field>
              <Field label="Anyja neve">
                <Input
                  value={input.claimantMotherName ?? ""}
                  onChange={(event) => update("claimantMotherName", event.target.value)}
                />
              </Field>
              <Field label="Adóazonosító / adószám">
                <Input
                  value={input.claimantTaxId ?? ""}
                  onChange={(event) => update("claimantTaxId", event.target.value)}
                />
              </Field>
            </div>
          </Card>

          <Card className="border-df-border bg-df-card p-5 shadow-sm">
            <h2 className="font-brand text-2xl font-bold text-df-green">
              3. Jogalap és igazolások
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Megjelölt jogalap">
                <Input
                  value={input.rankBasis ?? ""}
                  onChange={(event) => update("rankBasis", event.target.value)}
                  placeholder="pl. helyben lakó szomszéd"
                />
              </Field>
              <Field label="Törvény szerinti ranghely">
                <Input
                  value={input.rankOrder ?? ""}
                  onChange={(event) => update("rankOrder", event.target.value)}
                  placeholder="pl. Földforgalmi tv. 46. § szerinti sorrend"
                />
              </Field>
            </div>
            <Field label="Törvényi hivatkozás" className="mt-4">
              <Input
                value={input.rankLegalRef ?? ""}
                onChange={(event) => update("rankLegalRef", event.target.value)}
                placeholder="pl. Földforgalmi tv. 46. § ..."
              />
            </Field>
            <Field label="Csatolt igazolások, soronként egy" className="mt-4">
              <Textarea
                value={(input.attachedProofs ?? []).join("\n")}
                onChange={(event) =>
                  update(
                    "attachedProofs",
                    event.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean),
                  )
                }
                placeholder={
                  "Földműves nyilvántartási igazolás\nLakcímigazolás\nFöldhasználati lap"
                }
              />
            </Field>
          </Card>

          <Card className="border-df-border bg-df-card p-5 shadow-sm">
            <h2 className="font-brand text-2xl font-bold text-df-green">4. Keltezés és tanúk</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Benyújtás napja">
                <Input
                  type="date"
                  value={input.submittedAt ?? ""}
                  onChange={(event) => update("submittedAt", event.target.value)}
                />
              </Field>
              <Field label="Keltezés helye">
                <Input
                  value={input.signaturePlace ?? ""}
                  onChange={(event) => update("signaturePlace", event.target.value)}
                />
              </Field>
              <Field label="Keltezés napja">
                <Input
                  type="date"
                  value={input.signatureDate ?? ""}
                  onChange={(event) => update("signatureDate", event.target.value)}
                />
              </Field>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="1. tanú neve">
                <Input
                  value={input.witnesses?.[0]?.name ?? ""}
                  onChange={(event) => updateWitness(0, "name", event.target.value)}
                />
              </Field>
              <Field label="1. tanú lakcíme">
                <Input
                  value={input.witnesses?.[0]?.address ?? ""}
                  onChange={(event) => updateWitness(0, "address", event.target.value)}
                />
              </Field>
              <Field label="2. tanú neve">
                <Input
                  value={input.witnesses?.[1]?.name ?? ""}
                  onChange={(event) => updateWitness(1, "name", event.target.value)}
                />
              </Field>
              <Field label="2. tanú lakcíme">
                <Input
                  value={input.witnesses?.[1]?.address ?? ""}
                  onChange={(event) => updateWitness(1, "address", event.target.value)}
                />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden border-df-border bg-df-card shadow-[0_18px_45px_rgba(26,26,26,0.10)]">
            <div className="df-dark-card p-5 text-df-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-df-yellow">
                    Dokumentum előnézet
                  </div>
                  <h2 className="mt-2 font-brand text-2xl font-bold">Nyilatkozat előnézet</h2>
                  <p className="mt-1 text-sm text-df-cream">Élőben frissül az adatok alapján.</p>
                </div>
                <Button
                  onClick={copyDocument}
                  className="gap-2 bg-df-card text-df-green hover:bg-df-cream"
                >
                  <ClipboardCopy className="h-4 w-4" />
                  Szöveg másolása
                </Button>
              </div>
            </div>
            <div className="p-5">
              {composition.warnings.length > 0 && (
                <div className="mt-4 rounded-md border border-df-yellow/60 bg-df-yellow/10 p-4">
                  <div className="font-medium text-df-ink">Még ellenőrizd</div>
                  <ul className="mt-2 space-y-1 text-sm text-df-gray">
                    {composition.warnings.map((warning) => (
                      <li key={warning}>- {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              <pre className="mt-4 max-h-[720px] overflow-auto whitespace-pre-wrap rounded-md border border-df-border bg-white p-4 text-sm leading-6 text-df-ink">
                {documentText}
              </pre>
            </div>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/gi, "-");
  return (
    <div
      className={`[&_input]:border-df-border [&_input]:bg-white [&_input]:text-df-ink [&_input]:focus-visible:ring-df-green/40 [&_textarea]:border-df-border [&_textarea]:bg-white [&_textarea]:text-df-ink [&_textarea]:focus-visible:ring-df-green/40 ${
        className ?? ""
      }`}
    >
      <Label htmlFor={id} className="mb-2 block text-sm font-semibold text-df-ink">
        {label}
      </Label>
      {children}
    </div>
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function stringSearch(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readRankSnapshotPrefill(): Partial<AcceptanceInput> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem("rank_calculation_snapshot");
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const rank = objectOrNull(parsed.userStrongestRank);
    const proofs = Array.isArray(parsed.requiredProofs)
      ? parsed.requiredProofs
          .map((item) => objectOrNull(item)?.label)
          .filter((label): label is string => typeof label === "string" && label.trim().length > 0)
      : [];
    const rankGroup = typeof rank?.group === "number" ? `${rank.group}. ranghely` : undefined;
    return {
      rankBasis: stringSearch(rank?.humanName),
      rankOrder: rankGroup,
      rankLegalRef: stringSearch(rank?.legalRef),
      attachedProofs: proofs.length ? proofs : undefined,
    };
  } catch {
    return {};
  }
}

function objectOrNull(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function renderComposition(composition: ReturnType<typeof composeAcceptanceStatement>): string {
  return [
    composition.title,
    `Verzió: ${composition.version}`,
    "",
    ...composition.sections.flatMap((section) => [section.title, section.text, ""]),
  ].join("\n");
}
