import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listPlans } from "@/lib/plans.functions";
import { company } from "@/lib/company";

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
      <section className="container mx-auto px-4 py-16">
        <h1 className="font-serif text-3xl md:text-4xl text-center">Árak és csomagok</h1>
        <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
          Az árak bruttó értékek. A végleges PDF dokumentum csak fizetés vagy elérhető előfizetési
          keret után érhető el. A szerződés a megadott felekhez és helyrajzi számokhoz kötött.
        </p>
        <div className="mt-10">
          <PricingCards plans={plans} />
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
          <h1 className="mt-3 font-serif text-3xl text-df-green">
            Most nem látjuk biztosan az árlistát.
          </h1>
          <p className="mt-3 text-df-gray">
            A szerződés-előkészítés és a ranghely ellenőrzése ettől még elindítható. Az aktuális
            díjat fizetés előtt mindig külön megerősítjük.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link to="/foldberleti-szerzodes">Bérleti szerződés indítása</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Vissza a főoldalra</Link>
            </Button>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}

function PricingNotFound() {
  return (
    <PageShell>
      <section className="container mx-auto max-w-2xl px-4 py-16">
        <Card className="border-df-border bg-df-card p-6">
          <h1 className="font-serif text-3xl text-df-green">Ez az árlista nem található.</h1>
          <p className="mt-3 text-df-gray">
            Nézd meg a Dr Föld fő szolgáltatásait, vagy indítsd el közvetlenül a földbérleti
            szerződés előkészítését.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link to="/">Dr Föld szolgáltatások</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/foldberleti-szerzodes">Szerződés indítása</Link>
            </Button>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
