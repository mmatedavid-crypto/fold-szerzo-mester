import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/berleti-dij-iranytu")({
  head: () => ({
    meta: [
      { title: "Bérleti díj iránytű — Földbérleti Szerződés Generátor" },
      { name: "description", content: "Átlagos hirdetményi haszonbérleti díjak településenként és vármegyénként." },
    ],
  }),
  component: () => (
    <PageShell>
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-serif text-3xl">Bérleti díj iránytű</h1>
        <p className="mt-3 text-muted-foreground">
          Az adatok nyilvános hirdetményekből származó tájékoztató jellegű értékek.
          A funkció hamarosan elérhető a hirdetmény-integrációval együtt.
        </p>
        <Card className="p-6 mt-6 text-sm">
          <p>Az egyes földek minősége, AK értéke, fekvése, öntözhetősége és művelési ága jelentősen befolyásolhatja a bérleti díjat.</p>
          <div className="mt-4">
            <Button asChild><Link to="/szerzodes/uj">Szerződés készítése</Link></Button>
          </div>
        </Card>
      </section>
    </PageShell>
  ),
});