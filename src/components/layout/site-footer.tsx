import { Link } from "@tanstack/react-router";
import { DrFoldLogo } from "@/components/brand/dr-fold-logo";
import { StampBadge } from "@/components/brand/brand-elements";
import { company, companyLegalDisclaimer, companyLegalLine } from "@/lib/company";

export function SiteFooter() {
  return (
    <footer className="border-t border-df-border bg-df-card">
      <div className="container mx-auto grid gap-10 px-4 py-10 text-sm md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <DrFoldLogo />
          <p className="mt-4 font-semibold text-df-green">Dr Föld — Ravasz a gazda.</p>
          <p className="mt-1 text-df-gray">{company.domain}</p>
          <p className="mt-2 text-df-gray">Nem vagyok ügyvéd, de tudom, hol állok a sorban.</p>
        </div>
        <div>
          <div className="mb-3 font-semibold text-df-ink">Szolgáltatás</div>
          <ul className="space-y-1 text-df-gray">
            <li>
              <Link to="/kifuggesztesek" className="hover:text-df-green">
                Kifüggesztések
              </Link>
            </li>
            <li>
              <Link to="/ranghely-kalkulator" className="hover:text-df-green">
                Ranghely kalkulátor
              </Link>
            </li>
            <li>
              <Link to="/berleti-dij-iranytu" className="hover:text-df-green">
                Ár iránytű
              </Link>
            </li>
            <li>
              <Link to="/foldberleti-szerzodes" className="hover:text-df-green">
                Bérleti szerződés
              </Link>
            </li>
            <li>
              <Link to="/elfogado-nyilatkozat" className="hover:text-df-green">
                Elfogadó nyilatkozat
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-semibold text-df-ink">Jogi tájékoztatás</div>
          <p className="text-df-gray">{companyLegalDisclaimer}</p>
          <p className="mt-3 text-xs text-df-gray">{companyLegalLine}</p>
          <ul className="mt-3 space-y-1 text-df-gray">
            <li>
              <Link to="/aszf" className="hover:text-df-green">
                ÁSZF
              </Link>
            </li>
            <li>
              <Link to="/adatkezeles" className="hover:text-df-green">
                Adatkezelés
              </Link>
            </li>
            <li>
              <Link to="/cookie-szabalyzat" className="hover:text-df-green">
                Süti tájékoztató
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-semibold text-df-ink">Kapcsolat</div>
          <ul className="space-y-1 text-df-gray">
            <li>
              <Link to="/dokumentum-ellenorzes" className="hover:text-df-green">
                Dokumentum ellenőrzése
              </Link>
            </li>
            <li>
              <a href={`mailto:${company.contactEmail}`} className="hover:text-df-green">
                {company.contactEmail}
              </a>
            </li>
            <li>{company.domain}</li>
          </ul>
          <StampBadge className="mt-4">Jogszerű megoldások</StampBadge>
        </div>
      </div>
      <div className="border-t border-df-border py-4 text-center text-xs text-df-gray">
        © {new Date().getFullYear()} Dr Föld — Nem ügyvédi képviselet.
      </div>
    </footer>
  );
}
