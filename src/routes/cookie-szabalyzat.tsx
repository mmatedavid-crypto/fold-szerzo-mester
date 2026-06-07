import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cookie-szabalyzat")({
  head: () => ({
    meta: [
      { title: "Süti tájékoztató — foldberletiszerzodes.hu" },
      { name: "description", content: "A foldberletiszerzodes.hu süti (cookie) használatáról szóló tájékoztató." },
    ],
  }),
  component: CookiePage,
});

function resetConsent() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("fbsz_cookie_consent_v1");
  window.location.reload();
}

function CookiePage() {
  return (
    <PageShell>
      <article className="container mx-auto px-4 py-12 max-w-3xl prose prose-stone dark:prose-invert">
        <h1 className="font-serif text-3xl">Süti (cookie) tájékoztató</h1>

        <h2>Mik azok a sütik?</h2>
        <p>
          A sütik kis adatcsomagok, amelyeket a böngésződ tárol. A működéshez nélkülözhetetlen,
          valamint statisztikai célú sütiket használunk.
        </p>

        <h2>Kötelező (szükséges) sütik</h2>
        <ul>
          <li><code>sb-*</code> — bejelentkezési session (Supabase Auth). Élettartam: max. 1 hét.</li>
          <li><code>fbsz_cookie_consent_v1</code> — süti-hozzájárulás emlékezése. Élettartam: 12 hónap.</li>
        </ul>

        <h2>Statisztikai sütik (csak hozzájárulással)</h2>
        <p>
          Anonim látogatottsági statisztika gyűjtésére használjuk. Egyéni azonosításra nem alkalmas
          adatok, az IP-cím anonimizálva. Csak akkor töltjük be, ha az alsó sávon az „Elfogadom” gombra kattintottál.
        </p>

        <h2>Marketing sütik</h2>
        <p>Marketing célú sütiket <strong>nem</strong> használunk.</p>

        <h2>Hozzájárulás visszavonása</h2>
        <p>A beállításodat bármikor módosíthatod:</p>
        <Button onClick={resetConsent} variant="outline">Süti beállítások újraindítása</Button>
      </article>
    </PageShell>
  );
}