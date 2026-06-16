import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { company } from "@/lib/company";
import { submitLandSaleIntake } from "@/lib/land-sale/intake.functions";

export const Route = createFileRoute("/fold-adas-vetel")({
  head: () => ({
    meta: [
      { title: "Föld adás-vétel adatfelvétel | Dr Föld" },
      {
        name: "description",
        content:
          "Töltsd ki a földadásvételi adatfelvételi űrlapot, és a Dr Föld saját ügyvédje veszi fel veled a kapcsolatot a szerződés előkészítéséhez.",
      },
      { property: "og:title", content: "Föld adás-vétel adatfelvétel | Dr Föld" },
      {
        property: "og:description",
        content:
          "Adatfelvételi űrlap földadásvételi ügyletekhez: a Dr Föld saját ügyvédje készíti elő a szerződést.",
      },
    ],
    links: [{ rel: "canonical", href: `${company.websiteUrl}/fold-adas-vetel` }],
  }),
  component: LandSalePage,
});

type RoleInDeal = "seller" | "buyer" | "both" | "other";

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  roleInDeal: RoleInDeal | "";
  settlement: string;
  parcelNumbers: string;
  areaHa: string;
  cultivationBranch: string;
  priceHuf: string;
  counterpartyName: string;
  counterpartyContact: string;
  preferredContact: string;
  notes: string;
  consent: boolean;
}

const EMPTY: FormState = {
  fullName: "",
  email: "",
  phone: "",
  roleInDeal: "",
  settlement: "",
  parcelNumbers: "",
  areaHa: "",
  cultivationBranch: "",
  priceHuf: "",
  counterpartyName: "",
  counterpartyContact: "",
  preferredContact: "",
  notes: "",
  consent: false,
};

