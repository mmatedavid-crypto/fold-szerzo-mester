import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Landmark, ArrowRight } from "lucide-react";

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
  }),
  component: LandSalePage,
});

function LandSalePage() {
  return (
    <PageShell>
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="flex items-center gap-3">
          <Landmark className="h-8 w-8 text-primary" />
          <h1 className="font-serif text-3xl md:text-4xl">Föld adás-vétel</h1>
        </div>
        <p className="mt-4 text-muted-foreground">
          A termőföld adásvételi modul előkészítés alatt áll. Itt fogod tudni majd átlátni az
          adásvételi kifüggesztéseket, az elővásárlási ranghelyet és a szükséges dokumentumokat.
        </p>
        <Card className="p-6 mt-8">
          <div className="font-medium">Addig is: nézd az adatokat, ne találgass.</div>
          <p className="text-sm text-muted-foreground mt-2">
            Az Ár iránytűben már külön választható a földár nézet, a kifüggesztésekben pedig az
            adásvételi hirdetmények is szűrhetők.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/berleti-dij-iranytu">
                Földár iránytű <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/kifuggesztesek">Kifüggesztések keresése</Link>
            </Button>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
