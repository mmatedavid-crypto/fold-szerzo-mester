import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  composeAcceptanceStatement,
  type AcceptanceInput,
} from "@/lib/contracts/acceptance.compose";
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
  }),
  component: AcceptancePage,
});

function AcceptancePage() {
  const [input, setInput] = useState<AcceptanceInput>({
    submittedAt: today(),
    signatureDate: today(),
    witnesses: [{}, {}],
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
      <section className="container mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.95fr,1.05fr]">
          <div>
            <Badge className="border-df-yellow bg-df-yellow/15 text-df-green" variant="outline">
              Nem trükk. Ranghely.
            </Badge>
            <div className="mt-4 flex items-center gap-3">
              <FileSignature className="h-8 w-8 text-primary" />
              <h1 className="font-serif text-3xl md:text-5xl">Elfogadó nyilatkozat előkészítése</h1>
            </div>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              Ha már tudod, melyik kifüggesztésre akarsz belépni, itt közvetlenül is elindíthatod.
              Add meg a konkrét hirdetményt, a jogalapodat, a törvény szerinti ranghelyedet és az
              igazolásokat.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button asChild variant="outline" className="justify-start">
                <Link to="/kifuggesztesek">
                  <Search className="h-4 w-4" /> Kifüggesztést keresek
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/ranghely-kalkulator">
                  <Sparkles className="h-4 w-4" /> Ranghelyet ellenőrzök
                </Link>
              </Button>
            </div>

            <Card className="mt-6 border-destructive/30 bg-destructive/5 p-5">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
                <p className="text-sm text-muted-foreground">
                  A Dr Föld dokumentumgeneráló és döntéstámogató szolgáltatás, nem ügyvédi iroda.
                  Egyedi, vitás vagy nagy értékű ügyben ügyvédi ellenőrzés javasolt.
                </p>
              </div>
            </Card>
          </div>

          <Card className="border-primary/20 bg-primary p-6 text-primary-foreground">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-5 w-5" />
              Akkor indulj innen, ha ezek megvannak
            </div>
            <ul className="mt-4 grid gap-2 text-sm text-primary-foreground/90 sm:grid-cols-2">
              <li>Kifüggesztett szerződés azonosítója</li>
              <li>15 napos jogvesztő határidő</li>
              <li>Jogalap és törvény szerinti ranghely</li>
              <li>Igazoló okiratok listája</li>
              <li>Benyújtás helye és időpontja</li>
              <li>Aláírás, tanúk vagy hiteles forma</li>
            </ul>
          </Card>
        </div>
      </section>

      <section className="container mx-auto grid max-w-7xl gap-6 px-4 pb-12 lg:grid-cols-[0.95fr,1.05fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-serif text-2xl">1. Kifüggesztés</h2>
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

          <Card className="p-5">
            <h2 className="font-serif text-2xl">2. Nyilatkozattevő</h2>
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

          <Card className="p-5">
            <h2 className="font-serif text-2xl">3. Jogalap és igazolások</h2>
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

          <Card className="p-5">
            <h2 className="font-serif text-2xl">4. Keltezés és tanúk</h2>
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
          <Card className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-serif text-2xl">Nyilatkozat előnézet</h2>
                <p className="text-sm text-muted-foreground">Élőben frissül az adatok alapján.</p>
              </div>
              <Button onClick={copyDocument} className="gap-2">
                <ClipboardCopy className="h-4 w-4" />
                Szöveg másolása
              </Button>
            </div>
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
            <pre className="mt-4 max-h-[720px] overflow-auto whitespace-pre-wrap rounded-md border bg-df-card p-4 text-sm leading-6 text-df-ink">
              {documentText}
            </pre>
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
    <div className={className}>
      <Label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function renderComposition(composition: ReturnType<typeof composeAcceptanceStatement>): string {
  return [
    composition.title,
    `Verzió: ${composition.version}`,
    "",
    ...composition.sections.flatMap((section) => [section.title, section.text, ""]),
  ].join("\n");
}