function LandSalePage() {
  const submitFn = useServerFn(submitLandSaleIntake);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consent) {
      toast.error("Kérjük, fogadd el az adatkezelési tájékoztatót.");
      return;
    }
    if (!form.roleInDeal) {
      toast.error("Válaszd ki, milyen szerepben veszel részt az ügyletben.");
      return;
    }
    setSubmitting(true);
    try {
      const parseNum = (s: string): number | "" => {
        const n = Number(s.replace(/[\s\u00A0]/g, "").replace(",", "."));
        return Number.isFinite(n) && n > 0 ? n : "";
      };
      await submitFn({
        data: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || undefined,
          roleInDeal: form.roleInDeal,
          settlement: form.settlement || undefined,
          parcelNumbers: form.parcelNumbers || undefined,
          areaHa: parseNum(form.areaHa),
          cultivationBranch: form.cultivationBranch || undefined,
          priceHuf: parseNum(form.priceHuf),
          counterpartyName: form.counterpartyName || undefined,
          counterpartyContact: form.counterpartyContact || undefined,
          preferredContact: form.preferredContact || undefined,
          notes: form.notes || undefined,
        },
      });
      setDone(true);
      toast.success("Megkaptuk! Az ügyvéd hamarosan keres.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ismeretlen hiba";
      toast.error(`Nem sikerült beküldeni: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <section className="bg-df-cream">
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <Badge className="border-df-green bg-df-green/10 text-df-green" variant="outline">
            Ügyvédi szerződéskészítés
          </Badge>
          <h1 className="mt-4 font-brand text-4xl font-bold leading-tight text-df-green md:text-5xl">
            Föld adás-vétel — adatfelvétel
          </h1>
          <p className="mt-4 text-base leading-7 text-df-ink">
            Töltsd ki az alábbi űrlapot, és a Dr Föld saját ügyvédje, {company.lawyerName} veszi
            fel veled a kapcsolatot, hogy elkészítse az adásvételi szerződést. Az adatok közvetlenül
            az ügyvédhez jutnak el, harmadik félnek nem adjuk át.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-3xl px-4 pb-16">
        {done ? (
          <Card className="border-df-green/40 bg-df-card p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-df-green" />
            <h2 className="mt-3 font-brand text-2xl font-bold text-df-green">
              Köszönjük, megkaptuk a megkeresést!
            </h2>
            <p className="mt-2 text-sm leading-6 text-df-gray">
              {company.lawyerName} hamarosan keres a megadott elérhetőségen az adásvételi szerződés
              előkészítéséhez.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-6 border-df-green text-df-green"
              onClick={() => {
                setForm(EMPTY);
                setDone(false);
              }}
            >
              Új megkeresés indítása
            </Button>
          </Card>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <Card className="border-df-border bg-df-card p-6">
              <SectionTitle>Megbízó adatai</SectionTitle>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Teljes név *" htmlFor="fullName">
                  <Input
                    id="fullName"
                    required
                    maxLength={120}
                    value={form.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                  />
                </Field>
                <Field label="E-mail *" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    required
                    maxLength={255}
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </Field>
                <Field label="Telefonszám" htmlFor="phone">
                  <Input
                    id="phone"
                    type="tel"
                    maxLength={60}
                    placeholder="+36 30 123 4567"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </Field>
                <Field label="Szerepkör az ügyletben *" htmlFor="role">
                  <Select
                    value={form.roleInDeal}
                    onValueChange={(v) => update("roleInDeal", v as RoleInDeal)}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Válassz…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seller">Eladó</SelectItem>
                      <SelectItem value="buyer">Vevő</SelectItem>
                      <SelectItem value="both">Mindkettő (közvetítés)</SelectItem>
                      <SelectItem value="other">Egyéb</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field
                  label="Preferált elérhetőség / időpont"
                  htmlFor="preferredContact"
                  className="md:col-span-2"
                >
                  <Input
                    id="preferredContact"
                    maxLength={255}
                    placeholder="pl. délelőtt telefonon, vagy e-mailben"
                    value={form.preferredContact}
                    onChange={(e) => update("preferredContact", e.target.value)}
                  />
                </Field>
              </div>
            </Card>

            <Card className="border-df-border bg-df-card p-6">
              <SectionTitle>Ingatlan adatok</SectionTitle>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Település" htmlFor="settlement">
                  <Input
                    id="settlement"
                    maxLength={120}
                    value={form.settlement}
                    onChange={(e) => update("settlement", e.target.value)}
                  />
                </Field>
                <Field label="Helyrajzi szám(ok)" htmlFor="parcels">
                  <Input
                    id="parcels"
                    maxLength={500}
                    placeholder="pl. 0123/4, 0123/5"
                    value={form.parcelNumbers}
                    onChange={(e) => update("parcelNumbers", e.target.value)}
                  />
                </Field>
                <Field label="Terület (ha)" htmlFor="area">
                  <Input
                    id="area"
                    inputMode="decimal"
                    placeholder="pl. 4,5"
                    value={form.areaHa}
                    onChange={(e) => update("areaHa", e.target.value)}
                  />
                </Field>
                <Field label="Művelési ág" htmlFor="branch">
                  <Input
                    id="branch"
                    maxLength={120}
                    placeholder="pl. szántó, gyep, szőlő"
                    value={form.cultivationBranch}
                    onChange={(e) => update("cultivationBranch", e.target.value)}
                  />
                </Field>
                <Field label="Vételár (Ft)" htmlFor="price" className="md:col-span-2">
                  <Input
                    id="price"
                    inputMode="numeric"
                    placeholder="pl. 12 500 000"
                    value={form.priceHuf}
                    onChange={(e) => update("priceHuf", e.target.value)}
                  />
                </Field>
              </div>
            </Card>

            <Card className="border-df-border bg-df-card p-6">
              <SectionTitle>Másik fél (ha ismert)</SectionTitle>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Név" htmlFor="cpName">
                  <Input
                    id="cpName"
                    maxLength={120}
                    value={form.counterpartyName}
                    onChange={(e) => update("counterpartyName", e.target.value)}
                  />
                </Field>
                <Field label="Elérhetőség (telefon / e-mail)" htmlFor="cpContact">
                  <Input
                    id="cpContact"
                    maxLength={255}
                    value={form.counterpartyContact}
                    onChange={(e) => update("counterpartyContact", e.target.value)}
                  />
                </Field>
              </div>
            </Card>

            <Card className="border-df-border bg-df-card p-6">
              <SectionTitle>Egyéb információ</SectionTitle>
              <div className="mt-4">
                <Label htmlFor="notes" className="text-sm font-semibold text-df-ink">
                  Minden, ami az ügyvédnek hasznos lehet
                </Label>
                <Textarea
                  id="notes"
                  className="mt-2 min-h-[120px]"
                  maxLength={3000}
                  placeholder="pl. határidők, elővásárlási helyzet, terhek, korábbi szerződések…"
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                />
              </div>
            </Card>

            <Card className="border-df-border bg-df-card p-6">
              <label className="flex items-start gap-3 text-sm text-df-ink">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-df-green"
                  checked={form.consent}
                  onChange={(e) => update("consent", e.target.checked)}
                />
                <span>
                  Hozzájárulok, hogy a megadott adataimat a {company.brandName} továbbítsa
                  {" "}
                  {company.lawyerName} ügyvédnek az adásvételi szerződés előkészítése céljából.
                  Az adatkezelés részletei az adatkezelési tájékoztatóban olvashatók.
                </span>
              </label>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-df-gray">
                  <ShieldCheck className="h-4 w-4 text-df-green" />
                  Az adataidat nem adjuk át harmadik félnek.
                </div>
                <Button
                  type="submit"
                  className="bg-df-green text-white hover:bg-[#173B2A]"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Beküldés…
                    </>
                  ) : (
                    "Megkeresés beküldése"
                  )}
                </Button>
              </div>
            </Card>
          </form>
        )}
      </section>
    </PageShell>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-brand text-xl font-bold text-df-green">{children}</h2>
  );
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="text-sm font-semibold text-df-ink">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
