import { useEffect, useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { HuDatePicker } from "@/components/ui/hu-date-picker";
import { SettlementCombobox, zipsForSettlement } from "@/components/ui/settlement-combobox";
import {
  RANK_OPTIONS,
  proofsForRanks,
  strongestRankSummary,
} from "@/lib/rank/proofsFromRanks";
import type { RankId } from "@/lib/rank/leaseRankDefinitions";

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

  const [selectedRanks, setSelectedRanks] = useState<RankId[]>([]);

  // Lakcím komponensek külön (egyesítve mennek a claimantAddress-be)
  const [addrSettlement, setAddrSettlement] = useState<string>("");
  const [addrZip, setAddrZip] = useState<string>("");
  const [addrStreet, setAddrStreet] = useState<string>("");

  // Település választáskor automatikusan ajánljunk irányítószámot
  function handleAddrSettlement(name: string) {
    setAddrSettlement(name);
    const zips = zipsForSettlement(name);
    if (zips.length && !addrZip) setAddrZip(zips[0]);
  }

  // Lakcím komponensek → claimantAddress szinkronban
  useEffect(() => {
    const parts: string[] = [];
    if (addrZip) parts.push(addrZip);
    if (addrSettlement) parts.push(addrSettlement);
    const first = parts.join(" ");
    const combined = [first, addrStreet].filter((s) => s.trim()).join(", ");
    setInput((current) =>
      current.claimantAddress === combined ? current : { ...current, claimantAddress: combined },
    );
  }, [addrSettlement, addrZip, addrStreet]);

  // Jogalapok kiválasztva → derived mezők
  const proofs = useMemo(() => proofsForRanks(selectedRanks), [selectedRanks]);
  const strongest = useMemo(() => strongestRankSummary(selectedRanks), [selectedRanks]);

  useEffect(() => {
    const opts = RANK_OPTIONS.filter((o) => selectedRanks.includes(o.id));
    const rankBasis = opts.map((o) => o.label).join("; ") || undefined;
    const rankLegalRef = opts.map((o) => o.legalRef).join("; ") || undefined;
    const rankOrder = strongest ? strongest.label : undefined;
    const attachedProofs = proofs.map((p) => p.label);
    setInput((current) => ({
      ...current,
      rankBasis,
      rankLegalRef,
      rankOrder,
      attachedProofs: attachedProofs.length ? attachedProofs : current.attachedProofs,
    }));
  }, [selectedRanks, proofs, strongest]);

  function toggleRank(id: RankId) {
    setSelectedRanks((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

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
                <HuDatePicker
                  value={input.noticePublicationDate}
                  onChange={(v) => update("noticePublicationDate", v)}
                />
              </Field>
              <Field label="Jogvesztő határidő utolsó napja">
                <HuDatePicker
                  value={input.deadlineDate}
                  onChange={(v) => update("deadlineDate", v)}
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
                placeholder={
                  "Példa: Gyomaendrőd külterület 0123/4 hrsz., 12,3456 ha szántó, haszonbérleti szerződés Példa János (Gyomaendrőd) és XY Kft. között, 5 éves futamidőre, évi 60.000 Ft/ha bérleti díjjal."
                }
                rows={4}
              />
              <p className="mt-2 text-xs leading-5 text-df-gray">
                Írd le a kifüggesztett szerződést úgy, hogy egyértelműen
                azonosítható legyen: település, helyrajzi szám, terület, művelési
                ág, szerződő felek, futamidő, díj.
              </p>
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
              <Field label="Születési hely">
                <SettlementCombobox
                  value={input.claimantBirthPlace}
                  onChange={(v) => update("claimantBirthPlace", v)}
                />
              </Field>
              <Field label="Születési idő">
                <HuDatePicker
                  value={input.claimantBirthDate}
                  onChange={(v) => update("claimantBirthDate", v)}
                  placeholder="éééé. hh. nn."
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
              <Field label="Születési név (ha eltér)">
                <Input
                  value={input.claimantBirthName ?? ""}
                  onChange={(event) => update("claimantBirthName", event.target.value)}
                  placeholder="csak akkor töltsd ki, ha eltér a mostani nevedtől"
                />
              </Field>
              <Field label="Nyilvántartási szám / cégjegyzékszám">
                <Input
                  value={input.claimantRegistryNumber ?? ""}
                  onChange={(event) => update("claimantRegistryNumber", event.target.value)}
                  placeholder="földműves: nyilvántartási szám · szervezet: cégjegyzékszám"
                />
              </Field>
              <Field label="Képviselő neve és minősége (szervezet esetén)">
                <Input
                  value={input.claimantRepresentative ?? ""}
                  onChange={(event) => update("claimantRepresentative", event.target.value)}
                  placeholder="pl. Kiss János ügyvezető"
                />
              </Field>
            </div>

            <div className="mt-6">
              <Label className="mb-2 block text-sm font-semibold text-df-ink">Lakcím / székhely</Label>
              <div className="grid gap-4 sm:grid-cols-[1fr,140px]">
                <div>
                  <Label className="mb-1 block text-xs text-df-gray">Település</Label>
                  <SettlementCombobox value={addrSettlement} onChange={handleAddrSettlement} />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-df-gray">Irányítószám</Label>
                  <Input
                    value={addrZip}
                    onChange={(e) => setAddrZip(e.target.value)}
                    placeholder="pl. 5500"
                    maxLength={4}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label className="mb-1 block text-xs text-df-gray">Utca, házszám (tanya esetén tanya száma)</Label>
                <Input
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  placeholder="pl. Kossuth utca 12. vagy III. tanya 7."
                />
              </div>
              {input.claimantAddress && (
                <p className="mt-2 text-xs text-df-gray">
                  Teljes cím: <span className="font-medium text-df-ink">{input.claimantAddress}</span>
                </p>
              )}
            </div>
          </Card>

          <Card className="border-df-border bg-df-card p-5 shadow-sm">
            <h2 className="font-brand text-2xl font-bold text-df-green">
              3. Jogalap és igazolások
            </h2>
            <p className="mt-2 text-sm leading-6 text-df-gray">
              Jelöld be a saját jogalapodat — <strong>többet is választhatsz</strong>, ha több
              címen vagy jogosult. A rendszer kiszámolja a törvény szerinti ranghelyedet és
              összeállítja, milyen okiratokat kell csatolnod.
            </p>
            <div className="mt-4 space-y-5">
              {(["non_forest", "forest"] as const).map((branch) => {
                const opts = RANK_OPTIONS.filter((o) => o.branch === branch);
                if (!opts.length) return null;
                return (
                  <div key={branch}>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-df-gray">
                      {branch === "forest" ? "Erdő" : "Nem erdő (szántó, kert, szőlő, gyümölcsös, rét, legelő stb.)"}
                    </div>
                    <div className="grid gap-2">
                      {opts.map((opt) => {
                        const checked = selectedRanks.includes(opt.id);
                        return (
                          <label
                            key={opt.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                              checked
                                ? "border-df-green bg-df-green/5"
                                : "border-df-border bg-white hover:bg-df-cream/50"
                            }`}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleRank(opt.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-df-ink">{opt.label}</span>
                                <span className="rounded bg-df-cream px-1.5 py-0.5 text-[10px] font-bold text-df-green">
                                  {opt.group}. csoport
                                </span>
                              </div>
                              <div className="mt-0.5 text-xs text-df-gray">{opt.legalRef}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedRanks.length > 0 && (
              <div className="mt-5 rounded-md border border-df-green/40 bg-df-green/5 p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-df-green" />
                  <div className="text-sm leading-6 text-df-ink">
                    <div className="font-semibold text-df-green">
                      Törvény szerinti ranghelyed: {strongest?.label ?? "—"}
                    </div>
                    <p className="mt-1 text-df-gray">
                      Ezt automatikusan beillesztjük a nyilatkozatba a jogalap megnevezésével és
                      a hivatkozott jogszabállyal együtt.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {proofs.length > 0 && (
              <div className="mt-4">
                <Label className="mb-2 block text-sm font-semibold text-df-ink">
                  Csatolandó igazolások — ezeket fogja kérni a hatóság
                </Label>
                <ul className="space-y-1.5 rounded-md border border-df-border bg-white p-3">
                  {proofs.map((p) => (
                    <li key={p.id} className="flex items-start gap-2 text-sm text-df-ink">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-df-green" />
                      <span>
                        {p.label}
                        {p.category !== "kotelezo" && (
                          <span className="ml-2 text-[10px] uppercase text-df-gray">
                            {p.category === "jogcim_fuggo" ? "ha alkalmazandó" : "jogi ellenőrzés"}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card className="border-df-border bg-df-card p-5 shadow-sm">
            <h2 className="font-brand text-2xl font-bold text-df-green">4. Keltezés és tanúk</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Benyújtás napja">
                <HuDatePicker
                  value={input.submittedAt}
                  onChange={(v) => update("submittedAt", v)}
                />
              </Field>
              <Field label="Keltezés helye">
                <Input
                  value={input.signaturePlace ?? ""}
                  onChange={(event) => update("signaturePlace", event.target.value)}
                />
              </Field>
              <Field label="Keltezés napja">
                <HuDatePicker
                  value={input.signatureDate}
                  onChange={(v) => update("signatureDate", v)}
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
