import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FileSearch, MapPinned, Scale, ShieldCheck } from "lucide-react";
import { company } from "@/lib/company";

export const Route = createFileRoute("/fold-adas-vetel")({
  head: () => ({
    meta: [
      { title: "Föld adás-vétel | Dr Föld" },
      {
        name: "description",
        content:
          "A Dr Föld adásvételi modulja előkészítés alatt áll. Addig nézd meg a kifüggesztéseket, ranghelyet és földár iránytűt.",
      },
      { property: "og:title", content: "Föld adás-vétel | Dr Föld" },
      {
        property: "og:description",
        content:
          "Termőföld adásvételi ügyekhez készülő Dr Föld modul, földár iránytűvel és kifüggesztés figyeléssel.",
      },
    ],
    links: [{ rel: "canonical", href: `${company.websiteUrl}/fold-adas-vetel` }],
  }),
  component: LandSalePage,
});

function LandSalePage() {
  return (
    <PageShell>
      <section className="bg-df-cream">
        <div className="container mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-[1fr,380px] lg:items-center">
          <div>
            <Badge className="border-df-yellow bg-df-yellow/15 text-df-green" variant="outline">
              Előkészítés alatt
            </Badge>
            <h1 className="mt-4 font-brand text-4xl font-bold leading-tight text-df-green md:text-6xl">
              Föld adás-vétel, adatokkal megtámasztva.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-df-gray md:text-lg">
              Az adásvételi modul készül. Addig is a Dr Föld segít átlátni a friss adásvételi
              kifüggesztéseket, a megyei földárakat és az elővásárlási ranghely első jeleit.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="bg-df-green text-white hover:bg-[#173B2A]">
                <Link to="/berleti-dij-iranytu">
                  Földár iránytű megnyitása <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-df-green text-df-green">
                <Link to="/kifuggesztesek">Adásvételi kifüggesztések keresése</Link>
              </Button>
            </div>
          </div>

          <Card className="border-df-border bg-df-card p-6 shadow-[0_18px_45px_rgba(26,26,26,0.10)]">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-df-yellow">
              Mit tudsz már most nézni?
            </div>
            <div className="mt-5 space-y-4">
              <SupportRow
                icon={<MapPinned className="h-5 w-5" />}
                title="Megyei földár irány"
                text="Az Ár iránytű külön földár nézetben mutatja a kinyert adásvételi árpontokat."
              />
              <SupportRow
                icon={<FileSearch className="h-5 w-5" />}
                title="Nyilvános kifüggesztések"
                text="Településre, helyrajzi számra és hirdetménytípusra is kereshetsz."
              />
              <SupportRow
                icon={<Scale className="h-5 w-5" />}
                title="Ranghely szemlélet"
                text="Ha előrébb állhatsz, ne maradj hátul: a lépés előtt nézd meg, mire hivatkozhatsz."
              />
            </div>
          </Card>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard
            title="Kifüggesztést láttál?"
            text="Nyisd meg a hirdetményt, nézd meg a csatolmányokat, és ellenőrizd, van-e benne lehetőség."
            to="/kifuggesztesek"
            cta="Keresek kifüggesztést"
          />
          <InfoCard
            title="Árra vagy kíváncsi?"
            text="A földár iránytű megyei szinten, trimmelt átlaggal segít kiszűrni a kilógó értékeket."
            to="/berleti-dij-iranytu"
            cta="Földárakat nézek"
          />
          <InfoCard
            title="Jogalapot néznél?"
            text="A haszonbérleti ranghely kalkulátor már működik; az adásvételi logika ehhez hasonlóan készül."
            to="/ranghely-kalkulator"
            cta="Ranghely szemlélet"
          />
        </div>

        <Card className="mt-6 border-df-red/30 bg-df-red/10 p-4">
          <div className="flex gap-3 text-sm text-df-ink">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-df-red" />
            <p>
              A Dr Föld dokumentumgeneráló és döntéstámogató szolgáltatás, nem ügyvédi iroda.
              Egyedi, vitás vagy nagy értékű adásvételi ügyben ügyvédi ellenőrzés javasolt.
            </p>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}

function SupportRow({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-df-green">{icon}</div>
      <div>
        <div className="font-semibold text-df-ink">{title}</div>
        <p className="mt-1 text-sm leading-6 text-df-gray">{text}</p>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  text,
  to,
  cta,
}: {
  title: string;
  text: string;
  to: "/kifuggesztesek" | "/berleti-dij-iranytu" | "/ranghely-kalkulator";
  cta: string;
}) {
  return (
    <Card className="border-df-border bg-df-card p-5">
      <h2 className="font-brand text-xl font-bold text-df-green">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-df-gray">{text}</p>
      <Button asChild variant="ghost" className="mt-4 px-0 text-df-green hover:bg-transparent">
        <Link to={to}>
          {cta} <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </Card>
  );
}
