import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileSignature } from "lucide-react";

export const Route = createFileRoute("/elfogado-nyilatkozat")({
  head: () => ({
    meta: [
      { title: "Elfogadó nyilatkozat generátor — Földbérleti" },
      { name: "description", content: "Készítsd el az előhaszonbérleti elfogadó nyilatkozatot." },
      { property: "og:title", content: "Elfogadó nyilatkozat generátor" },
      { property: "og:description", content: "Előhaszonbérleti elfogadó nyilatkozat készítése." },
    ],
  }),
  component: AcceptancePage,
});

function AcceptancePage() {
  return (
    <PageShell>
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="flex items-center gap-3">
          <FileSignature className="h-8 w-8 text-primary" />
          <h1 className="font-serif text-3xl md:text-4xl">Elfogadó nyilatkozat generátor</h1>
        </div>
        <p className="mt-4 text-muted-foreground">
          Az elfogadó nyilatkozat generátor a kifüggesztett hirdetményből indítva érhető el. Válassz
          egy aktuális kifüggesztést, vagy futtasd le előbb a ranghely kalkulátort, hogy meghatározd
          a jogosultságodat.
        </p>
        <Card className="p-6 mt-8 space-y-3">
          <div className="font-medium">Hogyan indítsd?</div>
          <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-2">
            <li>Keresd meg a hirdetményt a kifüggesztések között.</li>
            <li>Ellenőrizd a ranghelyedet a kalkulátorral.</li>
            <li>Generáld le az elfogadó nyilatkozatot a bizonyítékok ellenőrzőlistájával.</li>
          </ol>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild><Link to="/kifuggesztesek">Kifüggesztések megnyitása</Link></Button>
            <Button asChild variant="outline"><Link to="/ranghely-kalkulator">Ranghely kalkulátor</Link></Button>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}