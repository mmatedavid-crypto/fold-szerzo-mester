import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
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
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PageShell>
      <article className="container mx-auto px-4 py-12 max-w-3xl prose prose-stone dark:prose-invert">
        <h1 className="font-serif text-3xl">Adatkezelési tájékoztató</h1>
        <p className="text-sm text-muted-foreground">
          Az Európai Parlament és a Tanács (EU) 2016/679 rendelete (GDPR), valamint a 2011. évi
          CXII. tv. (Infotv.) alapján.
        </p>

        <h2>1. Adatkezelő</h2>
        <p>
          <strong>{company.legalName}</strong> (székhely: {company.registeredSeat}, cégjegyzékszám:{" "}
          {company.companyRegistrationNumber}, adószám: {company.taxNumber}, e-mail:{" "}
          <a href={`mailto:${company.contactEmail}`}>{company.contactEmail}</a>).
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
              <td>Név, e-mail, jelszó-hash (OAuth esetén külső azonosító)</td>
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
              <td>Generált PDF, dokumentum-hash, kibocsátási napló</td>
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
            <strong>Cloudflare</strong> (hosting, CDN) — EU adatközpontok.
          </li>
          <li>
            <strong>Apple, Google</strong> — OAuth bejelentkezés (csak ha a Felhasználó választja).
          </li>
          <li>
            Fizetési szolgáltató — a megrendeléstől függően (pl. SimplePay), részleteit a fizetés
            előtt megjelenítjük.
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
          Az adatok titkosított csatornán (TLS) közlekednek. A jelszavak egyirányú hash-eléssel
          kerülnek tárolásra. A szerződés-fájlok privát storage bucketben, aláírt URL-en keresztül
          érhetők el. Sor-szintű biztonsági szabályok (RLS) garantálják, hogy minden felhasználó
          csak a saját adataihoz fér hozzá.
        </p>

        <h2>6. Adatvédelmi hatóság</h2>
        <p>
          Panasszal a <strong>Nemzeti Adatvédelmi és Információszabadság Hatóságnál</strong> (NAIH)
          lehet élni: 1055 Budapest, Falk Miksa utca 9-11.,{" "}
          <a href="https://naih.hu" target="_blank" rel="noreferrer">
            naih.hu
          </a>
          .
        </p>
      </article>
    </PageShell>
  );
}
