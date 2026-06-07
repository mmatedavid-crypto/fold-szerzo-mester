import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { listPlans } from "@/lib/plans.functions";
import { ShieldCheck, MapPinned, FileCheck2, TrendingUp, FileBadge2, Sprout } from "lucide-react";

const plansQuery = queryOptions({ queryKey: ["plans"], queryFn: () => listPlans() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Földbérleti Szerződés Generátor — gazdáknak, gyorsan és átláthatóan" },
      { name: "description", content: "Készíts termőföld-haszonbérleti szerződést pár lépésben, jogszabálykövető sablonok alapján." },
      { property: "og:title", content: "Földbérleti Szerződés Generátor" },
      { property: "og:description", content: "Termőföld-haszonbérleti szerződés gazdáknak, gyorsan és átláthatóan." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(plansQuery),
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Hiba: {error.message}</div>
  ),
  component: Index,
});

function Index() {
  const { data: plans } = useSuspenseQuery(plansQuery);

  const benefits = [
    { icon: FileCheck2, title: "Nem üres sablon", text: "Kérdések alapján összeállított szerződés, nem letölthető Word-doksi." },
    { icon: ShieldCheck, title: "Előhaszonbérleti logika", text: "Vezetett kérdőív és kockázati figyelmeztetések." },
    { icon: MapPinned, title: "Jegyzői közzétételi lista", text: "Beadási ellenőrzőlista és kötelező mellékletek." },
    { icon: TrendingUp, title: "Hirdetményi árfigyelő", text: "Piaci bérleti díj-iránytű települési szinten." },
    { icon: FileBadge2, title: "Verziózott klauzulák", text: "Dokumentumazonosító, sablonverzió, ellenőrizhető hash." },
  ];

  return (
    <PageShell>
      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/40 px-3 py-1 text-xs text-accent-foreground">
            <Sprout className="h-3.5 w-3.5" /> Gazdáknak, földtulajdonosoknak, őstermelőknek
          </div>
          <h1 className="font-serif text-4xl md:text-5xl mt-4 leading-tight">
            Termőföld-haszonbérleti szerződés gazdáknak, gyorsan és átláthatóan
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Add meg a föld, a felek, a bérleti díj és az előhaszonbérleti jog adatait, mi pedig
            elkészítjük a szerződés-előkészítő csomagot.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/szerzodes/uj">Szerződés készítése</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/kifuggesztesek">Kifüggesztések keresése</Link></Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground max-w-xl">
            A szerződésminták jogi szakértő által karbantartott, verziózott klauzulatár alapján
            készülnek. A generált dokumentum szerződés-előkészítő irat. Egyedi, vitás vagy nagy
            értékű ügyben ügyvédi ellenőrzés javasolt.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-12 border-t border-border">
        <h2 className="font-serif text-2xl md:text-3xl">Miért minket válassz?</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {benefits.map((b) => (
            <Card key={b.title} className="p-5">
              <b.icon className="h-6 w-6 text-primary" />
              <div className="font-medium mt-3">{b.title}</div>
              <p className="text-sm text-muted-foreground mt-1">{b.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="arak" className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl">Egyszerű, átlátható árazás</h2>
          <p className="mt-3 text-muted-foreground">
            Válassz egyszeri szerződést vagy előfizetést. Az árak bruttó értékek.
          </p>
        </div>
        <div className="mt-10">
          <PricingCards plans={plans} />
        </div>
      </section>
    </PageShell>
  );
}
