import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/50 mt-16">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <div className="font-serif text-base font-semibold text-primary">foldberletiszerzodes.hu</div>
          <p className="mt-2 text-muted-foreground">
            Termőföld haszonbérleti szerződés-előkészítő szolgáltatás gazdáknak és földtulajdonosoknak.
          </p>
        </div>
        <div>
          <div className="font-medium mb-2">Szolgáltatás</div>
          <ul className="space-y-1 text-muted-foreground">
            <li><Link to="/arak" className="hover:text-primary">Árak</Link></li>
            <li><Link to="/kifuggesztesek" className="hover:text-primary">Kifüggesztések keresése</Link></li>
            <li><Link to="/berleti-dij-iranytu" className="hover:text-primary">Bérleti díj iránytű</Link></li>
            <li><Link to="/dokumentum-ellenorzes" className="hover:text-primary">Dokumentum ellenőrzése</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-medium mb-2">Jogi tájékoztatás</div>
          <p className="text-muted-foreground">
            A szerződésminták jogi szakértő által karbantartott, verziózott klauzulatár alapján készülnek.
            A generált dokumentum szerződés-előkészítő irat. Egyedi, vitás vagy nagy értékű ügyben
            ügyvédi ellenőrzés javasolt.
          </p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} foldberletiszerzodes.hu — Nem ügyvédi képviselet.
      </div>
    </footer>
  );
}