import { Link } from "@tanstack/react-router";
import { DrFoldLogo } from "@/components/brand/dr-fold-logo";
import { StampBadge } from "@/components/brand/brand-elements";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t-2 border-df-border bg-df-cream">
      <div className="container mx-auto grid gap-8 px-4 py-10 text-sm md:grid-cols-3">
        <div>
          <DrFoldLogo className="scale-90 origin-left" />
          <p className="mt-4 font-brand text-lg font-black text-df-green">Ravasz a gazda.</p>
          <p className="mt-2 text-df-gray">
            Ha előrébb állsz, ne maradj hátul. Dr Föld segít ranghelyet nézni, kifüggesztést keresni
            és dokumentumot előkészíteni.
          </p>
        </div>
        <div>
          <div className="mb-2 font-brand font-black text-df-green">Szolgáltatás</div>
          <ul className="space-y-1 text-df-gray">
            <li>
              <Link to="/arak" className="hover:text-primary">
                Árak
              </Link>
            </li>
            <li>
              <Link to="/kifuggesztesek" className="hover:text-primary">
                Kifüggesztések keresése
              </Link>
            </li>
            <li>
              <Link to="/ranghely-kalkulator" className="hover:text-primary">
                Ranghely kalkulátor
              </Link>
            </li>
            <li>
              <Link to="/foldberleti-szerzodes" className="hover:text-primary">
                Földbérleti szerződés
              </Link>
            </li>
            <li>
              <Link to="/berleti-dij-iranytu" className="hover:text-primary">
                Bérleti díj iránytű
              </Link>
            </li>
            <li>
              <Link to="/dokumentum-ellenorzes" className="hover:text-primary">
                Dokumentum ellenőrzése
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-brand font-black text-df-green">Jogi tájékoztatás</div>
          <StampBadge>Ravasz, de szabályos</StampBadge>
          <p className="mt-3 text-df-gray">
            A Dr Föld dokumentumgeneráló és döntéstámogató szolgáltatás, nem ügyvédi iroda. Egyedi,
            vitás vagy nagy értékű ügyben ügyvédi ellenőrzés javasolt.
          </p>
          <ul className="mt-3 space-y-1 text-df-gray">
            <li>
              <Link to="/aszf" className="hover:text-primary">
                ÁSZF
              </Link>
            </li>
            <li>
              <Link to="/adatkezeles" className="hover:text-primary">
                Adatkezelési tájékoztató
              </Link>
            </li>
            <li>
              <Link to="/cookie-szabalyzat" className="hover:text-primary">
                Süti tájékoztató
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-df-border py-4 text-center text-xs text-df-gray">
        © {new Date().getFullYear()} Dr Föld — Nem ügyvédi képviselet.
      </div>
    </footer>
  );
}
