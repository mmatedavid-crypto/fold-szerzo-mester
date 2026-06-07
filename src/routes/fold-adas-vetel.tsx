import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Landmark } from "lucide-react";

export const Route = createFileRoute("/fold-adas-vetel")({
  head: () => ({
    meta: [
      { title: "Föld adás-vétel — Földbérleti" },
      { name: "description", content: "Termőföld adásvételi modul — hamarosan." },
      { property: "og:title", content: "Föld adás-vétel" },
      { property: "og:description", content: "Termőföld adásvételi folyamat — hamarosan elérhető." },
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
          A termőföld adásvételi modul fejlesztés alatt áll. Itt fogod tudni majd kezelni az
          adásvételi szerződéseket, az elővásárlási jog ellenőrzését és a jegyzői közzétételi
          folyamatot.
        </p>
        <Card className="p-6 mt-8">
          <div className="font-medium">Hamarosan</div>
          <p className="text-sm text-muted-foreground mt-2">
            Iratkozz fel a hírlevélre, hogy értesülj az indulásról.
          </p>
        </Card>
      </section>
    </PageShell>
  );
}