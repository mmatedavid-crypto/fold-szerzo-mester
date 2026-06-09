import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { BrandBadge } from "@/components/brand/brand-elements";
import { company } from "@/lib/company";

export const Route = createFileRoute("/adatkezeles")({
  head: () => ({
    meta: [
      { title: "Adatkezelési tájékoztató | Dr Föld" },
      {
        name: "description",
        content:
          "GDPR alapú adatkezelési tájékoztató a Dr Föld dokumentumgeneráló és döntéstámogató szolgáltatáshoz.",
      },
      { property: "og:title", content: "Adatkezelési tájékoztató | Dr Föld" },
      {
        property: "og:description",
        content:
          "GDPR alapú adatkezelési tájékoztató a Dr Föld dokumentumgeneráló és döntéstámogató szolgáltatáshoz.",
      },
    ],
    links: [{ rel: "canonical", href: `${company.websiteUrl}/adatkezeles` }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PageShell>
      <article className="container mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 rounded-lg border border-df-border bg-df-card p-6 shadow-[0_18px_45px_rgba(26,26,26,0.08)]">
          <BrandBadge>Jogi tájékoztatás</BrandBadge>
          <h1 className="mt-4 font-brand text-4xl font-bold leading-tight text-df-green">
            Adatkezelési tájékoztató
          </h1>
          <p className="mt-3 text-sm leading-6 text-df-gray">
            Az Európai Parlament és a Tanács (EU) 2016/679 rendelete (GDPR), valamint a 2011. évi
            CXII. tv. (Infotv.) alapján.
          </p>
        </div>
        <div className="prose prose-stone max-w-none dark:prose-invert prose-headings:font-brand prose-headings:text-df-green prose-a:text-df-green">
          <h2>1. Adatkezelő</h2>
          <p>
            <strong>{company.legalName}</strong> (székhely: {company.registeredSeat},
            cégjegyzékszám: {company.companyRegistrationNumber}, adószám: {company.taxNumber},
            e-mail: <a href={`mailto:${company.contactEmail}`}>{company.contactEmail}</a>).
          </p>

          <h2>2. Kezelt adatok és célok</h2>
          <table>
            <thead>
              <tr>
                <th>Adatkör</th>
                <th>Cél</th>
                <th>Jogalap</th>
                <th>Tárolási idő</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Név, e-mail, bejelentkezési azonosítók</td>
                <td>Fiók létrehozása, bejelentkezés</td>
                <td>Szerződés teljesítése (GDPR 6(1)(b))</td>
                <td>Fiók törléséig</td>
              </tr>
              <tr>
                <td>Szerződés-vázlat: felek adatai, helyrajzi szám, díj, stb.</td>
                <td>Dokumentum előkészítése</td>
                <td>Szerződés teljesítése (GDPR 6(1)(b))</td>
                <td>Fiók törléséig vagy 5 év</td>
              </tr>
              <tr>
                <td>Generált PDF, dokumentum-ellenőrző lenyomat, kibocsátási napló</td>
                <td>Dokumentum hitelességének ellenőrzése</td>
                <td>Szerződés + jogi kötelezettség (GDPR 6(1)(b)+(c))</td>
                <td>8 év (számviteli)</td>
              </tr>
              <tr>
                <td>Fizetési adatok (összeg, tranzakció-azonosító)</td>
                <td>Számlázás, könyvelés</td>
                <td>Jogi kötelezettség (GDPR 6(1)(c))</td>
                <td>8 év (Sztv.)</td>
              </tr>
              <tr>
                <td>Használati napló (IP, böngésző, művelet)</td>
                <td>Biztonság, visszaélés-megelőzés</td>
                <td>Jogos érdek (GDPR 6(1)(f))</td>
                <td>Max. 1 év</td>
              </tr>
            </tbody>
          </table>

          <h2>3. Adatfeldolgozók</h2>
          <ul>
            <li>
              <strong>Supabase</strong> (adatbázis, fájltárolás, auth) — EU régió.
            </li>
            <li>
              <strong>Tárhely- és CDN szolgáltató</strong> — az éles környezetben használt hosting
              és tartalomszolgáltatási infrastruktúra.
            </li>
            <li>
              <strong>Apple, Google</strong> — OAuth bejelentkezés (csak ha a Felhasználó
              választja).
            </li>
            <li>
              Fizetési szolgáltató — a megrendeléstől és az éles fizetési integrációtól függően,
              részleteit a fizetés előtt megjelenítjük.
            </li>
          </ul>

          <h2>4. Az érintett jogai</h2>
          <p>Az érintett bármikor kérheti:</p>
          <ul>
            <li>
              <strong>Tájékoztatást</strong> a kezelt adatairól
            </li>
            <li>
              <strong>Helyesbítést</strong> hibás adat esetén
            </li>
            <li>
              <strong>Adathordozhatóságot</strong> — strukturált export (JSON)
            </li>
            <li>
              <strong>Törlést</strong> (elfelejtéshez való jog) a számviteli korlátok között
            </li>
            <li>
              <strong>Korlátozást</strong>, illetve <strong>tiltakozást</strong> a jogos érdeken
              alapuló kezelés ellen
            </li>
          </ul>
          <p>
            Az adatexport és fiók-törlés a bejelentkezett <a href="/dashboard">Műhelyben</a> egy
            kattintással kezdeményezhető, vagy írhatsz a {company.contactEmail} címre.
          </p>

          <h2>5. Adatbiztonság</h2>
          <p>
            Az adatok titkosított csatornán (TLS) közlekednek. A jelszavakat nem visszafejthető
            formában kezeljük. A szerződés-fájlok védett tárhelyen, időkorlátos elérési linken
            keresztül érhetők el. Jogosultsági szabályok biztosítják, hogy minden felhasználó csak a
            saját adataihoz férjen hozzá.
          </p>

          <h2>6. Adatvédelmi hatóság</h2>
          <p>
            Panasszal a <strong>Nemzeti Adatvédelmi és Információszabadság Hatóságnál</strong>{" "}
            (NAIH) lehet élni: 1055 Budapest, Falk Miksa utca 9-11.,{" "}
            <a href="https://naih.hu" target="_blank" rel="noreferrer">
              naih.hu
            </a>
            .
          </p>
        </div>
      </article>
    </PageShell>
  );
}
