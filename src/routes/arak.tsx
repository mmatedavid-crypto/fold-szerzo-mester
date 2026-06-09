import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { listPlans } from "@/lib/plans.functions";

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
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(plansQuery),
  errorComponent: ({ error }) => <div className="p-8 text-destructive">Hiba: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Az oldal nem található.</div>,
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
