import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, FileSignature } from "lucide-react";

export const Route = createFileRoute("/elfogado-nyilatkozat")({
  head: () => ({
    meta: [
      { title: "Elfogadó nyilatkozat előkészítése | Dr Föld" },
      {
        name: "description",
        content:
          "Készíts elő előhaszonbérleti elfogadó nyilatkozatot a ranghely, jogalap, határidő és igazolások ellenőrzésével.",
      },
      { property: "og:title", content: "Elfogadó nyilatkozat előkészítése | Dr Föld" },
      {
        property: "og:description",
        content: "Előhaszonbérleti nyilatkozat előkészítése ranghely- és határidő-ellenőrzéssel.",
      },
    ],
  }),
  component: AcceptancePage,
});

function AcceptancePage() {
  return (
    <PageShell>
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex items-center gap-3">
          <FileSignature className="h-8 w-8 text-primary" />
          <h1 className="font-serif text-3xl md:text-4xl">Elfogadó nyilatkozat előkészítése</h1>
        </div>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          Az elfogadó nyilatkozatot csak akkor érdemes indítani, ha a kifüggesztett haszonbérleti
          szerződés, a 15 napos jogvesztő határidő, az előhaszonbérleti jogalap, a törvény szerinti
          ranghely és az igazoló okiratok is rendben vannak.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="p-6 space-y-3">
            <div className="font-medium">Hogyan indítsd?</div>
            <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-2">
              <li>Keresd meg a hirdetményt a kifüggesztések között.</li>
              <li>Ellenőrizd a ranghelyedet a kalkulátorral.</li>
              <li>Gyűjtsd össze a jogalapot bizonyító okiratokat.</li>
              <li>
                Az elkészült nyilatkozatot teljes bizonyító erejű magánokirati formában írd alá.
              </li>
            </ol>
          </Card>
          <Card className="border-primary/20 bg-primary text-primary-foreground p-6 space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-5 w-5" />
              Kötelező ellenőrzési pontok
            </div>
            <ul className="space-y-2 text-sm text-primary-foreground/90">
              <li>Kifüggesztett szerződés azonosítása</li>
              <li>15 napos jogvesztő határidő</li>
              <li>Jogalap és törvény szerinti ranghely</li>
              <li>Igazoló okiratok csatolása</li>
              <li>Aláírás, tanúk vagy más hiteles okirati forma</li>
            </ul>
          </Card>
        </div>
        <Card className="p-6 mt-4 border-destructive/30 bg-destructive/5">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
            <p className="text-sm text-muted-foreground">
              A Dr Föld dokumentumgeneráló és döntéstámogató szolgáltatás, nem ügyvédi iroda.
              Egyedi, vitás vagy nagy értékű ügyben ügyvédi ellenőrzés javasolt.
            </p>
          </div>
        </Card>
        <Card className="p-6 mt-4 space-y-3">
          <div className="font-medium">Készen állsz?</div>
          <p className="text-sm text-muted-foreground">
            A generálás a kifüggesztésből vagy a ranghely kalkulátor eredményéből indul, hogy a
            nyilatkozat ne a semmiből készüljön, hanem konkrét hirdetményhez, határidőhöz és
            jogalaphoz kapcsolódjon.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild>
              <Link to="/kifuggesztesek">Kifüggesztések megnyitása</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/ranghely-kalkulator">Ranghely kalkulátor</Link>
            </Button>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
