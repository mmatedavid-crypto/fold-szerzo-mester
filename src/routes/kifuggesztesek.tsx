import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/kifuggesztesek")({
  head: () => ({
    meta: [
      { title: "Kifüggesztés kereső — Földbérleti Szerződés Generátor" },
      { name: "description", content: "Keresd a hirdetmenyek.gov.hu nyilvános földbérleti és adásvételi hirdetményeit településenként." },
    ],
  }),
  component: () => (
    <PageShell>
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-serif text-3xl">Kifüggesztés kereső</h1>
        <p className="mt-3 text-muted-foreground">
          Hamarosan: nyilvános földbérleti és adásvételi hirdetmények keresése településenként,
          közvetlen hivatkozással a hirdetmenyek.gov.hu eredeti oldalára.
        </p>
        <Card className="p-6 mt-6">
          <p className="text-sm">Az integráció a 3. fázisban indul. Addig is használhatod a szerződésgenerátort.</p>
          <div className="mt-4 flex gap-2">
            <Button asChild><Link to="/szerzodes/uj">Szerződés készítése</Link></Button>
            <Button asChild variant="outline"><Link to="/berleti-dij-iranytu">Bérleti díj iránytű</Link></Button>
          </div>
        </Card>
      </section>
    </PageShell>
  ),
});