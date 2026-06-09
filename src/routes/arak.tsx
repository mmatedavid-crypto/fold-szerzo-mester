import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listPlans } from "@/lib/plans.functions";
import { company } from "@/lib/company";
import { CheckCircle2 } from "lucide-react";

const plansQuery = queryOptions({ queryKey: ["plans"], queryFn: () => listPlans() });

export const Route = createFileRoute("/arak")({
  head: () => ({
    meta: [
      { title: "Árak és csomagok | Dr Föld" },
      {
        name: "description",
        content: "Egy szerződés 9 900 Ft-tól, vagy havi előfizetés gazdaságoknak.",
      },
      { property: "og:title", content: "Árak és csomagok | Dr Föld" },
      {
        property: "og:description",
        content: "Egyszeri szerződés vagy havi előfizetés gazdaságoknak.",
      },
    ],
    links: [{ rel: "canonical", href: `${company.websiteUrl}/arak` }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(plansQuery),
  errorComponent: PricingError,
  notFoundComponent: PricingNotFound,
  component: ArakPage,
});

function ArakPage() {
  const { data: plans } = useSuspenseQuery(plansQuery);
  return (
    <PageShell>
      <section className="container mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="border-df-yellow bg-df-yellow/15 text-df-green" variant="outline">
            Árak és csomagok
          </Badge>
          <h1 className="mt-4 font-brand text-4xl font-bold leading-tight text-df-green md:text-6xl">
            Földügyi dokumentum, rendezett áron.
          </h1>
          <p className="mt-4 text-base leading-7 text-df-gray md:text-lg">
            Válassz egyszeri szerződés-előkészítést vagy éves keretet. Az árak bruttó értékek, a
            végleges PDF dokumentum fizetés vagy elérhető előfizetési keret után érhető el.
          </p>
        </div>

        <div className="mt-10">
          <PricingCards plans={plans} />
        </div>

        <div className="mt-8 grid gap-3 text-sm text-df-gray md:grid-cols-3">
          <TrustItem text="A szerződés a megadott felekhez és helyrajzi számokhoz kötött." />
          <TrustItem text="Fizetés előtt az aktuális díjat és keretet külön megerősítjük." />
          <TrustItem text="Egyedi, vitás vagy nagy értékű ügyben ügyvédi ellenőrzés javasolt." />
        </div>
      </section>
    </PageShell>
  );
}

function PricingError() {
  return (
    <PageShell>
      <section className="container mx-auto max-w-2xl px-4 py-16">
        <Card className="border-df-border bg-df-card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-df-red">
            Árak betöltése
          </p>
          <h1 className="mt-3 font-brand text-3xl font-bold text-df-green">
            Most nem látjuk biztosan az árlistát.
          </h1>
          <p className="mt-3 text-df-gray">
            A szerződés-előkészítés és a ranghely ellenőrzése ettől még elindítható. Az aktuális
            díjat fizetés előtt mindig külön megerősítjük.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="bg-df-green text-white hover:bg-[#173B2A]">
              <Link to="/foldberleti-szerzodes">Bérleti szerződés indítása</Link>
            </Button>
            <Button asChild variant="outline" className="border-df-green text-df-green">
              <Link to="/">Vissza a főoldalra</Link>
            </Button>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}

function TrustItem({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-df-border bg-df-card p-3">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-df-green" />
      <span>{text}</span>
    </div>
  );
}

function PricingNotFound() {
  return (
    <PageShell>
      <section className="container mx-auto max-w-2xl px-4 py-16">
        <Card className="border-df-border bg-df-card p-6">
          <h1 className="font-brand text-3xl font-bold text-df-green">
            Ez az árlista nem található.
          </h1>
          <p className="mt-3 text-df-gray">
            Nézd meg a Dr Föld fő szolgáltatásait, vagy indítsd el közvetlenül a földbérleti
            szerződés előkészítését.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="bg-df-green text-white hover:bg-[#173B2A]">
              <Link to="/">Dr Föld szolgáltatások</Link>
            </Button>
            <Button asChild variant="outline" className="border-df-green text-df-green">
              <Link to="/foldberleti-szerzodes">Szerződés indítása</Link>
            </Button>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
