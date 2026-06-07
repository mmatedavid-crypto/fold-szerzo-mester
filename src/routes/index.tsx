import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { FileText, MapPinned, Scale, FileSignature, Landmark, Sprout, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Földbérleti Szerződés Generátor — gazdáknak, gyorsan és átláthatóan" },
      { name: "description", content: "Készíts termőföld-haszonbérleti szerződést pár lépésben, jogszabálykövető sablonok alapján." },
      { property: "og:title", content: "Földbérleti Szerződés Generátor" },
      { property: "og:description", content: "Termőföld-haszonbérleti szerződés gazdáknak, gyorsan és átláthatóan." },
    ],
  }),
  component: Index,
});

function Index() {
  const tools = [
    {
      icon: FileText,
      title: "Bérleti szerződés generáló",
      text: "Készíts termőföld-haszonbérleti szerződést vezetett kérdőív alapján.",
      to: "/szerzodes/uj",
      cta: "Szerződés készítése",
    },
    {
      icon: MapPinned,
      title: "Kifüggesztések",
      text: "Keresd a települési jegyzői közzétételeket és előhaszonbérleti hirdetményeket.",
      to: "/kifuggesztesek",
      cta: "Kifüggesztések böngészése",
    },
    {
      icon: Scale,
      title: "Ranghely kalkulátor",
      text: "Hasonlítsd össze az előhaszonbérleti ranghelyedet a szerződő féléivel.",
      to: "/ranghely-kalkulator",
      cta: "Ranghely számítása",
    },
    {
      icon: FileSignature,
      title: "Elfogadó nyilatkozat generátor",
      text: "Készítsd el az előhaszonbérleti elfogadó nyilatkozatot bizonyítékokkal együtt.",
      to: "/elfogado-nyilatkozat",
      cta: "Nyilatkozat készítése",
    },
    {
      icon: Landmark,
      title: "Föld adás-vétel",
      text: "Termőföld adásvételi folyamat — hamarosan elérhető.",
      to: "/fold-adas-vetel",
      cta: "Megnyitás",
    },
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

      {/* Tools */}
      <section className="container mx-auto px-4 py-12 border-t border-border">
        <h2 className="font-serif text-2xl md:text-3xl">Eszközök</h2>
        <p className="mt-2 text-muted-foreground">Válaszd ki, melyik modullal szeretnél dolgozni.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <Card key={t.title} className="p-6 flex flex-col">
              <t.icon className="h-7 w-7 text-primary" />
              <div className="font-serif text-lg mt-3">{t.title}</div>
              <p className="text-sm text-muted-foreground mt-2 flex-1">{t.text}</p>
              <Button asChild variant="outline" size="sm" className="mt-4 self-start">
                <Link to={t.to}>
                  {t.cta} <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
