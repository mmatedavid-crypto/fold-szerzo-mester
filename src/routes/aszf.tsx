import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { BrandBadge } from "@/components/brand/brand-elements";
import { company } from "@/lib/company";

export const Route = createFileRoute("/aszf")({
  head: () => ({
    meta: [
      { title: "Általános Szerződési Feltételek | Dr Föld" },
      {
        name: "description",
        content: "A Dr Föld dokumentumgeneráló és döntéstámogató szolgáltatás ÁSZF-je.",
      },
    ],
  }),
  component: AszfPage,
});

function AszfPage() {
  return (
    <PageShell>
      <article className="container mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 rounded-lg border border-df-border bg-df-card p-6 shadow-[0_18px_45px_rgba(26,26,26,0.08)]">
          <BrandBadge>Jogi tájékoztatás</BrandBadge>
          <h1 className="mt-4 font-brand text-4xl font-bold leading-tight text-df-green">
            Általános Szerződési Feltételek
          </h1>
          <p className="mt-3 text-sm leading-6 text-df-gray">
            Hatályos: {new Date().getFullYear()}. január 1-től
          </p>
        </div>
        <div className="prose prose-stone max-w-none dark:prose-invert prose-headings:font-brand prose-headings:text-df-green prose-a:text-df-green">
          <h2>1. A Szolgáltató</h2>
          <p>
            Üzemeltető: <strong>{company.legalName}</strong> (székhely: {company.registeredSeat},
            cégjegyzékszám: {company.companyRegistrationNumber}, adószám: {company.taxNumber},
            e-mail: <a href={`mailto:${company.contactEmail}`}>{company.contactEmail}</a>). A
            szolgáltatás a <a href={company.websiteUrl}>{company.domain}</a> domain alatt érhető el.
          </p>

          <h2>2. A szolgáltatás tárgya</h2>
          <p>
            A Szolgáltató termőföld haszonbérleti szerződések előkészítéséhez nyújt online
            dokumentum-generáló szolgáltatást. A generált PDF dokumentum{" "}
            <strong>szerződés-előkészítő irat</strong>; nem minősül ügyvédi képviseletnek vagy
            egyedi jogi tanácsadásnak. A sablon a 2013. évi CXXII. törvény (Földforgalmi tv.) és a
            Polgári Törvénykönyv aktuális rendelkezésein alapul.
          </p>

          <h2>3. Regisztráció és felhasználói fiók</h2>
          <p>
            A szolgáltatás regisztrációhoz kötött. A Felhasználó köteles valós adatokat megadni és a
            jelszavát biztonságosan kezelni. Apple és Google fiókkal történő bejelentkezés is
            elérhető.
          </p>

          <h2>4. Díjak és fizetés</h2>
          <p>
            Az aktuális díjak az <a href="/arak">Árak</a> oldalon érhetők el. Egyszeri vásárlás
            esetén a Felhasználó egy szerződés generálására jogosult; előfizetés esetén az éves
            keret szerint. A megrendelést követően elektronikus számla kerül kiállításra.
          </p>

          <h2>5. Elállási jog</h2>
          <p>
            A 45/2014. (II. 26.) Korm. rendelet 29. § (1) bek. m) pontja alapján a digitális
            tartalom (generált PDF) szolgáltatása megkezdésével — a Felhasználó kifejezett előzetes
            hozzájárulásával — az elállási jog megszűnik. Le nem töltött kreditre az elállás 14
            napon belül gyakorolható.
          </p>

          <h2>6. Felelősség</h2>
          <p>
            A Szolgáltató mindent megtesz a sablonok jogi naprakészségéért, de nem szavatolja, hogy
            minden egyedi esetre alkalmazható. A generált dokumentum tartalmáért, valódiságáért és
            felhasználásáért a Felhasználó felel. Vitás vagy nagy értékű ügyben ügyvédi ellenőrzés
            javasolt. A Szolgáltató felelőssége legfeljebb a kifizetett díj erejéig terjed.
          </p>

          <h2>7. Szellemi tulajdon</h2>
          <p>
            A sablonok, a klauzulatár és a szolgáltatás kódbázisa a Szolgáltató szellemi tulajdona.
            A generált egyedi szerződés a Felhasználó tulajdona, szabadon felhasználható.
          </p>

          <h2>8. Adatkezelés</h2>
          <p>
            Részletek az <a href="/adatkezeles">Adatkezelési tájékoztatóban</a>. A süti használatról
            a <a href="/cookie-szabalyzat">Süti tájékoztató</a> rendelkezik.
          </p>

          <h2>9. Panaszkezelés és jogviták</h2>
          <p>
            Panaszait a <a href={`mailto:${company.contactEmail}`}>{company.contactEmail}</a> címen
            jelentheti be. A jogvitákra a magyar jog az irányadó, az Európai Bizottság online
            vitarendezési platformja elérhető:{" "}
            <a href="https://ec.europa.eu/odr" target="_blank" rel="noreferrer">
              ec.europa.eu/odr
            </a>
            .
          </p>

          <h2>10. ÁSZF módosítása</h2>
          <p>
            A Szolgáltató fenntartja a jogot az ÁSZF egyoldalú módosítására. A módosításról a
            Felhasználót e-mailben vagy a felületen tájékoztatja a hatálybalépés előtt legalább 15
            nappal.
          </p>
        </div>
      </article>
    </PageShell>
  );
}
